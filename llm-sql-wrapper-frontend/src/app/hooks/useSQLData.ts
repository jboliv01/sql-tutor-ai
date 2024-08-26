'use client';

import { useState, useCallback } from 'react';

export const useSQLData = () => {
  const [schemaData, setSchemaData] = useState([]);
  const [submissionHistory, setSubmissionHistory] = useState([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);

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

  return {
    schemaData,
    submissionHistory,
    isLoadingSubmissions,
    submissionError,
    fetchSchema,
    fetchSubmissionHistory,
  };
};