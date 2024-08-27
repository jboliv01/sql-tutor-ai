'use client';

import React, { useState, useEffect, useCallback } from 'react';
import TabNavigation from '../TabNavigation';
import ChatTab from '../components/features/chat/ChatTab';
import PracticeTab from '../components/features/practice/PracticeTab';
import QueryTab from '../components/features/query/QueryTab';
import SubmissionsTab from '../components/features/feedback/SubmissionsTab';
import { SchemaItem, SubmissionHistoryItem } from '../utils/types';

export function Home() {
  const [activeTab, setActiveTab] = useState('practice');
  const [schemaData, setSchemaData] = useState<SchemaItem[]>([]);
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionHistoryItem[]>([]);
  const [username, setUsername] = useState<string>('');
  const [defaultQuery, setDefaultQuery] = useState<string>('');

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
    }
  }, []);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username') || 'User';
    setUsername(storedUsername);
    const query = `SELECT * FROM user_${storedUsername}.sample_users LIMIT 5;`;
    setDefaultQuery(query);
    fetchSchema();
    fetchSubmissionHistory();
  }, [fetchSchema, fetchSubmissionHistory]);

  return (
    <main>
      <div className="space-y-6">
        {/* <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} /> */}
        <div className="bg-white rounded-xl shadow-lg p-6">
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
          {activeTab === 'practice' && (
            <PracticeTab
              schemaData={schemaData}
              submissionHistory={submissionHistory}
              fetchSubmissionHistory={fetchSubmissionHistory}
              username={username}
              defaultQuery={defaultQuery}
            />
          )}
          {activeTab === 'chat' && <ChatTab username={username} />}
          {activeTab === 'explore' && (
            <QueryTab
              schemaData={schemaData}
              username={username}
              defaultQuery={defaultQuery}
            />
          )}
          {activeTab === 'submissions' && (
            <SubmissionsTab
              username={username}
              fetchSubmissionHistory={fetchSubmissionHistory}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default Home;

// //src/app/home/page.tsx

// 'use client';
// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { ChevronDown, ChevronUp, Play, ChevronLeft, ChevronRight, AlertCircle, MessageSquare, History, Database, Send, BookOpen, Heart } from 'lucide-react';
// import AceEditor from 'react-ace';
// import ReactMarkdown from 'react-markdown';
// import 'ace-builds/src-noconflict/mode-sql';
// import 'ace-builds/src-noconflict/theme-textmate';
// import DatabaseSchema from '../components/schema'; 
// import SQLPractice from '../SQLPractice';
// import SubmissionHistory from '../utils/submissionHistory';
// import { handleSolutionSubmit, SqlError } from '../utils/sqlSolutionHandler';
// import LogoutButton from '../components/Logout';
// import Question from '../components/features/practice/Question'; 
// import PracticeSection from '../components/features/practice/PracticeSection';
// import FeedbackDisplay from '../components/features/feedback/FeedbackDisplay';
// import "../globals.css";

// type ChatMessage = {
//   role: 'user' | 'assistant';
//   content: string;
// };

// type SqlError = {
//   message: string;
//   query: string;
//   details: string;
// };

// type QueryHistoryItem = {
//   query_definition: string;
//   timestamp: string;
//   results: string;
// };

// type QueryResult = Record<string, any>;

// type SchemaItem = {
//   id?: string;
//   label: string;
//   children?: SchemaItem[];
// };

// interface SubmissionHistoryItem {
//   id: number;
//   question_id: number;
//   question: string;
//   category: string;
//   correctness_score: number;
//   efficiency_score: number;
//   style_score: number;
//   pass_fail: boolean | null;
//   timestamp: string;
// }

// export function Home() {
//   const [sqlQuery, setSqlQuery] = useState('SELECT * FROM public.sample_data LIMIT 5');
//   const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
//   const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
//   const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
//   const [sqlError, setSqlError] = useState<SqlError | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [showQueryHistory, setShowQueryHistory] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [editorHeight, setEditorHeight] = useState('150px');
//   const [schemaData, setSchemaData] = useState<SchemaItem[]>([]);
//   const [activeTab, setActiveTab] = useState('chat');
//   const [currentQuestion, setCurrentQuestion] = useState<{ id: string; category: string; question: string; tables: string; hint: string } | null>(null);  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);
//   const [submissionHistory, setSubmissionHistory] = useState<SubmissionHistoryItem[]>([]);
//   const [showSubmissionFeedback, setShowSubmissionFeedback] = useState(true);
//   const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
//   const [submissionError, setSubmissionError] = useState<string | null>(null);
//   const [showFeedback, setShowFeedback] = useState(false);
//   const [correctSolution, setCorrectSolution] = useState('');

//   const chatContainerRef = useRef<HTMLDivElement | null>(null);
//   const rowsPerPage = 5;

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');

//     if (!validateForm()) return;

//     setIsLoading(true);

//     try {
//       const response = await fetch('/api/login', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ username, password }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Login failed');
//       }

//       const data = await response.json();
//       console.log('Login successful:', data);
      
//       // Redirect to the home page after successful login
//       router.push('/home');
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchSchema = useCallback(async () => {
//     try {
//       const res = await fetch('/api/schema');
//       if (!res.ok) {
//         throw new Error('Failed to fetch schema');
//       }
//       const data = await res.json();
//       setSchemaData(data);
//     } catch (err) {
//       console.error('Error fetching schema:', err);
//     }
//   }, []);

//   const fetchSubmissionHistory = useCallback(async () => {
//     setIsLoadingSubmissions(true);
//     setSubmissionError(null);
//     try {
//       const res = await fetch('/api/submission-history', {
//         method: 'GET',
//         credentials: 'include',
//       });
//       if (!res.ok) {
//         throw new Error('Failed to fetch submission history');
//       }
//       const data = await res.json();
//       setSubmissionHistory(data);
//     } catch (err) {
//       console.error('Error fetching submission history:', err);
//       setSubmissionError(err.message || 'Failed to load submission history. Please try again later.');
//     } finally {
//       setIsLoadingSubmissions(false);
//     }
//   }, []);

//   useEffect(() => {
//     const username = localStorage.getItem('username') || 'User';
//     const userId = localStorage.getItem('userId');
    
//     console.log('Initial render - Username:', username, 'User ID:', userId);
  
//     const isSpecialUser = username.toLowerCase().includes('hattie') || username.toLowerCase().includes('hatsag');    const greetingMessage = (
//       <span>
//         <div className="flex items-center">
//           Hello {username}! {isSpecialUser && <Heart size={16} className="ml-1 text-red-500" />}
//         </div>
//         <div>I'm your SQL Tutor AI. How can I help you today?</div>
//       </span>
//     );
  
//     setChatHistory([{ 
//       role: 'assistant', 
//       content: greetingMessage
//     }]);
  
//     if (username) {
//       const defaultQuery = `SELECT * FROM user_${username}.sample_users LIMIT 5;`;
//       console.log('Setting default query:', defaultQuery);
//       setSqlQuery(defaultQuery);
//     } else {
//       console.log('No user ID found, not setting default query');
//     }
  
//     const updateHeight = () => {
//       const height = Math.max(150, window.innerHeight * 0.3);
//       setEditorHeight(`${height}px`);
//     };
  
//     window.addEventListener('resize', updateHeight);
//     updateHeight();
  
//     fetchSchema();
//     fetchSubmissionHistory();
  
//     return () => window.removeEventListener('resize', updateHeight);
// }, [fetchSchema, fetchSubmissionHistory]);

//   useEffect(() => {
//     console.log('sqlQuery updated:', sqlQuery);
//   }, [sqlQuery]);

//   useEffect(() => {
//     if (chatContainerRef.current) {
//       chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
//     }
//   }, [chatHistory]);

//   const truncateText = (text: string, maxLength: number) => {
//     if (text.length > maxLength) {
//       return text.substring(0, maxLength) + '...';
//     }
//     return text;
//   };

//   const handleSqlSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setSqlError(null);
//     setQueryResults([]);

//     try {
//         const res = await fetch('/api/execute-sql', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ sql: sqlQuery }),
//             credentials: 'include'
//         });

//         const rawResponseText = await res.text();
//         let data;

//         try {
//             data = JSON.parse(rawResponseText);
//         } catch (jsonError) {
//             throw new Error('Invalid JSON response from server.');
//         }

//         if (!res.ok) {
//             throw new Error(JSON.stringify({
//                 message: data.message || 'Failed to execute SQL query',
//                 query: data.query || sqlQuery,
//                 error: data.error || 'Execution Error'
//             }));
//         }

//         setQueryResults(data.result);
//         setCurrentPage(1);
//         setChatHistory(prev => [...prev,
//             { role: 'user', content: `Executed SQL: ${sqlQuery}` },
//             { role: 'assistant', content: `Query executed successfully. ${data.result.length} rows returned.` }
//         ]);
//     } catch (err) {
//         console.error('Error:', err);

//         let errorData: { message: string, query: string, error: string };

//         if (err instanceof Error) {
//             try {
//                 errorData = JSON.parse(err.message);
//             } catch (parseError) {
//                 errorData = {
//                     message: err.message || 'Unknown Error',
//                     query: sqlQuery,
//                     error: 'An unexpected error occurred.'
//                 };
//             }
//         } else {
//             errorData = {
//                 message: 'Unknown Error',
//                 query: sqlQuery,
//                 error: 'An unexpected error occurred.'
//             };
//         }

//         setSqlError({
//             message: errorData.message,
//             query: errorData.query,
//             details: errorData.error
//         });
//         setChatHistory(prev => [...prev, { role: 'assistant', content: `An error occurred while executing the SQL query: ${errorData.message}` }]);
//     } finally {
//         setIsLoading(false);
//     }
// };

  

//   const handleAskQuestion = async (question: string) => {
//     setIsLoading(true);
//     try {
//       const response = await fetch('/api/ask', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ question }),
//       });

//       if (!response.ok) {
//         throw new Error('Failed to fetch response');
//       }

//       const data = await response.json();

//       setChatHistory(prev => [
//         ...prev,
//         { role: 'user', content: question },
//         { role: 'assistant', content: data.response },
//       ]);

//       if (data.query_history) {
//         setQueryHistory(data.query_history);
//       }
//     } catch (error) {
//       console.error('Error asking question:', error);
//       setChatHistory(prev => [
//         ...prev,
//         { role: 'assistant', content: 'Sorry, I encountered an error while processing your question. Please try again.' },
//       ]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleCategorySelect = async (category: string) => {
//     setIsLoading(true);
//     setChatHistory(prev => [
//       ...prev,
//       { role: 'user', content: `Selected category: ${category}` },
//     ]);

//     try {
//       const response = await fetch('/api/ask', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           question: `Generate a practice question for the category: ${category}`,
//           is_practice: true,
//           category: category
//         }),
//       });

//       if (!response.ok) {
//         throw new Error('Failed to fetch practice question');
//       }

//       const data = await response.json();

//       if (data.response && typeof data.response === 'object') {
//         const { id, category, question, tables, hint } = data.response;
//         setCurrentQuestion({ id, category, question, tables, hint });
//         setChatHistory(prev => [
//           ...prev,
//           { role: 'assistant', content: `Here's a practice question for you:\n\nCategory: ${category}\n\nQuestion: ${question}\n\nTables: ${tables}\n\nHint: ${hint}` },
//         ]);
//       } else {
//         console.error('Unexpected response format:', data);
//         throw new Error('Unexpected response format from server');
//       }
//     } catch (error) {
//       console.error('Error fetching practice question:', error);
//       setChatHistory(prev => [
//         ...prev,
//         { role: 'assistant', content: 'Sorry, I encountered an error while generating a practice question. Please try again.' },
//       ]);
//       setCurrentQuestion(null);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const onSolutionSubmit = async () => {
//     setIsLoading(true);
//     setSqlError(null);
//     setQueryResults([]);
//     setSubmissionFeedback(null);
  
//     if (!currentQuestion) {
//       console.error('No current question set');
//       setChatHistory(prev => [...prev, { role: 'assistant', content: 'Error: No current question set.' }]);
//       setIsLoading(false);
//       return;
//     }
  
//     console.log("Submitting solution for question ID:", currentQuestion.id);
  
//     try {
//       const feedback = await handleSolutionSubmit(
//         sqlQuery,
//         currentQuestion.id,
//         setChatHistory,
//         setSqlError,
//         setQueryResults,
//         setCurrentPage
//       );
//       console.log("Received feedback:", feedback);
//       setSubmissionFeedback(feedback);
  
//       // Extract correct solution from feedback
//       const correctSolutionMatch = feedback.match(/Correct Solution:\s*([\s\S]*?)(?:\n\n|$)/);
//       const correctSolution = correctSolutionMatch ? correctSolutionMatch[1].trim() : '';
//       setCorrectSolution(correctSolution);
  
//       // Set showFeedback to true to display the feedback
//       setShowFeedback(true);
  
//       // After successful submission, refresh the submission history
//       await fetchSubmissionHistory();
//     } catch (error) {
//       console.error('Error submitting solution:', error);
//       setChatHistory(prev => [...prev, { role: 'assistant', content: 'An error occurred while submitting the solution.' }]);
//     } finally {
//       setIsLoading(false);
//     }
//   };


//   const handleTryAgain = () => {
//     setShowFeedback(false);
//   };

//   const handleNextChallenge = async () => {
//     setShowFeedback(false);
//     await handleCategorySelect(currentQuestion?.category || '');
//   };

//   const paginatedResults = queryResults.slice(
//     (currentPage - 1) * rowsPerPage,
//     currentPage * rowsPerPage
//   );

//   const totalPages = Math.ceil(queryResults.length / rowsPerPage);
  
//   return (
//     <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-16">
//       <div className="container mx-auto max-w-7xl">
//         <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
//           <div className="flex justify-between items-center mb-6">
//             <h1 className="text-3xl font-bold text-indigo-800 flex items-center">
//               <Database className="mr-2 h-8 w-8 text-indigo-600" />
//               SQL Challenge AI
//             </h1>
//             <LogoutButton />
//           </div>
//           <div className="flex border-b border-gray-200">
//             {['chat', 'query', 'practice', 'submissions'].map((tab) => (
//               <button
//                 key={tab}
//                 className={`py-2 px-4 font-medium text-sm focus:outline-none transition-colors duration-200 ${
//                   activeTab === tab
//                     ? 'border-b-2 border-indigo-500 text-indigo-600'
//                     : 'text-gray-500 hover:text-indigo-500'
//                 }`}
//                 onClick={() => setActiveTab(tab)}
//               >
//                 {tab.charAt(0).toUpperCase() + tab.slice(1)}
//               </button>
//             ))}
//           </div>
//         </div>
  
//         <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
//           {activeTab === 'chat' && (
//             <div>
//               <h2 className="text-2xl font-semibold mb-4 text-indigo-800 flex items-center">
//                 <MessageSquare className="mr-2 h-6 w-6" />
//                 Chat with SQL Tutor AI
//               </h2>
//               <div
//                 className="h-64 overflow-y-auto mb-4 space-y-2 border border-gray-200 rounded-lg p-4"
//                 ref={chatContainerRef}
//               >
//                 {chatHistory.map((msg, index) => (
//                   <div key={index} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
//                     <strong>{msg.role === 'user' ? 'You: ' : 'AI: '}</strong>
//                     <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
//                   </div>
//                 ))}
//               </div>
//               <form onSubmit={(e) => { e.preventDefault(); handleAskQuestion((e.target as HTMLFormElement).question.value); }} className="flex">
//                 <input
//                   type="text"
//                   name="question"
//                   placeholder="Ask a question..."
//                   className="flex-grow p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
//                 />
//                 <button
//                   type="submit"
//                   disabled={isLoading}
//                   className="bg-indigo-500 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50 transition-colors duration-200"
//                 >
//                   {isLoading ? 'Thinking...' : 'Ask'}
//                 </button>
//               </form>
//             </div>
//           )}
  
//           {activeTab === 'query' && (
//             <div className="space-y-6">
//               <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
//                 <div className="md:w-1/4">
//                   <div className="bg-white rounded-lg shadow-md shadow-gray-200">
//                     <DatabaseSchema schemaData={schemaData} />
//                   </div>
//                 </div>
//                 <div className="md:w-3/4 shadow-md shadow-gray-200 rounded-lg bg-white pl-2 pr-2">
//                   <h2 className="text-2xl font-semibold mb-4 text-indigo-800 flex items-center">
//                     <Database className="mr-2 h-6 w-6" />
//                     SQL Query
//                   </h2>
//                   <form onSubmit={handleSqlSubmit} className="space-y-4">
//                     <AceEditor
//                       mode="sql"
//                       theme="github"
//                       name="sql_editor"
//                       onChange={(newValue) => setSqlQuery(newValue)}
//                       fontSize={16}
//                       width="100%"
//                       height={editorHeight}
//                       value={sqlQuery}
//                       setOptions={{
//                         enableBasicAutocompletion: true,
//                         enableLiveAutocompletion: true,
//                         enableSnippets: true,
//                         showLineNumbers: true,
//                         tabSize: 2,
//                       }}
//                     />
//                     <div className="flex space-x-2">
//                       <button
//                         type="submit"
//                         className="flex-1 p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300 flex items-center justify-center"
//                         disabled={isLoading}
//                       >
//                         {isLoading ? <span className="animate-spin mr-2">↻</span> : <Play size={20} className="mr-2" />}
//                         {isLoading ? 'Executing...' : 'Execute SQL'}
//                       </button>
//                       <button
//                         type="button"
//                         onClick={onSolutionSubmit}
//                         className="flex-1 p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 flex items-center justify-center"
//                         disabled={isLoading || !currentQuestion}
//                       >
//                         <Send size={20} className="mr-2" />
//                         Submit Solution
//                       </button>
//                     </div>
//                   </form>
//                 </div>
//               </div>
  
//             </div>
//           )}


//           {activeTab === 'practice' && (
//             showFeedback ? (
//               <FeedbackDisplay 
//                 feedback={submissionFeedback || ''}
//                 userSolution={sqlQuery}
//                 correctSolution={correctSolution}
//                 onTryAgain={handleTryAgain}
//                 onNextChallenge={handleNextChallenge}
//               />
//             ) : (
//               <PracticeSection
//                 currentQuestion={currentQuestion}
//                 sqlQuery={sqlQuery}
//                 setSqlQuery={setSqlQuery}
//                 handleSqlSubmit={handleSqlSubmit}
//                 onSolutionSubmit={onSolutionSubmit}
//                 handleCategorySelect={handleCategorySelect}
//                 isLoading={isLoading}
//                 queryResults={queryResults}
//                 sqlError={sqlError}
//                 currentPage={currentPage}
//                 setCurrentPage={setCurrentPage}
//                 rowsPerPage={rowsPerPage}
//               />
//             )
//           )}


      
//         {activeTab === 'submissions' && (
//           <div>
//             <h2 className="text-2xl font-semibold mb-4 text-indigo-800 flex items-center">
//               <History className="mr-2 h-6 w-6" />
//               Submission History
//             </h2>
//             <SubmissionHistory
//               submissionHistory={submissionHistory}
//               isLoading={isLoadingSubmissions}
//               error={submissionError}
//               onRefresh={fetchSubmissionHistory}
//             />
//           </div>
//         )}
//       </div>
        
//       {/* Query History */}
//       <div className="bg-white rounded-xl shadow-lg p-6">
//         <div className="flex items-center justify-between mb-4">
//           <h2 className="text-2xl font-semibold text-indigo-800 flex items-center">
//             <History className="mr-2 h-6 w-6" />
//             Query History
//           </h2>
//           <button
//             onClick={() => setShowQueryHistory(!showQueryHistory)}
//             className="text-indigo-500 hover:text-indigo-700 focus:outline-none transition-colors duration-200"
//           >
//             {showQueryHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
//           </button>
//         </div>
//         {showQueryHistory && (
//           <div className="space-y-2">
//             {queryHistory.map((item, index) => (
//               <div key={index} className="bg-gray-50 p-3 rounded-lg">
//                 <p className="font-semibold text-indigo-700">{item.query_definition}</p>
//                 <p className="text-sm text-gray-500">{item.timestamp}</p>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   </main>
// );
// }

// export default Home;