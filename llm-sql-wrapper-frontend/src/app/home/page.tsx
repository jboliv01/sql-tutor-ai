'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TabNavigation from '../TabNavigation';
import ChatTab from '../components/features/chat/ChatTab';
import PracticeTab from '../components/features/practice/PracticeTab';
import QueryTab from '../components/features/query/QueryTab';
import SubmissionsTab from '../components/features/feedback/SubmissionsTab';
import { SchemaItem, SubmissionHistoryItem } from '../utils/types';
import { useAuth } from '../hooks/useAuth';

export function Home() {
  const [activeTab, setActiveTab] = useState('practice');
  const [schemaData, setSchemaData] = useState<SchemaItem[]>([]);
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionHistoryItem[]>([]);
  const [username, setUsername] = useState<string>('');
  const [sharedQuery, setSharedQuery] = useState<string>('');
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  console.log('Home component rendered. Auth state:', { isAuthenticated, isLoading });

  const fetchSchema = useCallback(async () => {
    try {
      const res = await fetch('/api/schema', { credentials: 'include' });
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
    const fetchUserInfo = async () => {
      try {
        const res = await fetch('/api/check-auth', {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error('Failed to fetch user info');
        }
        const data = await res.json();
        setUsername(data.username);
        setSharedQuery(`SELECT * FROM user_${data.username}.sample_users LIMIT 5;`);
      } catch (err) {
        console.error('Error fetching user info:', err);
        router.push('/login');
      }
    };

    if (isAuthenticated) {
      console.log('User is authenticated, fetching user info');
      fetchUserInfo();
      fetchSchema();
      fetchSubmissionHistory();
    } else if (isAuthenticated === false) {
      console.log('User is not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [isAuthenticated, router, fetchSchema, fetchSubmissionHistory]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    console.log('User is not authenticated, rendering null');
    return null;
  }

  console.log('Rendering Home component content');
  return (
    <main>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
          {activeTab === 'practice' && (
            <PracticeTab
              schemaData={schemaData}
              submissionHistory={submissionHistory}
              fetchSubmissionHistory={fetchSubmissionHistory}
              username={username}
              sharedQuery={sharedQuery}
              setSharedQuery={setSharedQuery}
            />
          )}
          {activeTab === 'chat' && <ChatTab username={username} />}
          {activeTab === 'explore' && (
            <QueryTab
              schemaData={schemaData}
              username={username}
              sharedQuery={sharedQuery}
              setSharedQuery={setSharedQuery}
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