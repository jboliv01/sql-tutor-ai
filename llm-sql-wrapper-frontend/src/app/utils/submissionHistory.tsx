'use client';

import React, { useMemo } from 'react';
import { Check, X, Loader, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Rectangle } from 'recharts';

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

  const categoryPerformance = useMemo(() => {
    const categoryData: { [key: string]: { totalScore: number; count: number } } = {};
    submissionHistory.forEach(item => {
      if (!categoryData[item.category]) {
        categoryData[item.category] = { totalScore: 0, count: 0 };
      }
      categoryData[item.category].totalScore += (item.correctness_score + item.efficiency_score + item.style_score) / 3;
      categoryData[item.category].count += 1;
    });

    return Object.entries(categoryData).map(([category, data]) => ({
      category,
      averageScore: Number((data.totalScore / data.count).toFixed(2))
    }));
  }, [submissionHistory]);

  const CustomBar = (props: any) => {
    const { x, y, width, height, name } = props;
    const fill = name === 'Pass Rate' ? '#82ca9d' : '#ff6b6b';
    return <Rectangle x={x} y={y} width={width} height={height} fill={fill} />;
  };

  const overallPerformance = useMemo(() => {
    const totalSubmissions = submissionHistory.length;
    const passedSubmissions = submissionHistory.filter(item => item.pass_fail).length;
    const passRate = Number(((passedSubmissions / totalSubmissions) * 100).toFixed(2));

    return [
      { name: 'Pass Rate', value: passRate },
      { name: 'Fail Rate', value: Number((100 - passRate).toFixed(2)) }
    ];
  }, [submissionHistory]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="font-semibold">{`${label}`}</p>
          <p>{`${payload[0].name}: ${payload[0].value.toFixed(2)}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-4 mb-20">
      <div className="flex justify-end items-center mb-4">
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Performance by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => value.toFixed(2)}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                  />
                  <Legend />
                  <Bar dataKey="averageScore" fill="#8884d8" name="Average Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Overall Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={overallPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="value"
                    name="Percentage"
                    shape={<CustomBar />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
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
        </>
      )}
    </div>
  );
};

export default SubmissionHistory;
