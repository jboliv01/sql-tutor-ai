'use client';

import { useState, useEffect } from 'react';
import TreeView from 'react-treeview';
import 'react-treeview/react-treeview.css';

type Result = {
  sql: string;
  result: Array<Record<string, any>>;
};

type SchemaType = Record<string, Record<string, Array<{ name: string; type: string }>>>;

export default function Home() {
  const [question, setQuestion] = useState('');
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM external_yelp_reviews LIMIT 5');
  const [response, setResponse] = useState<Result | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<SchemaType | null>(null);

  useEffect(() => {
    fetchSchema();
  }, []);

  const fetchSchema = async () => {
    try {
      const res = await fetch('/api/schema', {
        headers: { 'X-MotherDuck-Token': process.env.NEXT_PUBLIC_MOTHERDUCK_TOKEN || '' }
      });
      if (!res.ok) throw new Error('Failed to fetch schema');
      const data = await res.json();
      setSchema(data);
    } catch (err) {
      console.error('Error fetching schema:', err);
      setError('Failed to fetch database schema.');
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });

      if (!res.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await res.json();
      setResponse(data);
      setSqlQuery(data.sql);
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while processing your request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSqlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlQuery })
      });

      if (!res.ok) {
        throw new Error('Failed to execute SQL query');
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while executing the SQL query.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-4 flex">
      <div className="w-1/4 pr-4">
        <h2 className="text-2xl font-bold mb-4 text-black">Database Schema</h2>
        {schema && Object.entries(schema).map(([dbName, tables]) => (
          <TreeView key={dbName} nodeLabel={dbName} defaultCollapsed={false}>
            {Object.entries(tables).map(([tableName, columns]) => (
              <TreeView key={tableName} nodeLabel={tableName} defaultCollapsed={true}>
                {columns.map(column => (
                  <div key={column.name} className="text-black">
                    {column.name}: {column.type}
                  </div>
                ))}
              </TreeView>
            ))}
          </TreeView>
        ))}
      </div>
      <div className="w-3/4">
        <h1 className="text-3xl font-bold mb-6 text-black">LLM SQL Wrapper</h1>
        
        <form onSubmit={handleQuestionSubmit} className="mb-6">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about Yelp reviews"
            className="w-full p-2 border rounded mb-2 text-black"
          />
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Ask Question'}
          </button>
        </form>

        <form onSubmit={handleSqlSubmit} className="mb-6">
          <textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            className="w-full p-2 border rounded mb-2 text-black h-40"
            placeholder="Enter your SQL query here"
          />
          <button 
            type="submit" 
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Executing...' : 'Execute SQL'}
          </button>
        </form>

        {error && (
          <div className="text-red-500 mb-4">{error}</div>
        )}

        {response && (
          <div>
            <h2 className="text-2xl font-semibold mb-2 text-black">Results:</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr>
                    {Object.keys(response.result[0] || {}).map((key) => (
                      <th key={key} className="py-2 px-4 border-b text-black">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {response.result.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="py-2 px-4 border-b text-black">{String(value)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}