'use client';

import React from 'react';
import { MessageSquare, Database, Code, FileText } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'query', label: 'Query', icon: Database },
    { id: 'practice', label: 'Practice', icon: Code },
    { id: 'submissions', label: 'Submissions', icon: FileText },
  ];

  return (
    <div className="relative flex justify-center p-4 rounded-lg mb-6 bg-white bg-opacity-20">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`
              flex items-center py-3 px-6 font-medium text-lg focus:outline-none
              transition-all duration-200 ease-in-out
              rounded-lg mx-1
              transform hover:scale-105 hover:shadow-md
              ${
                activeTab === tab.id
                  ? 'text-indigo-600 bg-indigo-50 shadow-inner'
                  : 'text-gray-500 hover:text-indigo-500 hover:bg-indigo-50'
              }
            `}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon 
              className={`
                mr-2 h-5 w-5 transition-colors duration-200
                ${activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-indigo-400'}
              `} 
            />
            <span className="relative">
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 transition-all duration-200"></span>
              )}
            </span>
          </button>
        )
      })}
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-100"></div>
    </div>
  );
};

export default TabNavigation;
