import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';

const SQL_PRACTICE_CATEGORIES = [
  "Basic SQL Syntax",
  "Data Manipulation (SELECT, INSERT, UPDATE, DELETE)",
  "Filtering and Sorting",
  "Joins and Relationships",
  "Aggregations and GROUP BY",
  "Subqueries and Common Table Expressions (CTEs)",
  "Window Functions",
  "Data Modeling and Schema Design",
  "Performance Optimization and Indexing",
  "Advanced SQL Concepts"
];
type SQLPracticeProps = {
  onSelectCategory: (category: string) => void;
  isLoading: boolean;
};

const SQLPractice: React.FC<SQLPracticeProps> = ({ onSelectCategory, isLoading }) => {
  const [showCategories, setShowCategories] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategories(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCategorySelect = (category: string) => {
    setShowCategories(false);
    onSelectCategory(category);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowCategories(!showCategories)}
        className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300 flex items-center justify-center"
        disabled={isLoading}
      >
        <BookOpen size={20} className="mr-2" />
        Start a new SQL Challenge
        <ChevronDown size={20} className="ml-2" />
      </button>
      {showCategories && (
        <div className="absolute z-10 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {SQL_PRACTICE_CATEGORIES.map((category, index) => (
              <button
                key={index}
                onClick={() => handleCategorySelect(category)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                role="menuitem"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SQLPractice;