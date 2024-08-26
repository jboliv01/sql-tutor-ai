import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-textmate';
import DatabaseSchema from '../schema/DatabaseSchema';
import QueryResults from '../query/QueryResults';
import { SchemaItem, QueryResult, SqlError } from '../../../utils/types';

interface QueryTabProps {
  schemaData: SchemaItem[];
  username: string;
  defaultQuery: string;
}

const QueryTab: React.FC<QueryTabProps> = ({ schemaData, username, defaultQuery }) => {
  const [sqlQuery, setSqlQuery] = useState(defaultQuery);
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [sqlError, setSqlError] = useState<SqlError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editorHeight, setEditorHeight] = useState('200px');
  const rowsPerPage = 5;

  useEffect(() => {
    const updateHeight = () => {
      const height = Math.max(200, window.innerHeight * 0.3);
      setEditorHeight(`${height}px`);
    };

    window.addEventListener('resize', updateHeight);
    updateHeight();

    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleSqlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSqlError(null);
    setQueryResults([]);

    try {
      const res = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlQuery }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(JSON.stringify({
          message: data.message || 'Failed to execute SQL query',
          query: data.query || sqlQuery,
          error: data.error || 'Execution Error',
        }));
      }

      setQueryResults(data.result);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error:', err);
      setSqlError({
        message: err.message || 'Unknown Error',
        query: sqlQuery,
        details: 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const paginatedResults = queryResults.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div>
    <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
      <div className="md:w-1/4">
        <div className="bg-white h-full rounded-lg shadow-md shadow-gray-200">
          <DatabaseSchema schemaData={schemaData} />
        </div>
      </div>
      <div className="md:w-3/4 space-y-4">
        <div className="bg-white rounded-lg p-6 shadow-md shadow-gray-200">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-800">SQL Query Editor</h2>
          <form onSubmit={handleSqlSubmit} className="space-y-4">
            <AceEditor
              mode="sql"
              theme="textmate"
              name="sql_editor"
              onChange={(newValue) => setSqlQuery(newValue)}
              fontSize={16}
              width="100%"
              height={editorHeight}
              value={sqlQuery}
              setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
                showLineNumbers: true,
                tabSize: 2,
              }}
            />
            <button
              type="submit"
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300 flex items-center justify-center disabled:opacity-50"
              disabled={isLoading}
            >
              <Play size={20} className="mr-2" />
              {isLoading ? 'Executing...' : 'Execute SQL'}
            </button>
          </form>
        </div>
      </div>


    </div>
    <div className="bg-white rounded-lg p-6 shadow-gray-200">
          <QueryResults
            sqlError={sqlError}
            queryResults={paginatedResults}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            rowsPerPage={rowsPerPage}
          />
      </div>
    </div>
    
  );
};

export default QueryTab;