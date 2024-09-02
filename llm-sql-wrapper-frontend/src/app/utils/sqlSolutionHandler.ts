// src/utils/sqlSolutionHandler.ts
import { ChatMessage, SingleResult, MultiResult, SqlError } from './types';

export async function handleSolutionSubmit(
  sqlQuery: string,
  currentQuestionId: string,
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setSqlError: React.Dispatch<React.SetStateAction<SqlError | null>>,
  setQueryResults: React.Dispatch<React.SetStateAction<SingleResult | MultiResult | null>>,
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
): Promise<string> {
  console.log("handleSolutionSubmit called with questionId:", currentQuestionId);
  try {
    // Execute the SQL query
    const executeRes = await fetch('/api/execute-sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql: sqlQuery })
    });
    const executeData = await executeRes.json();
    if (!executeRes.ok) {
      throw new Error(JSON.stringify({
        message: executeData.error || 'Failed to execute SQL query',
        query: sqlQuery,
        details: executeData.details || 'No additional details provided'
      }));
    }

    // Process the results
    let top10Results: any[] = [];
    if (executeData.result.type === 'multi') {
      top10Results = executeData.result.results.flatMap((result: SingleResult) => 
        result.type === 'table' ? result.rows?.slice(0, 10) || [] : []
      );
    } else if (executeData.result.type === 'table') {
      top10Results = executeData.result.rows?.slice(0, 10) || [];
    }

    console.log("Submitting solution with questionId:", currentQuestionId);
    // Submit the solution for validation
    const submitRes = await fetch('/api/submit-solution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sql: sqlQuery,
        results: top10Results,
        questionId: currentQuestionId
      })
    });
    const submitData = await submitRes.json();
    if (!submitRes.ok) {
      throw new Error(submitData.error || 'Failed to submit solution');
    }

    setQueryResults(executeData.result);
    setCurrentPage(1);
    setChatHistory(prev => [...prev,
      { role: 'user', content: `Submitted solution: ${sqlQuery}` },
      { role: 'assistant', content: submitData.feedback }
    ]);
    console.log("Returning feedback:", submitData.feedback);
    return submitData.feedback;
  } catch (err) {
    console.error('Error:', err);
    setSqlError(err as SqlError);
    setChatHistory(prev => [...prev, { role: 'assistant', content: 'An error occurred while submitting your solution.' }]);
    throw err;
  }
}