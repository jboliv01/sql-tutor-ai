import React, { useState } from 'react';
import { BookOpen, ChevronRight, Code, Database, Filter, GitForkIcon, GitMerge, LayoutGrid, LineChart, Maximize, Zap, Loader } from 'lucide-react';

const SQL_PRACTICE_CATEGORIES = [
 { name: "Basic SQL Syntax", icon: Code },
 { name: "Data Manipulation", icon: Database },
 { name: "Filtering and Sorting", icon: Filter },
 { name: "Joins and Relationships", icon: GitForkIcon },
 { name: "Aggregations and GROUP BY", icon: LayoutGrid },
 { name: "Subqueries and CTEs", icon: GitMerge },
 { name: "Window Functions", icon: Maximize },
 { name: "Data Modeling and Schema Design", icon: Database },
 { name: "Performance Optimization", icon: Zap },
 { name: "Advanced SQL Concepts", icon: LineChart }
];

type SQLPracticeProps = {
 onSelectCategory: (category: string) => void;
 isLoading: boolean;
};

const SQLPractice: React.FC<SQLPracticeProps> = ({ onSelectCategory, isLoading }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const handleNextClick = () => {
    if (selectedCategory) {
      onSelectCategory(selectedCategory);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8 space-y-6 h-full">
      <h2 className="text-3xl pb-10 font-bold text-indigo-800 flex items-center">
        <BookOpen className="mr-3 h-8 w-8 text-indigo-600" />
        Select a category to start your SQL practice session
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-fit">
        {SQL_PRACTICE_CATEGORIES.map(({ name, icon: Icon }) => (
          <button
            key={name}
            onClick={() => handleCategorySelect(name)}
            className={`p-4 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
              selectedCategory === name
                ? 'bg-indigo-500 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
            }`}
            disabled={isLoading}
          >
            <div className="flex items-center space-x-3">
              <Icon className={`h-6 w-6 ${selectedCategory === name ? 'text-indigo-100' : 'text-indigo-500'}`} />
              <span className="text-lg font-medium">{name}</span>
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={handleNextClick}
        className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-transform duration-200"
        disabled={isLoading || !selectedCategory}
      >
        {isLoading ? (
          <>
            <Loader className="animate-spin mr-2 h-5 w-5" />
            Generating Question...
          </>
        ) : (
          <>
            Start Challenge
            <ChevronRight className="ml-2 h-5 w-5" />
          </>
        )}
      </button>
    </div>
  );
};

export default SQLPractice;