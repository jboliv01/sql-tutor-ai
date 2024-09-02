# llm_sql_wrapper.py

import os
import json
import re
from datetime import datetime, date
import psycopg2
from psycopg2 import errors
from psycopg2.extras import RealDictCursor
import logging
from langchain.chains import LLMChain
from langchain_core.prompts import ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage
from langchain.chains.conversation.memory import ConversationBufferWindowMemory
from langchain_groq import ChatGroq
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import time
import sqlparse
from decimal import Decimal

class LLMSQLWrapper:
    def __init__(self, db_config):
        self.superuser_config = db_config
        self.user_connections = {}
        self.groq_api_key = os.getenv('GROQ_API_KEY')
        if not self.groq_api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        self.model = 'llama-3.1-70b-versatile'
        self.groq_chat = ChatGroq(groq_api_key=self.groq_api_key, model_name=self.model)
        self.memory = ConversationBufferWindowMemory(k=5, memory_key="chat_history", return_messages=True)

        # Apply retry logic to the sequence and table creation
        self.create_sequences_and_tables()

    def get_superuser_connection(self):
        return psycopg2.connect(**self.superuser_config)

    def get_user_connection(self, user_id):
        if user_id not in self.user_connections:
            try:
                # Here, we're assuming that each user has their own database or schema
                # You might need to adjust this based on your specific database setup
                user_config = self.superuser_config.copy()
                user_config['dbname'] = f"user_{user_id}"  # or adjust as needed
                self.user_connections[user_id] = psycopg2.connect(**user_config)
            except psycopg2.OperationalError as e:
                logging.error(f"Failed to connect for user {user_id}: {str(e)}")
                raise
        return self.user_connections[user_id]

    def create_sequences_and_tables(self):
        try:
            logging.info("Creating sequences and tables...")
            with self.get_superuser_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS users (
                            id SERIAL PRIMARY KEY,
                            email VARCHAR(100) UNIQUE NOT NULL,
                            google_id VARCHAR(100) UNIQUE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );

                        CREATE TABLE IF NOT EXISTS query_history (
                            id BIGSERIAL PRIMARY KEY,
                            user_id INTEGER NOT NULL,
                            query_definition TEXT NOT NULL,
                            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            results JSONB
                        );

                        CREATE TABLE IF NOT EXISTS question_history (
                            id BIGSERIAL PRIMARY KEY,
                            user_id INTEGER NOT NULL,
                            category VARCHAR,
                            question TEXT,
                            tables TEXT,
                            hint TEXT,
                            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );

                        CREATE TABLE IF NOT EXISTS submission_history (
                            id BIGSERIAL PRIMARY KEY,
                            user_id INTEGER NOT NULL,
                            question_id BIGINT,
                            correctness_score INT,
                            efficiency_score INT,
                            style_score INT,
                            overall_feedback TEXT,
                            pass_fail BOOLEAN,
                            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );

                        -- Enable Row Level Security
                        ALTER TABLE query_history ENABLE ROW LEVEL SECURITY;
                        ALTER TABLE question_history ENABLE ROW LEVEL SECURITY;
                        ALTER TABLE submission_history ENABLE ROW LEVEL SECURITY;

                        -- Create policies if they don't exist
                        DO $$
                        BEGIN
                            IF NOT EXISTS (
                                SELECT 1 FROM pg_policies 
                                WHERE tablename = 'query_history' AND policyname = 'query_history_isolation_policy'
                            ) THEN
                                CREATE POLICY query_history_isolation_policy ON query_history
                                    USING (user_id = current_setting('app.current_user_id')::INTEGER);
                            END IF;

                            IF NOT EXISTS (
                                SELECT 1 FROM pg_policies 
                                WHERE tablename = 'question_history' AND policyname = 'question_history_isolation_policy'
                            ) THEN
                                CREATE POLICY question_history_isolation_policy ON question_history
                                    USING (user_id = current_setting('app.current_user_id')::INTEGER);
                            END IF;

                            IF NOT EXISTS (
                                SELECT 1 FROM pg_policies 
                                WHERE tablename = 'submission_history' AND policyname = 'submission_history_isolation_policy'
                            ) THEN
                                CREATE POLICY submission_history_isolation_policy ON submission_history
                                    USING (user_id = current_setting('app.current_user_id')::INTEGER);
                            END IF;
                        END
                        $$;

                        -- Function to set current user
                        CREATE OR REPLACE FUNCTION set_current_user(p_user_id INTEGER)
                        RETURNS VOID AS $$
                        BEGIN
                            PERFORM set_config('app.current_user_id', p_user_id::TEXT, FALSE);
                        END;
                        $$ LANGUAGE plpgsql;

                        -- Sample public dataset
                        CREATE TABLE IF NOT EXISTS public.sample_dataset (
                            id SERIAL PRIMARY KEY,
                            name VARCHAR(100),
                            value INTEGER
                        );

                        GRANT SELECT ON public.sample_dataset TO PUBLIC;
                    """)
                    conn.commit()
            logging.info("Tables and sequences created or already exist.")
        except Exception as e:
            logging.error(f"Error creating sequences and tables: {str(e)}")
            raise

    def get_schema(self, user_id):
        schema = []
        with self.get_user_connection(user_id) as conn:
            with conn.cursor() as cur:
                # Get the user's schema and public schema
                cur.execute(f"""
                    SELECT schema_name 
                    FROM information_schema.schemata 
                    WHERE schema_name = 'public' OR schema_name = 'user_{user_id}'
                """)
                schemas = cur.fetchall()

                for schema_name in schemas:
                    schema_name = schema_name[0]

                    # Get tables for each schema
                    cur.execute("""
                        SELECT table_name 
                        FROM information_schema.tables 
                        WHERE table_schema = %s
                    """, (schema_name,))
                    tables = cur.fetchall()

                    schema_item = {
                        "id": f"schema-{schema_name}",
                        "label": schema_name,
                        "children": []
                    }

                    for table in tables:
                        table_name = table[0]
                        cur.execute("""
                            SELECT column_name, data_type 
                            FROM information_schema.columns 
                            WHERE table_schema = %s AND table_name = %s
                        """, (schema_name, table_name))
                        columns = cur.fetchall()

                        table_item = {
                            "id": f"table-{schema_name}-{table_name}",
                            "label": table_name,
                            "children": [
                                {
                                    "id": f"column-{schema_name}-{table_name}-{column[0]}",
                                    "label": f"{column[0]} ({column[1]})"
                                } for column in columns
                            ]
                        }
                        schema_item["children"].append(table_item)

                    schema.append(schema_item)

        return schema

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((psycopg2.OperationalError, psycopg2.InterfaceError)),
        before_sleep=lambda retry_state: time.sleep(0.1)  # Small delay before retry
    )
    def execute_with_retry(self, query, params=None):
        with self.get_superuser_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, params)
                if cur.description:
                    return cur.fetchall()
                return None

    def execute_query(self, query, user_id):
        try:
            statements = sqlparse.split(query)
            results = []

            with self.get_user_connection(user_id) as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f"SET search_path TO user_{user_id}, public")

                    for statement in statements:
                        stmt = statement.strip()
                        if not stmt:
                            continue

                        stmt_type = sqlparse.parse(stmt)[0].get_type()

                        if stmt_type == 'CREATE':
                            result = self.handle_create_statement(cur, stmt, user_id)
                            results.append({
                                "type": "message",
                                "content": result["message"]
                            })
                        else:
                            cur.execute(stmt)
                            if cur.description:
                                columns = [desc[0] for desc in cur.description]
                                rows = cur.fetchall()
                                results.append({
                                    "type": "table",
                                    "columns": columns,
                                    "rows": rows
                                })
                            else:
                                results.append({
                                    "type": "message",
                                    "content": f"{cur.rowcount} rows affected"
                                })

                    conn.commit()

            # Add to query history
            self.add_to_query_history(query, results, user_id)

            return results

        except errors.InsufficientPrivilege as e:
            logging.error(f"Insufficient privilege: {str(e)}")
            raise errors.InsufficientPrivilege(f"Permission denied: {str(e)}")
        except Exception as e:
            logging.error(f"Error executing query: {str(e)}")
            raise

    def handle_create_statement(self, cur, sql, user_id):
        match = re.search(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)', sql, re.IGNORECASE)
        if not match:
            raise ValueError("Invalid CREATE TABLE syntax")
        
        table_name = match.group(1)

        if not re.match(r'^[a-z][a-z0-9_]{2,62}$', table_name):
            raise ValueError("Invalid table name")

        user_table_count = self.get_user_table_count(user_id)
        if user_table_count >= 10:  # Assuming MAX_TABLES_PER_USER is 10
            raise ValueError("Table limit reached")

        modified_sql = sql.replace(f'CREATE TABLE {table_name}', 
                                   f'CREATE TABLE user_{user_id}.{table_name}')

        cur.execute(modified_sql)
        return {"message": f"Table {table_name} created successfully"}

    def get_user_table_count(self, user_id):
        return self.execute_with_retry("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = %s
        """, (f'user_{user_id}',))[0]['count']

    def add_to_query_history(self, query, results, user_id):
        limited_results = results[:100] if results else []
        self.execute_with_retry("""
            INSERT INTO query_history (user_id, query_definition, timestamp, results)
            VALUES (%s, %s, %s, %s)
        """, (user_id, query, datetime.now(), json.dumps(limited_results)))

    def get_query_history(self, user_id, limit=5):
        return self.execute_with_retry(f"""
            SELECT query_definition, timestamp, results
            FROM query_history
            WHERE user_id = %s
            ORDER BY timestamp DESC
            LIMIT {limit}
        """, (user_id,))

    def ask_question(self, question, user_id, is_practice=False, category=None):
        if is_practice:
            return self.generate_practice_question(category, user_id)

        logging.info(f"Received question: {question}")

        query_history = self.get_query_history(user_id, limit=3)
        history_str = ""
        for item in query_history:
            results_dict = item['results']
            top_results = results_dict[:10]
            history_str += f"Query: {item['query_definition']}\nTimestamp: {item['timestamp']}\n"
            history_str += f"Results summary: {len(results_dict)} total results. Top 10 results:\n"
            history_str += json.dumps(top_results, indent=2) + "\n\n"

        schema_str = str(self.get_schema(user_id))
        system_prompt = f"""You are an AI assistant that provides information about SQL queries and their results based on the query history.
        Database schema: {schema_str}

        Recent query history:
        {history_str}

        Answer the user's question based on the provided context. If you can't answer the question based on the given information, say so."""

        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            HumanMessagePromptTemplate.from_template("{human_input}")
        ])

        conversation = LLMChain(
            llm=self.groq_chat,
            prompt=prompt,
            verbose=True,
            memory=self.memory,
        )

        try:
            logging.debug(f"Sending request to Groq API with prompt: {prompt}")
            generated_response = conversation.predict(human_input=question)
            logging.info(f"Generated response: {generated_response}")
            return generated_response
        except Exception as e:
            logging.error(f"Error generating response: {str(e)}")
            return f"I apologize, but I encountered an error while processing your question. Error details: {str(e)}"

    def generate_practice_question(self, category, user_id):
        schema_str = str(self.get_schema(user_id))
        system_prompt = f"""You are an AI assistant that generates SQL practice questions.
            Database schema: {schema_str}

            Generate a unique SQL practice question for the category: {category}
            The question should be challenging but solvable using the provided schema.
            Try to use a variety of tables in your questions.

            Your response must strictly follow this format:

            Question: [Your question here]

            Category: {category}

            Tables: [Comma-separated list of relevant tables in the format user_schema.table_name]

            Hint: [Provide a hint here]

            Ensure that:
            1. The "Question" section contains the full question text with SQL keywords in ALL CAPS.
            2. The "Tables" section lists only the table names, separated by commas.
            3. The "Hint" section provides a brief, helpful hint for solving the question.
            4. Do not include any additional text or explanations outside of these sections.
            """
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=system_prompt),
            HumanMessagePromptTemplate.from_template("Generate a SQL practice question for the {category} category.")
        ])
        conversation = LLMChain(
            llm=self.groq_chat,
            prompt=prompt,
            verbose=True,
        )
        try:
            generated_response = conversation.predict(category=category)
            # Parse the generated response using more specific regex patterns
            category_match = re.search(r'Category:\s*(.+?)\s*\n', generated_response)
            question_match = re.search(r'Question:\s*(.+?)\s*\n', generated_response, re.DOTALL)
            tables_match = re.search(r'Tables:\s*(.+?)\s*\n', generated_response)
            hint_match = re.search(r'Hint:\s*(.+?)\s*$', generated_response, re.DOTALL)

            category = category_match.group(1).strip() if category_match else category
            question = question_match.group(1).strip() if question_match else ""
            tables = tables_match.group(1).strip() if tables_match else ""
            hint = hint_match.group(1).strip() if hint_match else ""

            # Store the parsed question in the question_history table
            result = self.execute_with_retry("""
            INSERT INTO question_history (user_id, category, question, tables, hint)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
            """, (user_id, category, question, tables, hint))
            question_id = result[0]['id']
            logging.info(f"Generated question with ID: {question_id}")

            return {
                "id": str(question_id),
                "category": category,
                "question": question,
                "tables": tables,
                "hint": hint
            }
        except Exception as e:
            logging.error(f"Error generating practice question: {str(e)}")
            return None

    def get_practice_question(self, question_id, user_id):
        return self.execute_with_retry("""
            SELECT id, category, question, tables, hint, timestamp
            FROM question_history
            WHERE id = %s AND user_id = %s
        """, (question_id, user_id))

    def validate_solution(self, sql_query, results, question_id, user_id):
        schema_str = str(self.get_schema(user_id))

        # Handle default question
        if question_id == '-1':
            category = "Basic SQL Syntax"
            question_text = f"Select the top 5 rows from your schema's sample_users table."
        else:
            # Fetch the current question from the database
            question_result = self.execute_with_retry("""
                SELECT category, question
                FROM question_history
                WHERE id = %s AND user_id = %s
            """, (question_id, user_id))

            if not question_result:
                raise ValueError(f"No question found with id {question_id}")

            category, question_text = question_result[0]['category'], question_result[0]['question']

        logging.info(f"Validating solution for question ID: {question_id}")
        logging.info(f"Question category: {category}")
        logging.info(f"Question text: {question_text[:100]}...") # Log first 100 chars of question

        system_prompt = f"""You are an AI assistant that validates SQL solutions for practice questions.
        Database schema: {schema_str}

        Question Category: {category}
        Question: {question_text}
        Submitted SQL query: {sql_query}
        Query results (top 10 records): {json.dumps(results[:10], indent=2)}

        Analyze the submitted SQL query and its results. Provide concise feedback on:
        1. Correctness (Score /10): Does the query correctly solve the problem? Briefly explain why or why not.
        2. Efficiency (Score /10): Is the query optimized? Suggest improvements if needed.
        3. Style (Score /10): Does the query follow good SQL practices? Offer specific style suggestions.

        Format your response as follows:
        Correctness (X/10): [Brief explanation]
        Efficiency (X/10): [Brief explanation]
        Style (X/10): [Brief explanation]

        Overall feedback: [2-3 sentences summarizing the main points and offering encouragement]

        Improvement suggestions:
        - [Bullet point 1]
        - [Bullet point 2]
        - [Bullet point 3 (if needed)]

        Keep your total response under 250 words.
        """

        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=system_prompt),
            HumanMessagePromptTemplate.from_template("Please validate this SQL solution and provide feedback.")
        ])

        conversation = LLMChain(
            llm=self.groq_chat,
            prompt=prompt,
            verbose=True,
        )

        try:
            feedback = conversation.predict()

            # Parse the feedback to extract scores and overall feedback
            correctness_score = int(re.search(r'Correctness \((\d+)/10\)', feedback).group(1))
            efficiency_score = int(re.search(r'Efficiency \((\d+)/10\)', feedback).group(1))
            style_score = int(re.search(r'Style \((\d+)/10\)', feedback).group(1))
            overall_feedback = re.search(r'Overall feedback: (.+?)(?=\n\n|$)', feedback, re.DOTALL).group(1).strip()

            # Calculate pass/fail
            average_score = (correctness_score + efficiency_score + style_score) / 3
            pass_fail = average_score >= 7 and min(correctness_score, efficiency_score, style_score) >= 5

            # Insert the submission record
            self.execute_with_retry("""
                INSERT INTO submission_history 
                (user_id, question_id, correctness_score, efficiency_score, style_score, overall_feedback, pass_fail)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (user_id, question_id if question_id != '-1' else None, correctness_score, efficiency_score, style_score, overall_feedback, pass_fail))

            logging.info(f"Inserted submission record for question ID: {question_id}, Pass/Fail: {pass_fail}")

            # Include pass/fail in the feedback
            feedback += f"\n\nOverall Result: {'Pass' if pass_fail else 'Fail'}"

            return feedback
        except Exception as e:
            logging.error(f"Error validating solution: {str(e)}")
            raise

    def get_submission_history(self, user_id):
        query = """
        WITH ranked_submissions AS (
            SELECT 
                sh.id, 
                sh.question_id, 
                qh.question, 
                qh.category, 
                sh.correctness_score, 
                sh.efficiency_score, 
                sh.style_score, 
                sh.pass_fail, 
                sh.timestamp,
                ROW_NUMBER() OVER (PARTITION BY sh.question_id ORDER BY sh.timestamp DESC) as rn
            FROM 
                submission_history sh
            JOIN 
                question_history qh ON sh.question_id = qh.id
            WHERE 
                sh.user_id = %s
        )
        SELECT 
            id, question_id, question, category, correctness_score, 
            efficiency_score, style_score, pass_fail, timestamp
        FROM 
            ranked_submissions
        WHERE 
            rn < 10
        ORDER BY 
            timestamp DESC
        """

        try:
            result = self.execute_with_retry(query, (user_id,))
            logging.info(f"Raw query result: {result}")
            return result
        except Exception as e:
            logging.error(f"An error occurred while fetching submission history: {str(e)}")
            raise

    def create_user_table(self, user_id):
        schema_name = f"user_{user_id}"
        table_name = f"sample_users"

        create_table_query = f"""
        CREATE TABLE IF NOT EXISTS {schema_name}.{table_name} (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100),
            email VARCHAR(100),
            age INTEGER,
            city VARCHAR(100),
            registration_date DATE
        )
        """
        enable_rls_query = f"ALTER TABLE {schema_name}.{table_name} ENABLE ROW LEVEL SECURITY;"

        create_rls_policy_query = f"""
        CREATE POLICY user_{user_id}_own_data_policy ON {schema_name}.{table_name}
        FOR ALL
        USING (current_setting('app.current_user_id')::INTEGER = {user_id});
        """

        check_data_query = f"SELECT COUNT(*) FROM {schema_name}.{table_name}"
        insert_data_query = f"""
        INSERT INTO {schema_name}.{table_name} (name, email, age, city, registration_date)
        SELECT * FROM (VALUES
            ('Alice Smith', 'alice@example.com', 28, 'New York', '2023-01-15'::DATE),
            ('Bob Johnson', 'bob@example.com', 35, 'Los Angeles', '2023-02-20'::DATE),
            ('Charlie Brown', 'charlie@example.com', 42, 'Chicago', '2023-03-10'::DATE),
            ('Diana Davis', 'diana@example.com', 31, 'Houston', '2023-04-05'::DATE),
            ('Eva Wilson', 'eva@example.com', 39, 'Phoenix', '2023-05-22'::DATE)
        ) AS new_data(name, email, age, city, registration_date)
        WHERE NOT EXISTS (
            SELECT 1 FROM {schema_name}.{table_name} LIMIT 1
        )
        """
        try:
            with self.get_superuser_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(f"CREATE SCHEMA IF NOT EXISTS {schema_name}")
                    cur.execute(create_table_query)
                    logging.info(f"Table {schema_name}.{table_name} created or already exists.")
                    cur.execute(enable_rls_query)
                    logging.info(f"RLS enabled on table {schema_name}.{table_name}.")
                    cur.execute(create_rls_policy_query)
                    logging.info(f"RLS policy created for table {schema_name}.{table_name}.")
                    cur.execute(check_data_query)
                    row_count = cur.fetchone()[0]
                    if row_count == 0:
                        cur.execute(insert_data_query)
                        logging.info(f"Sample data inserted into {schema_name}.{table_name}.")
                    else:
                        logging.info(f"Table {schema_name}.{table_name} already contains data. Skipping insertion.")
                conn.commit()
            logging.info(f"Successfully created and populated table {table_name} for user {user_id}")
        except Exception as e:
            logging.error(f"Error creating user table: {str(e)}")
            raise

    def clear_user_connection(self, user_id):
        if user_id in self.user_connections:
            self.user_connections[user_id].close()
            del self.user_connections[user_id]