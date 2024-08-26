'use client';
import React, { useState, useEffect, useCallback } from 'react';
import PracticeSection from './PracticeSection';
import FeedbackDisplay from '../feedback/FeedbackDisplay';
import { handleSolutionSubmit } from '../../../utils/sqlSolutionHandler';
import { SchemaItem, QueryResult, SqlError, SubmissionHistoryItem, CurrentQuestion, ChatMessage } from '../../../utils/types';

interface PracticeTabProps {
  schemaData: SchemaItem[];
  submissionHistory: SubmissionHistoryItem[];
  fetchSubmissionHistory: () => Promise<void>;
  username: string;
}

const PracticeTab: React.FC<PracticeTabProps> = ({ schemaData, submissionHistory, fetchSubmissionHistory, username }) => {
  const userSchema = `user_${username}`;
  const [sqlQuery, setSqlQuery] = useState(`SELECT * FROM ${userSchema}.sample_users LIMIT 5`);
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

  const getDefaultQuestion = useCallback((): CurrentQuestion => ({
    id: '-1',
    category: 'Basic SQL Syntax',
    question: `Select the top 5 rows from your schema's sample_users table.`,
    tables: `${userSchema}.sample_users`,
    hint: 'Use the SELECT statement with a LIMIT clause.',
  }), [userSchema]);

  const fetchQuestion = useCallback(async (category?: string) => {
    setIsLoading(true);
    setQuestionError(null);

    try {
      if (!category) {
        // If no category is provided, use the default question
        const defaultQuestion = getDefaultQuestion();
        setCurrentQuestion(defaultQuestion);
        setSqlQuery(`SELECT * FROM ${userSchema}.sample_users LIMIT 5`);
      } else {
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
          setCurrentQuestion({ id, category, question, tables, hint });
        } else {
          throw new Error('Unexpected response format from server');
        }
      }
    } catch (error) {
      console.error('Error fetching practice question:', error);
      setQuestionError('Failed to load question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userSchema, getDefaultQuestion]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

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
      console.log('Received feedback:', feedback);
      setSubmissionFeedback(feedback);

      const correctSolutionMatch = feedback.match(/Example of improved query:\s*([\s\S]*?)(?=\n\n|$)/);
      const correctSolution = correctSolutionMatch ? correctSolutionMatch[1].trim() : '';
      setCorrectSolution(correctSolution);

      setShowFeedback(true);

      await fetchSubmissionHistory();
    } catch (error) {
      console.error('Error submitting solution:', error);
      // Error is already set by handleSolutionSubmit
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAgain = () => {
    setShowFeedback(false);
  };

  const handleNextChallenge = async () => {
    setShowFeedback(false);
    await fetchQuestion(currentQuestion?.category);
  };

  const onRetryQuestion = () => {
    fetchQuestion(currentQuestion?.category);
  };

  return (
    <div>
      {showFeedback ? (
        <FeedbackDisplay
          feedback={submissionFeedback || ''}
          userSolution={sqlQuery}
          correctSolution={correctSolution}
          onTryAgain={handleTryAgain}
          onNextChallenge={handleNextChallenge}
        />
      ) : (
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
      )}
    </div>
  );
};

export default PracticeTab;