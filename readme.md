```
curl -X POST -H "Content-Type: application/json" -H "X-MotherDuck-Token: your-token" -d '{"question":"What are the top rated restaurants?"}' http://127.0.0.1:5000/ask
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