import os
import json
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

# Load environment variables
load_dotenv('.env.local')

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG)

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
        self.model = 'llama3-8b-8192'
        self.groq_chat = ChatGroq(groq_api_key=self.groq_api_key, model_name=self.model)
        self.memory = ConversationBufferWindowMemory(k=5, memory_key="chat_history", return_messages=True)
        self.schema = self.get_schema()

    def get_schema(self):
        schema = {}
        tables = self.conn.execute("SHOW TABLES").fetchall()
        for table in tables:
            table_name = table[0]
            schema[table_name] = []
            columns = self.conn.execute(f"DESCRIBE {table_name}").fetchall()
            for column in columns:
                schema[table_name].append({
                    "name": column[0],
                    "type": column[1]
                })
        return schema

    def execute_query(self, query):
        try:
            result = self.conn.execute(query).fetchall()
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
        self.conn.execute("""
            INSERT INTO query_history (id, query_definition, timestamp, results)
            VALUES (nextval('query_history_id_seq'), ?, ?, ?)
        """, (query, datetime.now(), json.dumps(limited_results, cls=DateTimeEncoder)))

    def get_query_history(self, limit=5):
        return self.conn.execute(f"""
            SELECT query_definition, timestamp, results
            FROM query_history
            ORDER BY timestamp DESC
            LIMIT {limit}
        """).fetchall()
        
    def ask_question(self, question):
        app.logger.info(f"Received question: {question}")

        query_history = self.get_query_history(limit=3)  # Limit to last 3 queries
        history_str = ""
        for query, timestamp, results in query_history:
            results_dict = json.loads(results)
            top_results = results_dict[:10]  # Take top 10 records
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
        except Exception as e:
            app.logger.error(f"Error generating response: {str(e)}")
            app.logger.error(f"Full exception: {traceback.format_exc()}")
            return {
                "response": f"I apologize, but I encountered an error while processing your question. Error details: {str(e)}",
                "query_history": query_history
            }

        return {
            "response": generated_response,
            "query_history": query_history
        }

    
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
            wrapper = LLMSQLWrapper(motherduck_token)
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

    if not question:
        app.logger.error("Question is not provided")
        return jsonify({"error": "Question is not provided"}), 400

    try:
        wrapper = LLMSQLWrapper(motherduck_token)
        response = wrapper.ask_question(question)
        app.logger.info("Successfully processed question")
        return json.dumps(response, cls=DateTimeEncoder), 200, {'Content-Type': 'application/json'}
    except Exception as e:
        app.logger.error(f"An error occurred: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.logger.info("Starting the Flask server on 127.0.0.1:5000")
    try:
        app.run(debug=True, host='127.0.0.1', port=5000)
    except Exception as e:
        app.logger.error(f"An error occurred while starting the server: {str(e)}")