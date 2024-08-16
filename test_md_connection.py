# test_motherduck_connection.py
import duckdb

def test_connection(token):
    try:
        conn = duckdb.connect(f"md:?motherduck_token={token}")
        result = conn.execute("SELECT 1").fetchall()
        print("Connection successful. Result:", result)
    except Exception as e:
        print(f"Connection failed. Error: {str(e)}")

if __name__ == "__main__":
    token = input("Enter your MotherDuck token: ")
    test_connection(token)