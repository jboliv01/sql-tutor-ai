'use client';
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Send, Play, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-github';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type QueryHistoryItem = {
  query_definition: string;
  timestamp: string;
  results: string;
};

type QueryResult = Record<string, any>;

type SqlError = {
  message: string;
  query: string;
  details: string;
};

export default function Home() {
  const [question, setQuestion] = useState('');
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM external_yelp_reviews LIMIT 5');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [sqlError, setSqlError] = useState<SqlError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showQueryHistory, setShowQueryHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editorHeight, setEditorHeight] = useState('150px');
  const rowsPerPage = 5;

  useEffect(() => {
    const updateHeight = () => {
      const height = Math.max(150, window.innerHeight * 0.3);
      setEditorHeight(`${height}px`);
    };

    window.addEventListener('resize', updateHeight);
    updateHeight();

    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setChatHistory(prev => [...prev, { role: 'user', content: question }]);

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
      
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
      
      if (data.query_history) {
        setQueryHistory(data.query_history);
      }
    } catch (err) {
      console.error('Error:', err);
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'An error occurred while processing your request.' }]);
    } finally {
      setIsLoading(false);
      setQuestion('');
    }
  };

  const handleSqlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSqlError(null);
    setQueryResults([]);

    try {
      const res = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlQuery })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(JSON.stringify({
          message: data.error || 'Failed to execute SQL query',
          query: sqlQuery,
          details: data.details || 'No additional details provided'
        }));
      }

      setQueryResults(data.result);
      setCurrentPage(1);
      setChatHistory(prev => [...prev, 
        { role: 'user', content: `Executed SQL: ${sqlQuery}` },
        { role: 'assistant', content: `Query executed successfully. ${data.result.length} rows returned.` }
      ]);
    } catch (err) {
      console.error('Error:', err);
      try {
        const errorData = JSON.parse(err.message);
        setSqlError(errorData);
      } catch {
        setSqlError({
          message: err.message,
          query: sqlQuery,
          details: 'Unable to parse error details'
        });
      }
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'An error occurred while executing the SQL query.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const paginatedResults = queryResults.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(queryResults.length / rowsPerPage);

  return (
    <main className="min-h-screen bg-gray-100 p-4 pb-16">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">SQL Tutor AI</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-2 text-gray-700">Chat</h2>
              <div className="h-64 overflow-y-auto mb-4 space-y-2">
                {chatHistory.map((msg, index) => (
                  <div key={index} className={`p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    <strong>{msg.role === 'user' ? 'You: ' : 'AI: '}</strong>
                    {msg.content}
                  </div>
                ))}
              </div>
              <form onSubmit={handleQuestionSubmit} className="flex items-center">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about SQL or query history"
                  className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800"
                />
                <button 
                  type="submit" 
                  className="p-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                  disabled={isLoading}
                >
                  {isLoading ? <span className="animate-spin">↻</span> : <Send size={20} />}
                </button>
              </form>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-4" style={{ minHeight: '300px' }}>
              <h2 className="text-xl font-semibold mb-2 text-gray-700">SQL Query</h2>
              <form onSubmit={handleSqlSubmit} className="space-y-2">
                <AceEditor
                  mode="sql"
                  theme="github"
                  name="sql_editor"
                  onChange={(newValue) => setSqlQuery(newValue)}
                  fontSize={16}
                  showPrintMargin={false}
                  showGutter={true}
                  highlightActiveLine={true}
                  value={sqlQuery}
                  setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    showLineNumbers: true,
                    tabSize: 2,
                  }}
                  style={{ 
                    width: '100%',
                    height: editorHeight,
                    minHeight: '150px',
                    maxHeight: '300px'
                  }}
                  editorProps={{ $blockScrolling: true }}
                />
                <button 
                  type="submit" 
                  className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300 flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? <span className="animate-spin mr-2">↻</span> : <Play size={20} className="mr-2" />}
                  {isLoading ? 'Executing...' : 'Execute SQL'}
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={() => setShowQueryHistory(!showQueryHistory)}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors focus:outline-none"
          >
            <h2 className="text-xl font-semibold">Query History</h2>
            {showQueryHistory ? <ChevronUp size={20} className="ml-2" /> : <ChevronDown size={20} className="ml-2" />}
          </button>
          {showQueryHistory && (
            <div className="bg-white rounded-lg shadow-md p-4 mt-2">
              {queryHistory.map((item, index) => (
                <div key={index} className="mb-4 last:mb-0">
                  <p className="font-semibold text-gray-700">{item.query_definition}</p>
                  <p className="text-sm text-gray-500">{item.timestamp}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-6 bg-white rounded-lg shadow-md p-4 overflow-x-auto">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">Query Results</h2>
          {sqlError ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{sqlError.message}</span>
              <AlertCircle className="inline-block ml-2" size={20} />
              <div className="mt-2">
                <strong>Query:</strong>
                <pre className="mt-1 bg-red-50 p-2 rounded">{sqlError.query}</pre>
              </div>
              <div className="mt-2">
                <strong>Details:</strong>
                <pre className="mt-1 bg-red-50 p-2 rounded whitespace-pre-wrap">{sqlError.details}</pre>
              </div>
            </div>
          ) : queryResults.length > 0 ? (
            <>
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    {Object.keys(queryResults[0]).map((key) => (
                      <th key={key} className="py-2 px-4 text-left text-gray-600">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedResults.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      {Object.values(row).map((value, valueIndex) => (
                        <td key={valueIndex} className="py-2 px-4 border-t text-gray-800 text-ellipsis">
                          {typeof value === 'object' ? JSON.stringify(value) : truncateText(String(value), 50)}
                          {typeof value === 'string' && value.length > 50 && <span title={value}>...</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 py-1 px-3 rounded disabled:opacity-50"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-gray-700">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 py-1 px-3 rounded disabled:opacity-50"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-600">No results to display. Execute a query to see results here.</p>
          )}
        </div>
      </div>
    </main>
  );
}