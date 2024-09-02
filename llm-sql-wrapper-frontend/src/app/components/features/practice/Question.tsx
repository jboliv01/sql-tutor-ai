'use client';
import React, { useState } from 'react';
import { BookOpen, Database, Lightbulb, MessageCircleQuestionIcon } from 'lucide-react';

const Question = ({ question }) => {
  const [revealHint, setRevealHint] = useState(false);

  return (
    <div className="bg-white rounded-lg p-6 space-y-4">
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-700 text-lg">{question.question}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2 flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Tables
          </h4>
          <p className="text-green-700">{question.tables}</p>
        </div>
        
        <div 
          className={`bg-yellow-50 p-4 rounded-lg transition-colors duration-200 ${
            revealHint ? 'bg-yellow-100' : 'hover:bg-yellow-100 cursor-pointer'
          }`}
          onClick={() => setRevealHint(!revealHint)}
        >
          <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
            <Lightbulb className="mr-2 h-5 w-5" />
            Hint
          </h4>
          <div className="relative">
            <p className={`text-yellow-700 ${revealHint ? '' : 'blur-sm select-none'}`}>
              {question.hint}
            </p>
            {!revealHint && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-sm">
                  Click to reveal hint
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Question;