import React, { useState, useEffect } from 'react';
import { SubmissionHistoryItem } from '../../../utils/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SubmissionsTabProps {
  username: string;
  fetchSubmissionHistory: () => Promise<void>;
}

const SubmissionsTab: React.FC<SubmissionsTabProps> = ({ username, fetchSubmissionHistory }) => {
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubmissionHistory();
  }, []);

  const loadSubmissionHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchSubmissionHistory();
      const response = await fetch('/api/submission-history');
      if (!response.ok) {
        throw new Error('Failed to fetch submission history');
      }
      const data = await response.json();
      setSubmissionHistory(data);
    } catch (err) {
      console.error('Error fetching submission history:', err);
      setError('Failed to load submission history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculateStats = () => {
    const totalSubmissions = submissionHistory.length;
    const passedSubmissions = submissionHistory.filter(s => s.pass_fail).length;
    const failedSubmissions = totalSubmissions - passedSubmissions;

    const avgScores = submissionHistory.reduce(
      (acc, submission) => {
        acc.correctness += submission.correctness_score;
        acc.efficiency += submission.efficiency_score;
        acc.style += submission.style_score;
        return acc;
      },
      { correctness: 0, efficiency: 0, style: 0 }
    );

    return [
      { name: 'Pass/Fail', Passed: passedSubmissions, Failed: failedSubmissions },
      { 
        name: 'Average Scores', 
        Correctness: avgScores.correctness / totalSubmissions,
        Efficiency: avgScores.efficiency / totalSubmissions,
        Style: avgScores.style / totalSubmissions
      }
    ];
  };

  if (isLoading) {
    return <div className="text-center">Loading submission history...</div>;
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>{error}</p>
        <button
          onClick={loadSubmissionHistory}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="container mx-auto px-4">
      <h2 className="text-2xl font-bold mb-4">Submission Statistics for {username}</h2>
      
      {submissionHistory.length === 0 ? (
        <p>No submissions yet. Start practicing to see your statistics!</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Pass/Fail Rate</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[stats[0]]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Passed" fill="#4CAF50" />
                  <Bar dataKey="Failed" fill="#F44336" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Average Scores</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[stats[1]]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Correctness" fill="#2196F3" />
                  <Bar dataKey="Efficiency" fill="#FFC107" />
                  <Bar dataKey="Style" fill="#9C27B0" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-4">Submission History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Question</th>
                  <th className="px-4 py-2">Correctness</th>
                  <th className="px-4 py-2">Efficiency</th>
                  <th className="px-4 py-2">Style</th>
                  <th className="px-4 py-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {submissionHistory.map((submission, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-2">{formatDate(submission.timestamp)}</td>
                    <td className="px-4 py-2">{submission.category}</td>
                    <td className="px-4 py-2">{submission.question}</td>
                    <td className="px-4 py-2">{submission.correctness_score}/10</td>
                    <td className="px-4 py-2">{submission.efficiency_score}/10</td>
                    <td className="px-4 py-2">{submission.style_score}/10</td>
                    <td className={`px-4 py-2 font-bold ${submission.pass_fail ? 'text-green-500' : 'text-red-500'}`}>
                      {submission.pass_fail ? 'Pass' : 'Fail'}
                    </td>
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

export default SubmissionsTab;