'use client';
import React from 'react';
import { MessageSquare, Database, Code, FileText } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'practice', label: 'Practice', icon: Code },
    { id: 'explore', label: 'Explore', icon: Database },
    { id: 'submissions', label: 'Submissions', icon: FileText },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
  ];

  return (
    <nav className="relative mb-8 flex flex-col items-center" aria-label="Main navigation">
      <div className="inline-flex flex-wrap justify-center gap-3 p-3 rounded-lg bg-white pb-6 pt-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`
                flex items-center py-3 px-6 font-medium text-lg
                rounded-md transition-all duration-200 ease-in-out
                focus:outline-none
                ${isActive
                  ? 'bg-indigo-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-indigo-50 shadow-lg hover:text-indigo-600 border border-gray-200'
                }
              `}
              style={{
                boxShadow: isActive
                  ? '0 0px 20px 5px rgba(99, 102, 241, 0.4), 0 0px 6px -2px rgba(99, 102, 241, 0.1)'
                  : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
              }}
              onClick={() => setActiveTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`
                  mr-3 h-6 w-6
                  ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-500'}
                `}
                aria-hidden="true"
              />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  );
};

export default TabNavigation;