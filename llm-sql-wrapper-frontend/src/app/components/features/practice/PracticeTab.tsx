
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import PracticeSection from './PracticeSection';
import FeedbackDisplay from '../feedback/FeedbackDisplay';
import { handleSolutionSubmit } from '../../../utils/sqlSolutionHandler';
import { SchemaItem, QueryResult, SqlError, SubmissionHistoryItem, CurrentQuestion, ChatMessage } from '../../../utils/types';
import SQLPractice from './PracticeButton';
import { BookOpen } from 'lucide-react';

interface PracticeTabProps {
  schemaData: SchemaItem[];
  submissionHistory: SubmissionHistoryItem[];
  fetchSubmissionHistory: () => Promise<void>;
  username: string;
}

const PracticeTab: React.FC<PracticeTabProps> = ({ schemaData, submissionHistory, fetchSubmissionHistory, username }) => {
  const userSchema = `user_${username}`;
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [sqlError, setSqlError] = useState<SqlError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctSolution, setCorrectSolution] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const rowsPerPage = 5;

  useEffect(() => {
    // Load persisted question state from localStorage when component mounts
    const savedQuestion = localStorage.getItem('currentQuestion');
    const savedQuery = localStorage.getItem('currentSqlQuery');
    if (savedQuestion) {
      setCurrentQuestion(JSON.parse(savedQuestion));
    }
    if (savedQuery) {
      setSqlQuery(savedQuery);
    }
  }, []);

  const fetchQuestion = useCallback(async (category: string) => {
    setIsLoading(true);
    setQuestionError(null);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `Generate a practice question for the category: ${category}`,
          is_practice: true,
          category: category,
          userSchema: userSchema,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch practice question');
      }

      const data = await response.json();

      if (data.response && typeof data.response === 'object') {
        const { id, category, question, tables, hint } = data.response;
        const newQuestion = { id, category, question, tables, hint };
        setCurrentQuestion(newQuestion);
        setSqlQuery('');
        // Persist the new question and reset the query in localStorage
        localStorage.setItem('currentQuestion', JSON.stringify(newQuestion));
        localStorage.setItem('currentSqlQuery', '');
      } else {
        throw new Error('Unexpected response format from server');
      }
    } catch (error) {
      console.error('Error fetching practice question:', error);
      setQuestionError('Failed to load question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userSchema]);

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
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(JSON.stringify({
          message: data.error || 'Failed to execute SQL query',
          query: sqlQuery,
          details: data.details || 'No additional details provided',
        }));
      }

      setQueryResults(data.result);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error:', err);
      setSqlError(err as SqlError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = async (category: string) => {
    await fetchQuestion(category);
  };

  const handleReturnToCategories = () => {
    setCurrentQuestion(null);
    setSqlQuery('');
    setQueryResults([]);
    setSqlError(null);
    // Clear persisted question state
    localStorage.removeItem('currentQuestion');
    localStorage.removeItem('currentSqlQuery');
  };

  const onSolutionSubmit = async () => {
    setIsLoading(true);
    setSqlError(null);
    setQueryResults([]);
    setSubmissionFeedback(null);

    if (!currentQuestion) {
      console.error('No current question set');
      setIsLoading(false);
      return;
    }

    try {
      const feedback = await handleSolutionSubmit(
        sqlQuery,
        currentQuestion.id.toString(),
        setChatHistory,
        setSqlError,
        setQueryResults,
        setCurrentPage
      );
      setSubmissionFeedback(feedback);

      const correctSolutionMatch = feedback.match(/Example of improved query:\s*([\s\S]*?)(?=\n\n|$)/);
      const correctSolution = correctSolutionMatch ? correctSolutionMatch[1].trim() : '';
      setCorrectSolution(correctSolution);

      setShowFeedback(true);

      await fetchSubmissionHistory();
      
      // Clear persisted question state after submission
      localStorage.removeItem('currentQuestion');
      localStorage.removeItem('currentSqlQuery');
    } catch (error) {
      console.error('Error submitting solution:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAgain = () => {
    setShowFeedback(false);
  };

  const handleNextChallenge = async () => {
    setShowFeedback(false);
    setCurrentQuestion(null);
    setSqlQuery('');
    // Clear persisted question state
    localStorage.removeItem('currentQuestion');
    localStorage.removeItem('currentSqlQuery');
  };

  const onRetryQuestion = () => {
    if (currentQuestion) {
      fetchQuestion(currentQuestion.category);
    }
  };

  // Update localStorage whenever sqlQuery changes
  useEffect(() => {
    localStorage.setItem('currentSqlQuery', sqlQuery);
  }, [sqlQuery]);

  return (
    <div>
      {!currentQuestion ? (
        <SQLPractice onSelectCategory={handleCategorySelect} isLoading={isLoading} />
      ) : showFeedback ? (
        <FeedbackDisplay
          feedback={submissionFeedback || ''}
          userSolution={sqlQuery}
          correctSolution={correctSolution}
          onTryAgain={handleTryAgain}
          onNextChallenge={handleNextChallenge}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-indigo-800 flex items-center">
              <BookOpen className="mr-2 h-6 w-6" />
              Question
            </h2>
            <button
              onClick={handleReturnToCategories}
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Change Category
            </button>
          </div>
          <PracticeSection
            currentQuestion={currentQuestion}
            sqlQuery={sqlQuery}
            setSqlQuery={setSqlQuery}
            handleSqlSubmit={handleSqlSubmit}
            onSolutionSubmit={onSolutionSubmit}
            handleCategorySelect={handleCategorySelect}
            isLoading={isLoading}
            queryResults={queryResults}
            sqlError={sqlError}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            rowsPerPage={rowsPerPage}
            username={username}
            questionError={questionError}
            onRetryQuestion={onRetryQuestion}
          />
        </div>
      )}
    </div>
  );
};

export default PracticeTab;