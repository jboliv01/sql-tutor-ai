from flask import Flask, request, jsonify
from flask_cors import CORS
import duckdb
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG)

@app.route('/test', methods=['GET'])
def test():
    app.logger.info("Test route accessed")
    return jsonify({"message": "Test route is working"}), 200

@app.route('/ask', methods=['POST'])
def ask():
    app.logger.info("Received POST request to /ask")
    app.logger.debug(f"Headers: {request.headers}")
    app.logger.debug(f"Body: {request.get_json()}")
    
    return jsonify({"message": "Received request", "data": request.get_json()}), 200

if __name__ == '__main__':
    app.logger.info("Starting the Flask server")
    try:
        app.run(debug=True, port=5000)
    except Exception as e:
        app.logger.error(f"An error occurred while starting the server: {str(e)}")