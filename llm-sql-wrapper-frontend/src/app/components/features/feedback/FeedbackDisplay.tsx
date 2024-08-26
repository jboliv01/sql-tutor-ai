import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

type FeedbackType = "correct" | "partially_correct" | "incorrect";

interface FeedbackDisplayProps {
  feedback: string;
  userSolution: string;
  correctSolution: string;
  onTryAgain: () => void;
  onNextChallenge: () => void;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ 
  feedback, 
  userSolution, 
  correctSolution, 
  onTryAgain, 
  onNextChallenge 
}) => {
  const correctnessScore = parseInt(feedback.match(/Correctness \((\d+)\/10\)/)?.[1] || '0');
  const efficiencyScore = parseInt(feedback.match(/Efficiency \((\d+)\/10\)/)?.[1] || '0');
  const styleScore = parseInt(feedback.match(/Style \((\d+)\/10\)/)?.[1] || '0');
  const overallResult = feedback.includes('Overall Result: Pass') ? 'Pass' : 'Fail';
  const totalScore = Math.round((correctnessScore + efficiencyScore + styleScore) / 3 * 10);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFeedbackType = (): FeedbackType => {
    if (overallResult === 'Pass') return 'correct';
    if (totalScore >= 60) return 'partially_correct';
    return 'incorrect';
  };

  const getFeedbackIcon = (type: FeedbackType) => {
    switch (type) {
      case "correct":
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case "partially_correct":
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />
      case "incorrect":
        return <XCircle className="w-6 h-6 text-red-500" />
    }
  };

  const getFeedbackColor = (type: FeedbackType) => {
    switch (type) {
      case "correct":
        return "bg-green-100 border-green-200"
      case "partially_correct":
        return "bg-yellow-100 border-yellow-200"
      case "incorrect":
        return "bg-red-100 border-red-200"
    }
  };

  const feedbackType = getFeedbackType();

  return (
    <div className={`w-full rounded-lg p-6 bg-white`}>
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          {getFeedbackIcon(feedbackType)}
          <h2 className="text-xl font-semibold">Submission Feedback</h2>
        </div>
        <p className="text-sm text-gray-600">Here's how you did on this SQL challenge</p>
      </div>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Your Score</h3>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${totalScore}%` }}></div>
          </div>
          <p className="text-right text-sm text-gray-600 mt-1">{totalScore}%</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Detailed Scores</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600">Correctness</p>
              <p className={`text-lg font-bold ${getScoreColor(correctnessScore)}`}>{correctnessScore}/10</p>
            </div>
            <div>
              <p className="text-gray-600">Efficiency</p>
              <p className={`text-lg font-bold ${getScoreColor(efficiencyScore)}`}>{efficiencyScore}/10</p>
            </div>
            <div>
              <p className="text-gray-600">Style</p>
              <p className={`text-lg font-bold ${getScoreColor(styleScore)}`}>{styleScore}/10</p>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-lg ${overallResult === 'Pass' ? 'bg-green-50' : 'bg-red-50'}`}>
          <h4 className={`font-semibold mb-2 flex items-center ${overallResult === 'Pass' ? 'text-green-800' : 'text-red-800'}`}>
            {overallResult === 'Pass' ? <CheckCircle className="mr-2 h-5 w-5" /> : <AlertTriangle className="mr-2 h-5 w-5" />}
            Overall Result: {overallResult}
          </h4>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-2">Your Solution</h3>
          <pre className="bg-gray-100 p-2 rounded-md text-sm overflow-x-auto">
            <code>{userSolution}</code>
          </pre>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-2">Correct Solution</h3>
          <pre className="bg-gray-100 p-2 rounded-md text-sm overflow-x-auto">
            <code>{correctSolution}</code>
          </pre>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">Detailed Feedback</h4>
          <p className="text-yellow-700 whitespace-pre-wrap">{feedback}</p>
        </div>
      </div>
      <div className="flex justify-between mt-6">
        <button 
          onClick={onTryAgain}
          className="px-4 py-2 bg-white text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-50 transition-colors"
        >
          Try Again
        </button>
        <button 
          onClick={onNextChallenge}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          Next Challenge
        </button>
      </div>
    </div>
  );
};

export default FeedbackDisplay;