import React from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Table, BookOpen } from 'lucide-react';

type QueryResultsProps = {
  sqlError: { message: string; query: string; details: string } | null;
  queryResults: any[] | null;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  rowsPerPage: number;
};

const QueryResults: React.FC<QueryResultsProps> = ({
  sqlError,
  queryResults,
  currentPage,
  setCurrentPage,
  rowsPerPage
}) => {
  const totalPages = queryResults ? Math.ceil(queryResults.length / rowsPerPage) : 0;
  const paginatedResults = queryResults ? queryResults.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  ) : [];

  const truncateText = (text: string, maxLength: number) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-2xl pb-2 font-semibold mb-4 text-indigo-800 flex items-center">
      <Table className="mr-2 h-6 w-6" />
        Query Results
        </h3>
      {sqlError ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
          <strong className="font-bold">Error: {sqlError.details}</strong>
          <span className="block sm:inline"> {sqlError.message}</span>
          <AlertCircle className="inline-block ml-2" size={20} />
          <div className="mt-2">
            <strong>Query:</strong>
            <pre className="mt-1 bg-red-50 p-2 rounded">{sqlError.query}</pre>
          </div>
        </div>
      ) : queryResults && queryResults.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  {Object.keys(queryResults[0]).map((key) => (
                    <th key={key} className="py-2 px-4 text-left text-gray-600">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedResults.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    {Object.values(row).map((value, valueIndex) => (
                      <td key={valueIndex} className="py-2 px-4 border-t text-gray-800 text-ellipsis">
                        <div className="group relative">
                          <span className="truncate">
                            {typeof value === 'object' ? JSON.stringify(value) : truncateText(String(value), 50)}
                          </span>
                          <span className="invisible group-hover:visible absolute z-10 bg-gray-800 text-white p-2 rounded text-sm -mt-1 ml-1">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-l"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-gray-700">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-r"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </>
      ) : (
        <p className="text-gray-600">No results to display. Execute a query to see results here.</p>
      )}
    </div>
  );
};

export default QueryResults;