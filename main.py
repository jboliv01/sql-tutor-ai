from flask import Flask, request, jsonify
from flask_cors import CORS
import duckdb
import traceback
import logging

app = Flask(__name__)
CORS(app, resources={r"/ask": {"origins": "http://127.0.0.1:3000"}})

logging.basicConfig(level=logging.DEBUG)

class LLMSQLWrapper:
    def __init__(self, token):
        app.logger.info(f"Initializing LLMSQLWrapper with token: {token[:5]}...")
        try:
            self.conn = duckdb.connect(f"md:?motherduck_token={token}")
            app.logger.info("Connection established successfully.")
        except Exception as e:
            app.logger.error(f"Error connecting to MotherDuck: {str(e)}")
            app.logger.error(traceback.format_exc())
            raise

    def ask_question(self, question):
        app.logger.info(f"Received question: {question}")
        query = "SELECT * FROM external_yelp_reviews LIMIT 10"
        app.logger.info(f"Executing query: {query}")
        try:
            result = self.conn.execute(query).fetchall()
            columns = [desc[0] for desc in self.conn.description]
            return {
                "sql": query,
                "result": [dict(zip(columns, row)) for row in result]
            }
        except Exception as e:
            app.logger.error(f"Error executing query: {str(e)}")
            app.logger.error(traceback.format_exc())
            raise

@app.route('/ask', methods=['POST'])
def ask():
    app.logger.info("Received POST request to /ask")
    app.logger.debug(f"Headers: {request.headers}")
    app.logger.debug(f"Body: {request.get_json()}")
    
    motherduck_token = request.headers.get('X-MotherDuck-Token')
    if not motherduck_token:
        app.logger.error("MotherDuck token is not provided")
        return jsonify({"error": "MotherDuck token is not provided"}), 400
    
    app.logger.info(f"Received token (first 5 chars): {motherduck_token[:5]}")

    try:
        wrapper = LLMSQLWrapper(motherduck_token)
        question = request.json['question']
        app.logger.info(f"Processing question: {question}")
        response = wrapper.ask_question(question)
        app.logger.info("Successfully processed question")
        return jsonify(response)
    except Exception as e:
        app.logger.error(f"An error occurred: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/test', methods=['GET'])
def test():
    app.logger.info("Test route accessed")
    return jsonify({"message": "Test route is working"}), 200

if __name__ == '__main__':
    app.logger.info("Starting the Flask server on 127.0.0.1:5000")
    try:
        app.run(debug=True, host='127.0.0.1', port=5000)
    except Exception as e:
        app.logger.error(f"An error occurred while starting the server: {str(e)}")