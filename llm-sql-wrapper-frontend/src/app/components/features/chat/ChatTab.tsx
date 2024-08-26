'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { ChatMessage } from '../../../utils/types';

interface ChatTabProps {
  username: string;
}

export function ChatTab({ username }: ChatTabProps) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Add the default greeting when the component mounts
    const defaultGreeting: ChatMessage = {
      role: 'assistant',
      content: `Hello ${username}! Welcome to the SQL Tutor AI. How can I assist you today? Feel free to ask any questions about SQL, database concepts, or practice exercises.`
    };
    setChatHistory([defaultGreeting]);
  }, [username]);

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

  useEffect(() => {
    // Scroll to the bottom of the chat container when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-indigo-800 flex items-center">
        <MessageSquare className="mr-2 h-6 w-6" />
        Chat with SQL Tutor AI
      </h2>
      <div
        className="h-128 overflow-y-auto mb-4 space-y-2 border border-gray-200 rounded-lg p-4"
        ref={chatContainerRef}
      >
        {chatHistory.map((msg, index) => (
          <div key={index} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
            <strong>{msg.role === 'user' ? 'You: ' : 'AI: '}</strong>
            <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); const form = e.target as HTMLFormElement; handleAskQuestion(form.question.value); form.reset(); }} className="flex">
        <input
          type="text"
          name="question"
          placeholder="Ask a question..."
          className="flex-grow p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-500 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50 transition-colors duration-200"
        >
          {isLoading ? 'Thinking...' : 'Ask'}
        </button>
      </form>
    </div>
  );
}

export default ChatTab;