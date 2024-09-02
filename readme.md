

# SQL Challenge AI MVP Features Summary

## 1. User Management
- User registration with username, email, and password
- User authentication (login/logout)
- Individual user schemas for data isolation

## 2. Database Interaction
- Execute SQL queries against a PostgreSQL database
- Support for both public datasets and user-specific data
- Row-Level Security (RLS) for data privacy

## 3. AI-Powered Assistance
- Ask questions about SQL and receive AI-generated responses
- Context-aware responses based on recent query history
- Integration with Groq API for natural language processing

## 4. Practice Questions
- Generate SQL practice questions based on specified categories
- Store and retrieve practice questions for each user

## 5. Solution Submission and Validation
- Submit SQL solutions for practice questions
- AI-powered validation and scoring of submitted solutions
- Feedback on correctness, efficiency, and style of SQL queries

## 6. History Tracking
- Query history tracking for each user
- Submission history for practice questions
- Retrieval of past queries and submissions

## 7. Schema Information
- Fetch and display database schema information
- Show available tables and their structures

## 8. Multi-User Support
- Separate data and history for each user
- Ability to handle multiple concurrent users

## 9. Error Handling and Logging
- Comprehensive error handling for database operations and API requests
- Detailed logging for debugging and monitoring

## 10. Security Features
- Password hashing for user accounts
- Use of environment variables for sensitive configuration
- Prevention of cross-user data access

## 11. RESTful API
- Well-defined API endpoints for all major functions
- JSON-based communication between frontend and backend

## 12. Extensibility
- Modular design allowing for easy addition of new features
- Separation of concerns between database operations, AI interactions, and request handling




```
Each user's query history, question history, and submission history are isolated and only accessible to that user.
Users can create and access tables in their own schema.
All users can access the public datasets.
Users cannot access or modify data belonging to other users.
```


```
dependencies:

pip install flask flask-cors psycopg2-binary python-dotenv langchain langchain-groq tenacity flask-login

```

```
chat bot operations:

On app start, load the database schema for context regarding the available tables to be queried. 
Load most recent query from the "query_history" table.

Every time a question is asked, the database schema context should be fetched/updated as well as the query_history so the chat bot has the most recent context. 

When a user presses "Practice SQL Questions" the chatbot should prompt the user to select a specific category. Once a category is selected, the chatbot should then prompt the user with one SQL question using the available tables and a hint. The chatbot should not provide an answer unless explicity requested by a user. The question should be in the following format:

Question:

Table(s):

Hint:

```