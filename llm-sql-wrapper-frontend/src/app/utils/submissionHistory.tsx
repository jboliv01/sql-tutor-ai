import React from 'react';
import { Check, X, Loader, RefreshCw } from 'lucide-react';

interface SubmissionHistoryItem {
  id: number;
  question_id: number;
  question: string;
  category: string;
  correctness_score: number;
  efficiency_score: number;
  style_score: number;
  pass_fail: boolean | null;
  timestamp: string;
}

interface SubmissionHistoryProps {
  submissionHistory: SubmissionHistoryItem[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({
  submissionHistory,
  isLoading,
  error,
  onRefresh
}) => {
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-20">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Submission History</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader className="animate-spin mr-2" size={16} />
          ) : (
            <RefreshCw size={16} className="mr-2" />
          )}
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      {isLoading && (
        <div className="text-center py-4" aria-live="polite">
          <Loader className="animate-spin h-8 w-8 mx-auto mb-2" />
          Loading submission history...
        </div>
      )}
      
      {!isLoading && error && (
        <div className="text-center py-4 mb-4" role="alert">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {!isLoading && !error && submissionHistory.length === 0 && (
        <p className="text-center text-gray-500">No submission history available.</p>
      )}
      
      {!isLoading && !error && submissionHistory.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full" role="table">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left text-gray-600">Question</th>
                <th className="py-2 px-4 text-left text-gray-600">Category</th>
                <th className="py-2 px-4 text-left text-gray-600">Correctness</th>
                <th className="py-2 px-4 text-left text-gray-600">Efficiency</th>
                <th className="py-2 px-4 text-left text-gray-600">Style</th>
                <th className="py-2 px-4 text-left text-gray-600">Status</th>
                <th className="py-2 px-4 text-left text-gray-600">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {submissionHistory.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2 px-4 border-t text-gray-800">{truncateText(item.question, 50)}</td>
                  <td className="py-2 px-4 border-t text-gray-800">{item.category}</td>
                  <td className="py-2 px-4 border-t text-gray-800">{item.correctness_score}/10</td>
                  <td className="py-2 px-4 border-t text-gray-800">{item.efficiency_score}/10</td>
                  <td className="py-2 px-4 border-t text-gray-800">{item.style_score}/10</td>
                  <td className="py-2 px-4 border-t">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.pass_fail === true ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.pass_fail === true ? <Check size={16} className="mr-1" /> : <X size={16} className="mr-1" />}
                      {item.pass_fail === true ? 'Pass' : 'Fail'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-t text-gray-800">{formatTimestamp(item.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SubmissionHistory;