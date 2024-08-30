import React, { useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Table, MessageSquare } from 'lucide-react';

type SingleResult = {
  type: 'table' | 'message';
  content?: string;
  columns?: string[];
  rows?: any[];
};

type MultiResult = {
  type: 'multi';
  results: SingleResult[];
};

type SqlError = {
  message: string;
  query: string;
  details: string;
  error: string;
};

type QueryResultsProps = {
  sqlError: SqlError | null;
  queryResult: SingleResult | MultiResult | null;
  rowsPerPage: number;
};

const QueryResults: React.FC<QueryResultsProps> = ({
  sqlError,
  queryResult,
  rowsPerPage
}) => {
  const [currentPages, setCurrentPages] = useState<{[key: number]: number}>({});

  const truncateText = (text: string, maxLength: number) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  const renderTableResult = (result: SingleResult, index: number) => {
    if (!result.columns || !result.rows) return null;

    const currentPage = currentPages[index] || 1;
    const totalPages = Math.ceil(result.rows.length / rowsPerPage);
    const paginatedRows = result.rows.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );

    const setCurrentPage = (page: number) => {
      setCurrentPages(prev => ({ ...prev, [index]: page }));
    };

    return (
      <div key={index} className="mb-8">
        <h4 className="text-xl font-semibold mb-2 text-indigo-700">Result Set {index + 1}</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                {result.columns.map((column, colIndex) => (
                  <th key={colIndex} className="py-2 px-4 text-left text-gray-600">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  {result.columns.map((column, colIndex) => (
                    <td key={colIndex} className="py-2 px-4 border-t text-gray-800 text-ellipsis">
                      <div className="group relative">
                        <span className="truncate">
                          {typeof row[column] === 'object' ? JSON.stringify(row[column]) : truncateText(String(row[column]), 50)}
                        </span>
                        <span className="invisible group-hover:visible absolute z-10 bg-gray-800 text-white p-2 rounded text-sm -mt-1 ml-1">
                          {typeof row[column] === 'object' ? JSON.stringify(row[column]) : String(row[column])}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-l"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-gray-700">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-r"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderMessageResult = (result: SingleResult, index: number) => (
    <div key={index} className="mb-8 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4">
      <h4 className="text-xl font-semibold mb-2 flex items-center">
        <MessageSquare className="mr-2" size={20} />
        Message
      </h4>
      <p>{result.content}</p>
    </div>
  );

  const renderResults = () => {
    if (!queryResult) return null;

    if (queryResult.type === 'multi') {
      return queryResult.results.map((result, index) => 
        result.type === 'table' ? renderTableResult(result, index) : renderMessageResult(result, index)
      );
    } else {
      return queryResult.type === 'table' ? renderTableResult(queryResult, 0) : renderMessageResult(queryResult, 0);
    }
  };

  const renderError = () => {
    if (!sqlError) return null;
  
    let parsedError;
    try {
      parsedError = JSON.parse(sqlError.message);
    } catch (e) {
      parsedError = { message: sqlError.message, query: sqlError.query, error: sqlError.error };
    }
  
    const errorMessage = parsedError.message.split('\n');
    const mainError = errorMessage[0];
    const errorDetail = errorMessage.find(line => line.startsWith('DETAIL:'));
  
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
        <div className="flex items-center mb-2">
          <AlertCircle className="mr-2" size={20} />
          <strong className="font-bold text-lg">Error: {parsedError.error}</strong>
        </div>
        <p className="mb-2">{mainError}</p>
        {errorDetail && (
          <p className="mb-2">
            <strong>Detail: </strong>
            {errorDetail.replace('DETAIL: ', '')}
          </p>
        )}
        <div className="mt-4">
          <strong>Query:</strong>
          <pre className="mt-1 bg-red-50 p-2 rounded text-sm overflow-x-auto whitespace-pre-wrap">
            {parsedError.query}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-2xl pb-2 font-semibold mb-4 text-indigo-800 flex items-center">
        <Table className="mr-2 h-6 w-6" />
        Query Results
      </h3>
      {sqlError ? renderError() : (
        queryResult ? renderResults() : (
          <p className="text-gray-600">No results to display. Execute a query to see results here.</p>
        )
      )}
    </div>
  );
};

export default QueryResults;