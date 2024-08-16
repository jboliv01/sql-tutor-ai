// src/app/page.tsx
'use client';

import { useState } from 'react';

type Response = {
  sql: string;
  result: Array<Record<string, any>>;
};

export default function Home() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<Response | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while processing your request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-black">LLM SQL Wrapper</h1>
      <form onSubmit={handleSubmit} className="mb-6">
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
          {isLoading ? 'Processing...' : 'Ask'}
        </button>
      </form>

      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      {response && (
        <div>
          <h2 className="text-2xl font-semibold mb-2 text-black">SQL Query:</h2>
          <pre className="bg-gray-100 p-3 rounded overflow-x-auto mb-4 text-black">
            {response.sql}
          </pre>

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
    </main>
  );
}