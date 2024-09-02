# main.py
# New backend application code that aims to split up some of the original app.py code base
# and implement passwordless authentication with Google OAuth

import os
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_session import Session
import logging
from dotenv import load_dotenv
import json
from datetime import date, datetime
from decimal import Decimal
from auth import init_auth, db, User, login_required, current_user
from llm_sql_wrapper import LLMSQLWrapper

# Load environment variables
load_dotenv('.env.local')

app = Flask(__name__)

# Configuration
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', os.urandom(24))
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True for production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# SQLAlchemy configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# app.config['SENDGRID_API_KEY'] = os.getenv('SENDGRID_API_KEY')
app.config['GOOGLE_CLIENT_ID'] = os.getenv('GOOGLE_CLIENT_ID')
app.config['GOOGLE_CLIENT_SECRET'] = os.getenv('GOOGLE_CLIENT_SECRET')

# Flask-Mail configuration
app.config['MAIL_SERVER'] = 'localhost'
app.config['MAIL_PORT'] = 1025
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_DEFAULT_SENDER'] = 'noreply@yourdomain.com'

Session(app)

CORS(app, resources={r"/*": {"origins": "http://127.0.0.1:5000", "supports_credentials": True}})

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize auth
auth = init_auth(app)

# Initialize LLMSQLWrapper
db_config = {
    'dbname': os.getenv('DB_NAME'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'host': os.getenv('DB_HOST'),
    'port': os.getenv('DB_PORT')
}
wrapper = LLMSQLWrapper(db_config)

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, (date, datetime)):
            return obj.isoformat()
        elif hasattr(obj, '__json__'):
            return obj.__json__()
        return super(CustomJSONEncoder, self).default(obj)

app.json_encoder = CustomJSONEncoder

@app.route('/submission-history', methods=['GET'])
@login_required
def get_submission_history():
    try:
        history = wrapper.get_submission_history(current_user.id)
        app.logger.info(f"Sending {len(history)} submission history items")

        for item in history:
            if isinstance(item['timestamp'], datetime):
                item['timestamp'] = item['timestamp'].isoformat()

        return jsonify(history), 200
    except Exception as e:
        app.logger.error(f"An error occurred while fetching submission history: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/execute-sql', methods=['POST'])
@login_required
def execute_sql():
    try:
        sql = request.json.get('sql')
        if not sql:
            return jsonify({"error": "SQL query is not provided"}), 400

        results = wrapper.execute_query(sql, current_user.id)

        response = {
            "sql": sql,
            "result": {
                "type": "multi",
                "results": results
            }
        }
        return jsonify(response), 200
    except Exception as e:
        app.logger.error(f"Unhandled exception: {str(e)}")
        return jsonify({
            "error": "Execution Error",
            "message": str(e),
            "query": sql
        }), 500

@app.route('/ask', methods=['POST'])
@login_required
def ask():
    app.logger.info("Received POST request to /ask")
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
        response = wrapper.ask_question(question, current_user.id, is_practice, category)
        query_history = wrapper.get_query_history(current_user.id) if not is_practice else []
        app.logger.info("Successfully processed question")
        return jsonify({
            "response": response,
            "query_history": query_history
        }), 200
    except Exception as e:
        app.logger.error(f"An error occurred: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/schema', methods=['GET'])
@login_required
def fetch_schema():
    app.logger.info("Received GET request to /schema")

    try:
        schema = wrapper.get_schema(current_user.id)
        app.logger.info("Successfully fetched schema")
        return jsonify(schema), 200
    except Exception as e:
        app.logger.error(f"An error occurred while fetching schema: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/submit-solution', methods=['POST'])
@login_required
def submit_solution():
    app.logger.info("Received POST request to /submit-solution")
    data = request.json
    sql_query = data.get('sql')
    results = data.get('results')
    question_id = data.get('questionId')

    app.logger.info(f"Received solution submission for question ID: {question_id}")

    if not sql_query or results is None or not question_id:
        app.logger.error("Missing required data")
        return jsonify({"error": "Missing required data"}), 400

    try:
        feedback = wrapper.validate_solution(sql_query, results, question_id, current_user.id)
        wrapper.add_to_query_history(sql_query, results, current_user.id)
        app.logger.info("Successfully validated solution and added to query history")
        return jsonify({"feedback": feedback}), 200
    except ValueError as ve:
        app.logger.error(f"ValueError occurred: {str(ve)}")
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        app.logger.error(f"An error occurred: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/current-question', methods=['GET'])
@login_required
def get_current_question():
    try:
        result = wrapper.execute_with_retry("""
            SELECT id, category, question, tables, hint
            FROM question_history
            WHERE user_id = %s
            ORDER BY timestamp DESC
            LIMIT 1
        """, (current_user.id,))

        if result:
            question = result[0]
            return jsonify({
                "question": {
                    "id": str(question['id']),
                    "category": question['category'],
                    "question": question['question'],
                    "tables": question['tables'],
                    "hint": question['hint']
                }
            }), 200
        else:
            return jsonify({"question": None}), 200
    except Exception as e:
        app.logger.error(f"Error fetching current question: {str(e)}")
        return jsonify({"error": "An error occurred while fetching the current question"}), 500

@app.route('/')
def home():
    if current_user.is_authenticated:
        return jsonify({"message": f"Welcome, {current_user.email}!"}), 200
    else:
        return jsonify({"message": "Please log in"}), 200

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f"Internal server error: {str(error)}")
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='127.0.0.1', port=5000)