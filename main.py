import os
import json
import re
from datetime import datetime, date
from flask import Flask, request, jsonify
from flask_cors import CORS
import duckdb
import traceback
import logging
from dotenv import load_dotenv
from langchain.chains import LLMChain
from langchain_core.prompts import ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage
from langchain.chains.conversation.memory import ConversationBufferWindowMemory
from langchain_groq import ChatGroq
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import time

# Load environment variables
load_dotenv('.env.local')

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG)

wrapper = None  # Global wrapper instance

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        return super().default(obj)

class LLMSQLWrapper:
    def __init__(self, token):
        self.conn = duckdb.connect(f"md:?motherduck_token={token}")
        self.groq_api_key = os.getenv('GROQ_API_KEY')
        if not self.groq_api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        self.model = 'llama-3.1-70b-versatile'
        self.groq_chat = ChatGroq(groq_api_key=self.groq_api_key, model_name=self.model)
        self.memory = ConversationBufferWindowMemory(k=5, memory_key="chat_history", return_messages=True)
        self.schema = self.get_schema()

        # Apply retry logic to the sequence and table creation
        self.create_sequences_and_tables()

    def create_sequences_and_tables(self):
        try:
            app.logger.info("Creating sequences and tables...")
            self.execute_with_retry("""
                CREATE SEQUENCE IF NOT EXISTS query_history_id_seq;
                CREATE SEQUENCE IF NOT EXISTS question_history_id_seq;
                CREATE SEQUENCE IF NOT EXISTS submission_history_id_seq;
            """)
            app.logger.info("Sequences created or already exist.")
            self.execute_with_retry("""
                CREATE TABLE IF NOT EXISTS query_history (
                    id BIGINT PRIMARY KEY DEFAULT nextval('query_history_id_seq'),
                    query_definition TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    results JSON
                );
            """)
            self.execute_with_retry("""
                CREATE TABLE IF NOT EXISTS question_history (
                    id BIGINT PRIMARY KEY DEFAULT nextval('question_history_id_seq'),
                    category VARCHAR,
                    question TEXT,
                    tables TEXT,
                    hint TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            self.execute_with_retry("""
                CREATE TABLE IF NOT EXISTS submission_history (
                    id BIGINT PRIMARY KEY DEFAULT nextval('submission_history_id_seq'),
                    question_id BIGINT,
                    correctness_score INT,
                    efficiency_score INT,
                    style_score INT,
                    overall_feedback TEXT,
                    pass_fail BOOLEAN,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            app.logger.info("Tables created or already exist.")
        except Exception as e:
            app.logger.error(f"Error creating sequences and tables: {str(e)}")
            raise

    def get_schema(self):
        schema = []
        tables = self.conn.execute("SHOW TABLES").fetchall()
        for table in tables:
            table_name = table[0]
            columns = self.conn.execute(f"DESCRIBE {table_name}").fetchall()
            table_item = {
                "id": f"table-{table_name}",
                "label": table_name,
                "children": [
                    {
                        "id": f"column-{table_name}-{column[0]}",
                        "label": f"{column[0]} ({column[1]})"
                    } for column in columns
                ]
            }
            schema.append(table_item)
        return schema

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type(duckdb.CatalogException),
        before_sleep=lambda retry_state: time.sleep(0.1)  # Small delay before retry
    )
    def execute_with_retry(self, query, params=None):
        try:
            if params:
                return self.conn.execute(query, params).fetchall()
            else:
                return self.conn.execute(query).fetchall()
        except duckdb.CatalogException as e:
            if "Catalog write-write conflict" in str(e):
                app.logger.warning(f"Caught catalog write-write conflict, retrying... (Attempt {retry_state.attempt_number})")
                raise  # Re-raise to trigger retry
            else:
                raise  # Re-raise if it's a different type of CatalogException

    def execute_query(self, query):
        try:
            result = self.execute_with_retry(query)
            columns = [desc[0] for desc in self.conn.description]
            formatted_result = [dict(zip(columns, row)) for row in result]
            self.add_to_query_history(query, formatted_result)
            return formatted_result
        except Exception as e:
            app.logger.error(f"Error executing query: {str(e)}")
            app.logger.error(traceback.format_exc())
            raise

    def add_to_query_history(self, query, results):
        limited_results = results[:100] if results else []
        self.execute_with_retry("""
            INSERT INTO query_history (id, query_definition, timestamp, results)
            VALUES (nextval('query_history_id_seq'), ?, ?, ?)
        """, (query, datetime.now(), json.dumps(limited_results, cls=DateTimeEncoder)))

    def get_query_history(self, limit=5):
        return self.execute_with_retry(f"""
            SELECT query_definition, timestamp, results
            FROM query_history
            ORDER BY timestamp DESC
            LIMIT {limit}
        """)
    
    def ask_question(self, question, is_practice=False, category=None):
        if is_practice:
            return self.generate_practice_question(category)
        
        # Existing ask_question logic
        app.logger.info(f"Received question: {question}")

        query_history = self.get_query_history(limit=3)
        history_str = ""
        for query, timestamp, results in query_history:
            results_dict = json.loads(results)
            top_results = results_dict[:10]
            history_str += f"Query: {query}\nTimestamp: {timestamp}\n"
            history_str += f"Results summary: {len(results_dict)} total results. Top 10 results:\n"
            history_str += json.dumps(top_results, indent=2) + "\n\n"

        schema_str = str(self.schema)
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
            app.logger.debug(f"Sending request to Groq API with prompt: {prompt}")
            generated_response = conversation.predict(human_input=question)
            app.logger.info(f"Generated response: {generated_response}")
            return generated_response
        except Exception as e:
            app.logger.error(f"Error generating response: {str(e)}")

            app.logger.error(f"Full exception: {traceback.format_exc()}")
            return f"I apologize, but I encountered an error while processing your question. Error details: {str(e)}"

    def generate_practice_question(self, category):
        schema_str = str(self.schema)
        system_prompt = f"""You are an AI assistant that generates SQL practice questions.
        Database schema: {schema_str}
        
        Generate a unique SQL practice question for the category: {category}
        The question should be challenging but solvable using the provided schema. 
        Try to use a variety of tables in your questions.
        Include the question, the tables involved, and a hint.
        
        The format should be:
        
        Category: {category}

        Question: [Your question here]
        
        Tables: [List the relevant tables here]

        Hint: [Provide a hint here]
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
            
            # Parse the generated response
            question_match = re.search(r'Question: (.+?)(?=\n\nTables:|$)', generated_response, re.DOTALL)
            tables_match = re.search(r'Tables: (.+?)(?=\n\nHint:|$)', generated_response, re.DOTALL)
            hint_match = re.search(r'Hint: (.+?)$', generated_response, re.DOTALL)
            
            question = question_match.group(1).strip() if question_match else ""
            tables = tables_match.group(1).strip() if tables_match else ""
            hint = hint_match.group(1).strip() if hint_match else ""
            
            # Store the parsed question in the question_history table
            result = self.execute_with_retry("""
                INSERT INTO question_history (category, question, tables, hint)
                VALUES (?, ?, ?, ?)
                RETURNING id
            """, (category, question, tables, hint))
            
            question_id = result[0][0]
            
            app.logger.info(f"Generated question with ID: {question_id}")
            
            return {
                "id": str(question_id),
                "category": category,
                "question": question,
                "tables": tables,
                "hint": hint
            }
        except Exception as e:
            app.logger.error(f"Error generating practice question: {str(e)}")
            app.logger.error(f"Full exception: {traceback.format_exc()}")
            raise

    def get_practice_question(self, question_id):
        result = self.execute_with_retry("""
            SELECT id, category, question, tables, hint, timestamp
            FROM question_history
            WHERE id = ?
        """, [question_id])
        
        if result:
            return {
                "id": str(result[0][0]),
                "category": result[0][1],
                "question": result[0][2],
                "tables": result[0][3],
                "hint": result[0][4],
                "timestamp": result[0][5]
            }
        return None
            
    def validate_solution(self, sql_query, results, question_id):
        schema_str = str(self.schema)
        
        # Fetch the current question from the database
        question_result = self.execute_with_retry("""
            SELECT category, question
            FROM question_history
            WHERE id = ?
        """, [question_id])

        if not question_result:
            raise ValueError(f"No question found with id {question_id}")

        category, question_text = question_result[0]

        app.logger.info(f"Validating solution for question ID: {question_id}")
        app.logger.info(f"Question category: {category}")
        app.logger.info(f"Question text: {question_text[:100]}...") # Log first 100 chars of question

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
                (question_id, correctness_score, efficiency_score, style_score, overall_feedback, pass_fail)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (question_id, correctness_score, efficiency_score, style_score, overall_feedback, pass_fail))

            app.logger.info(f"Inserted submission record for question ID: {question_id}, Pass/Fail: {pass_fail}")
            
            # Include pass/fail in the feedback
            feedback += f"\n\nOverall Result: {'Pass' if pass_fail else 'Fail'}"
            
            return feedback
        except Exception as e:
            app.logger.error(f"Error validating solution: {str(e)}")
            app.logger.error(f"Full exception: {traceback.format_exc()}")
            raise

    def get_submission_history(self):
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
            result = self.execute_with_retry(query)
            app.logger.info(f"Raw query result: {result}")
            
            columns = ['id', 'question_id', 'question', 'category', 'correctness_score', 
                    'efficiency_score', 'style_score', 'pass_fail', 'timestamp']
            
            return [dict(zip(columns, row)) for row in result]
        except Exception as e:
            app.logger.error(f"An error occurred while fetching submission history: {str(e)}")
            raise

def initialize_wrapper():
    global wrapper
    if wrapper is None:
        motherduck_token = os.getenv('MOTHERDUCK_TOKEN')  # Assuming you store your token in the environment
        wrapper = LLMSQLWrapper(motherduck_token)
        app.logger.info("LLMSQLWrapper initialized.")

@app.route('/submission-history', methods=['POST'])
def get_submission_history():
    try:
        history = wrapper.get_submission_history()
        app.logger.info(f"Sending {len(history)} submission history items")

        for item in history:
            if isinstance(item['timestamp'], datetime):
                item['timestamp'] = item['timestamp'].isoformat()

        return jsonify(history), 200
    except Exception as e:
        app.logger.error(f"An error occurred while fetching submission history: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/execute-sql', methods=['POST'])
def execute_sql():
    app.logger.info("Received POST request to /execute-sql")
    app.logger.debug(f"Headers: {request.headers}")
    app.logger.debug(f"Body: {request.get_json()}")
    
    motherduck_token = request.headers.get('X-MotherDuck-Token')
    if not motherduck_token:
        app.logger.error("MotherDuck token is not provided")
        return jsonify({"error": "MotherDuck token is not provided"}), 400
    
    sql = request.json.get('sql')
    if not sql:
        app.logger.error("SQL query is not provided")
        return jsonify({"error": "SQL query is not provided"}), 400

    app.logger.info(f"Executing SQL query: {sql}")

    try:
        result = wrapper.execute_query(sql)
        response = {
            "sql": sql,
            "result": result
        }
        app.logger.info("Successfully executed SQL query")
        return json.dumps(response, cls=DateTimeEncoder), 200, {'Content-Type': 'application/json'}
    except Exception as e:
        app.logger.error(f"An error occurred: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({
            "error": str(e),
            "explanation": f"An error occurred while executing the query: {str(e)}"
        }), 500

@app.route('/ask', methods=['POST'])
def ask():
    app.logger.info("Received POST request to /ask")
    app.logger.debug(f"Headers: {request.headers}")
    app.logger.debug(f"Body: {request.get_json()}")
    
    motherduck_token = request.headers.get('X-MotherDuck-Token')
    if not motherduck_token:
        app.logger.error("MotherDuck token is not provided")
        return jsonify({"error": "MotherDuck token is not provided"}), 400
    
    data = request.json
    question = data.get('question')
    is_practice = data.get('is_practice', False)
    category = data.get('category')

    if is_practice and not category:
        app.logger.error("Category is not provided for practice question")
        return jsonify({"error": "Category is not provided for practice question"}), 400

    if not is_practice and not question:
        app.logger.error("Question is not provided")
        return jsonify({"error": "Question is not provided"}), 400

    try:
        response = wrapper.ask_question(question, is_practice, category)
        query_history = wrapper.get_query_history() if not is_practice else []
        app.logger.info("Successfully processed question")
        return jsonify({
            "response": response,
            "query_history": query_history
        }), 200
    except Exception as e:
        app.logger.error(f"An error occurred: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/schema', methods=['GET'])
def fetch_schema():
    app.logger.info("Received GET request to /schema")
    
    motherduck_token = request.headers.get('X-MotherDuck-Token')
    if not motherduck_token:
        app.logger.error("MotherDuck token is not provided")
        return jsonify({"error": "MotherDuck token is not provided"}), 400

    try:
        schema = wrapper.schema
        app.logger.info("Successfully fetched schema")
        return jsonify(schema), 200
    except Exception as e:
        app.logger.error(f"An error occurred while fetching schema: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/submit-solution', methods=['POST'])
def submit_solution():
    app.logger.info("Received POST request to /api/submit-solution")
    app.logger.debug(f"Headers: {request.headers}")
    app.logger.debug(f"Body: {request.get_json()}")
    
    motherduck_token = request.headers.get('X-MotherDuck-Token')
    if not motherduck_token:
        app.logger.error("MotherDuck token is not provided")
        return jsonify({"error": "MotherDuck token is not provided"}), 400
    
    data = request.json
    sql_query = data.get('sql')
    results = data.get('results')
    question_id = data.get('questionId')

    app.logger.info(f"Received solution submission for question ID: {question_id}")

    if not sql_query or results is None or not question_id:
        app.logger.error("Missing required data")
        return jsonify({"error": "Missing required data"}), 400

    try:
        feedback = wrapper.validate_solution(sql_query, results, question_id)
        
        # Add the submission to query_history
        wrapper.add_to_query_history(sql_query, results)
        
        app.logger.info("Successfully validated solution and added to query history")
        return jsonify({"feedback": feedback}), 200
    except ValueError as ve:
        app.logger.error(f"ValueError occurred: {str(ve)}")
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        app.logger.error(f"An error occurred: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    initialize_wrapper()  # Initialize the wrapper before starting the app
    app.run(debug=True, host='127.0.0.1', port=5000)
