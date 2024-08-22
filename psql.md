# Essential PostgreSQL Commands for SQL Challenge AI

## Connection and General Commands

1. Connect to database:
   ```sql
   \c sqlchallengeai
   ```

2. List all databases:
   ```sql
   \l
   ```

3. List all schemas:
   ```sql
   \dn
   ```

4. List all tables in the current schema:
   ```sql
   \dt
   ```

5. Describe a table structure:
   ```sql
   \d table_name
   ```

6. List all users:
   ```sql
   \du
   ```

7. Show current user and database:
   ```sql
   SELECT current_user, current_database();
   ```

8. Quit psql:
   ```sql
   \q
   ```

## Database Operations

9. Create a new database:
   ```sql
   CREATE DATABASE new_database_name;
   ```

10. Drop a database:
    ```sql
    DROP DATABASE database_name;
    ```

## Table Operations

11. Create a new table:
    ```sql
    CREATE TABLE table_name (
        column1 datatype1,
        column2 datatype2,
        ...
    );
    ```

12. Insert data into a table:
    ```sql
    INSERT INTO table_name (column1, column2, ...)
    VALUES (value1, value2, ...);
    ```

13. Select data from a table:
    ```sql
    SELECT * FROM table_name;
    ```

14. Update data in a table:
    ```sql
    UPDATE table_name
    SET column1 = value1, column2 = value2
    WHERE condition;
    ```

15. Delete data from a table:
    ```sql
    DELETE FROM table_name
    WHERE condition;
    ```

16. Add a new column to a table:
    ```sql
    ALTER TABLE table_name
    ADD COLUMN new_column_name datatype;
    ```

17. Drop a table:
    ```sql
    DROP TABLE table_name;
    ```

## Index Operations

18. Create an index:
    ```sql
    CREATE INDEX index_name
    ON table_name (column_name);
    ```

19. Drop an index:
    ```sql
    DROP INDEX index_name;
    ```

## User Management

20. Create a new user:
    ```sql
    CREATE USER username WITH PASSWORD 'password';
    ```

21. Grant privileges:
    ```sql
    GRANT ALL PRIVILEGES ON DATABASE database_name TO username;
    ```

22. Revoke privileges:
    ```sql
    REVOKE ALL PRIVILEGES ON DATABASE database_name FROM username;
    ```

## Backup and Restore

23. Backup a database (from terminal, not psql):
    ```bash
    pg_dump -U username database_name > backup_file.sql
    ```

24. Restore a database (from terminal, not psql):
    ```bash
    psql -U username database_name < backup_file.sql
    ```

## Performance and Monitoring

25. Show active queries:
    ```sql
    SELECT * FROM pg_stat_activity;
    ```

26. Kill a query:
    ```sql
    SELECT pg_cancel_backend(pid);
    ```

27. View table sizes:
    ```sql
    SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name)))
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;
    ```

Remember to end each SQL command with a semicolon (;) when using psql.