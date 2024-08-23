//src/app/home/page.tsx

'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, Play, ChevronLeft, ChevronRight, AlertCircle, MessageSquare, History, Database, Send, BookOpen } from 'lucide-react';
import AceEditor from 'react-ace';
import ReactMarkdown from 'react-markdown';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-textmate';
import DatabaseSchema from '../components/schema'; 
import SQLPractice from '../SQLPractice';
import SubmissionHistory from '../utils/submissionHistory';
import { handleSolutionSubmit, SqlError } from '../utils/sqlSolutionHandler';
import LogoutButton from '../components/Logout';
import "../globals.css";

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type SqlError = {
  message: string;
  query: string;
  details: string;
};

type QueryHistoryItem = {
  query_definition: string;
  timestamp: string;
  results: string;
};

type QueryResult = Record<string, any>;

type SchemaItem = {
  id?: string;
  label: string;
  children?: SchemaItem[];
};

interface SubmissionHistoryItem {
  id: number;
  question_id: number;
  question: string;
  category: string;
  correctness_score: number;
  efficiency_score: number;
  style_score: number;
  pass_fail: boolean | null;
  timestamp: string;
}

export function Home() {
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM public.users LIMIT 5');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [sqlError, setSqlError] = useState<SqlError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showQueryHistory, setShowQueryHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editorHeight, setEditorHeight] = useState('150px');
  const [schemaData, setSchemaData] = useState<SchemaItem[]>([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [currentQuestion, setCurrentQuestion] = useState<{ id: string; content: string } | null>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionHistoryItem[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const rowsPerPage = 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      console.log('Login successful:', data);
      
      // Redirect to the home page after successful login
      router.push('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchema = useCallback(async () => {
    try {
      const res = await fetch('/api/schema');
      if (!res.ok) {
        throw new Error('Failed to fetch schema');
      }
      const data = await res.json();
      setSchemaData(data);
    } catch (err) {
      console.error('Error fetching schema:', err);
    }
  }, []);

  const fetchSubmissionHistory = useCallback(async () => {
    setIsLoadingSubmissions(true);
    setSubmissionError(null);
    try {
      const res = await fetch('/api/submission-history', {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch submission history');
      }
      const data = await res.json();
      setSubmissionHistory(data);
    } catch (err) {
      console.error('Error fetching submission history:', err);
      setSubmissionError(err.message || 'Failed to load submission history. Please try again later.');
    } finally {
      setIsLoadingSubmissions(false);
    }
  }, []);

  useEffect(() => {
    const username = localStorage.getItem('username') || 'User';
    const userId = localStorage.getItem('userId');
    
    console.log('Initial render - Username:', username, 'User ID:', userId);
  
    setChatHistory([{ 
      role: 'assistant', 
      content: `Hello ${username}! I'm your SQL Tutor AI. How can I help you today?` 
    }]);
  
    if (username) {
      const defaultQuery = `SELECT * FROM user_${username}.sample_users LIMIT 5;`;
      console.log('Setting default query:', defaultQuery);
      setSqlQuery(defaultQuery);
    } else {
      console.log('No user ID found, not setting default query');
    }
  
    const updateHeight = () => {
      const height = Math.max(150, window.innerHeight * 0.3);
      setEditorHeight(`${height}px`);
    };
  
    window.addEventListener('resize', updateHeight);
    updateHeight();
  
    fetchSchema();
    fetchSubmissionHistory();
  
    return () => window.removeEventListener('resize', updateHeight);
  }, [fetchSchema, fetchSubmissionHistory]);

  useEffect(() => {
    console.log('sqlQuery updated:', sqlQuery);
  }, [sqlQuery]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
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
            body: JSON.stringify({ sql: sqlQuery }),
            credentials: 'include'
        });

        const rawResponseText = await res.text();
        let data;

        try {
            data = JSON.parse(rawResponseText);
        } catch (jsonError) {
            throw new Error('Invalid JSON response from server.');
        }

        if (!res.ok) {
            throw new Error(JSON.stringify({
                message: data.message || 'Failed to execute SQL query',
                query: data.query || sqlQuery,
                error: data.error || 'Execution Error'
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

        let errorData: { message: string, query: string, error: string };

        if (err instanceof Error) {
            try {
                errorData = JSON.parse(err.message);
            } catch (parseError) {
                errorData = {
                    message: err.message || 'Unknown Error',
                    query: sqlQuery,
                    error: 'An unexpected error occurred.'
                };
            }
        } else {
            errorData = {
                message: 'Unknown Error',
                query: sqlQuery,
                error: 'An unexpected error occurred.'
            };
        }

        setSqlError({
            message: errorData.message,
            query: errorData.query,
            details: errorData.error
        });
        setChatHistory(prev => [...prev, { role: 'assistant', content: `An error occurred while executing the SQL query: ${errorData.message}` }]);
    } finally {
        setIsLoading(false);
    }
};

  

  const handleAskQuestion = async (question: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await response.json();

      setChatHistory(prev => [
        ...prev,
        { role: 'user', content: question },
        { role: 'assistant', content: data.response },
      ]);

      if (data.query_history) {
        setQueryHistory(data.query_history);
      }
    } catch (error) {
      console.error('Error asking question:', error);
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error while processing your question. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = async (category: string) => {
    setIsLoading(true);
    setChatHistory(prev => [
      ...prev,
      { role: 'user', content: `Selected category: ${category}` },
    ]);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: `Generate a practice question for the category: ${category}`,
          is_practice: true,
          category: category
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch practice question');
      }

      const data = await response.json();

      if (data.response && typeof data.response === 'object') {
        const { id, category, question, tables, hint } = data.response;
        setCurrentQuestion({
          id,
          content: `Category: ${category}\n\nQuestion: ${question}\n\nTables: ${tables}\n\nHint: ${hint}`
        });
        setChatHistory(prev => [
          ...prev,
          { role: 'assistant', content: `Here's a practice question for you:\n\nCategory: ${category}\n\nQuestion: ${question}\n\nTables: ${tables}\n\nHint: ${hint}` },
        ]);
      } else {
        console.error('Unexpected response format:', data);
        throw new Error('Unexpected response format from server');
      }
    } catch (error) {
      console.error('Error fetching practice question:', error);
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error while generating a practice question. Please try again.' },
      ]);
      setCurrentQuestion(null);
    } finally {
      setIsLoading(false);
    }
  };

  const onSolutionSubmit = async () => {
    setIsLoading(true);
    setSqlError(null);
    setQueryResults([]);
    setSubmissionFeedback(null);

    if (!currentQuestion) {
      console.error('No current question set');
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Error: No current question set.' }]);
      setIsLoading(false);
      return;
    }

    console.log("Submitting solution for question ID:", currentQuestion.id);

    try {
      const feedback = await handleSolutionSubmit(
        sqlQuery,
        currentQuestion.id,
        setChatHistory,
        setSqlError,
        setQueryResults,
        setCurrentPage
      );
      console.log("Received feedback:", feedback);
      setSubmissionFeedback(feedback);

      // After successful submission, refresh the submission history
      await fetchSubmissionHistory();
    } catch (error) {
      console.error('Error submitting solution:', error);
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'An error occurred while submitting the solution.' }]);
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
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">SQL Challenge AI</h1>
          <LogoutButton />
        <div className="mb-4 flex border-b border-gray-200">
          {['chat', 'query', 'practice', 'submissions'].map((tab) => (
            <button
              key={tab}
              className={`py-2 px-4 font-medium text-sm focus:outline-none ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
  
        {activeTab === 'chat' && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h2 className="text-xl font-semibold mb-2 text-gray-700">Chat with SQL Tutor AI</h2>
            <div
              className="h-64 overflow-y-auto mb-4 space-y-2"
              ref={chatContainerRef}
            >
              {chatHistory.map((msg, index) => (
                <div key={index} className={`p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                  <strong>{msg.role === 'user' ? 'You: ' : 'AI: '}</strong>
                  <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                </div>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleAskQuestion((e.target as HTMLFormElement).question.value); }}>
              <div className="flex">
                <input
                  type="text"
                  name="question"
                  placeholder="Ask a question..."
                  className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
                >
                  {isLoading ? 'Thinking...' : 'Ask'}
                </button>
              </div>
            </form>
          </div>
        )}
  
        {activeTab === 'query' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="md:w-1/4">
                <div className="bg-white rounded-lg shadow-md shadow-white">
                  <DatabaseSchema schemaData={schemaData} />
                </div>
              </div>

              <div className="md:w-3/4">
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h2 className="text-xl font-semibold mb-2 text-gray-700">SQL Query</h2>
                  <form onSubmit={handleSqlSubmit} className="space-y-2">
                    <AceEditor
                      mode="sql"
                      theme="textmate"
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
                        minHeight: '312px',
                        maxHeight: '350px'
                      }}
                      editorProps={{ $blockScrolling: true }}
                    />
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="flex-1 p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300 flex items-center justify-center"
                        disabled={isLoading}
                      >
                        {isLoading ? <span className="animate-spin mr-2">↻</span> : <Play size={20} className="mr-2" />}
                        {isLoading ? 'Executing...' : 'Execute SQL'}
                      </button>
                      <button
                        type="button"
                        onClick={onSolutionSubmit}
                        className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center justify-center"
                        disabled={isLoading || !currentQuestion}
                      >
                        <Send size={20} className="mr-2" />
                        Submit Solution
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {submissionFeedback && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-xl font-semibold mb-2 text-gray-700">Submission Feedback</h2>
                <div className="whitespace-pre-wrap bg-gray-100 p-3 rounded">
                  {submissionFeedback}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-2 text-gray-700">Query Results</h2>
              {sqlError ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold">Error: {sqlError.details}</strong>
                  <span className="block sm:inline"> {sqlError.message}</span>
                  <AlertCircle className="inline-block ml-2" size={20} />
                  <div className="mt-2">
                    <strong>Query:</strong>
                    <pre className="mt-1 bg-red-50 p-2 rounded">{sqlError.query}</pre>
                  </div>
                </div>
              ) : queryResults.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
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
                                <div className="group relative">
                                  <span className="truncate">
                                    {typeof value === 'object' ? JSON.stringify(value) : truncateText(String(value), 50)}
                                  </span>
                                  <span className="invisible group-hover:visible absolute z-10 bg-gray-800 text-white p-2 rounded text-sm -mt-1 ml-1">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-l"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <span className="text-gray-700">Page {currentPage} of {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-r"
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
        )}
        
        {activeTab === 'practice' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">SQL Practice</h2>
            <div className="space-y-6">
              {/* Current Question */}
              <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-blue-800">Current Question</h3>
                {currentQuestion ? (
                  <ReactMarkdown
                     className="prose max-w-none"
                     components={{
                       h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4" {...props} />,
                       h2: ({node, ...props}) => <h2 className="text-xl font-semibold mb-2" {...props} />,
                       strong: ({node, ...props}) => <span className="font-bold" {...props} />,
                       em: ({node, ...props}) => <span className="underline" {...props} />,
                       code: ({node, ...props}) => <code className="bg-gray-100 rounded px-1" {...props} />,
                     }}
                   >
                    {currentQuestion.content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-blue-500 italic">No question selected. Start a new SQL Challenge to begin.</p>
                )}
              </div>
  
              {/* SQL Editor and Action Buttons */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-700">Your Solution</h3>
                <AceEditor
                  mode="sql"
                  theme="github"
                  name="practice_sql_editor"
                  onChange={(newValue) => {
                    console.log('Practice AceEditor onChange:', newValue);
                    setSqlQuery(newValue);
                  }}
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
                    height: '200px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.375rem',
                  }}
                  editorProps={{ $blockScrolling: true }}
                />
                <div className="flex justify-between items-center space-x-4">
                  <div className="flex-shrink-0">
                    <SQLPractice onSelectCategory={handleCategorySelect} isLoading={isLoading} />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={handleSqlSubmit}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300 flex items-center justify-center disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <Play size={20} className="mr-2" />
                      {isLoading ? 'Executing...' : 'Execute SQL'}
                    </button>
                    <button
                      type="button"
                      onClick={onSolutionSubmit}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center justify-center disabled:opacity-50"
                      disabled={isLoading || !currentQuestion}
                    >
                      <Send size={20} className="mr-2" />
                      {isLoading ? 'Submitting...' : 'Submit Solution'}
                    </button>
                  </div>
                </div>
              </div>
              {/* Query Results */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Query Results</h3>
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
                    <div className="overflow-x-auto">
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
                                  <div className="group relative">
                                    <span className="truncate">
                                      {typeof value === 'object' ? JSON.stringify(value) : truncateText(String(value), 50)}
                                    </span>
                                    <span className="invisible group-hover:visible absolute z-10 bg-gray-800 text-white p-2 rounded text-sm -mt-1 ml-1">
                                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-l"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <span className="text-gray-700">Page {currentPage} of {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-r"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-gray-600">No results to display. Execute a query to see results here.</p>
              )}
            </div>

            {/* Submission Feedback */}
            {submissionFeedback && (
              <div className="bg-green-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2 text-green-800">Submission Feedback</h3>
                <div className="whitespace-pre-wrap font-sans text-green-700">
                  {submissionFeedback}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'submissions' && (
        <SubmissionHistory
          submissionHistory={submissionHistory}
          isLoading={isLoadingSubmissions}
          error={submissionError}
          onRefresh={fetchSubmissionHistory}
        />
      )}

      <div className="bg-white rounded-lg shadow-md p-4 mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-700">Query History</h2>
          <button
            onClick={() => setShowQueryHistory(!showQueryHistory)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showQueryHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        {showQueryHistory && (
          <div className="space-y-2">
            {queryHistory.map((item, index) => (
              <div key={index} className="bg-gray-50 p-2 rounded">
                <p className="font-semibold text-gray-700">{item.query_definition}</p>
                <p className="text-sm text-gray-500">{item.timestamp}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </main>
);
}

export default Home;