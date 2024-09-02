import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-textmate';
import DatabaseSchema from '../schema/DatabaseSchema';
import QueryResults from './QueryResults';
import { SchemaItem, SqlError, SingleResult, MultiResult } from '../../../utils/types';

interface QueryTabProps {
  schemaData: SchemaItem[];
  username: string;
  sharedQuery: string;
  setSharedQuery: React.Dispatch<React.SetStateAction<string>>;
}

const QueryTab: React.FC<QueryTabProps> = ({ schemaData, username, sharedQuery, setSharedQuery }) => {
  const [queryResult, setQueryResult] = useState<SingleResult | MultiResult | null>(null);
  const [sqlError, setSqlError] = useState<SqlError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    // Set the default query when the component mounts or username changes
    setSharedQuery(`SELECT * FROM user_${username}.sample_users LIMIT 5;`);
  }, [username, setSharedQuery]);

  const handleSqlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSqlError(null);
    setQueryResult(null);

    try {
      const res = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sharedQuery }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(JSON.stringify({
          message: data.message || 'Failed to execute SQL query',
          query: data.query || sharedQuery,
          error: data.error || 'Execution Error',
        }));
      }

      setQueryResult(data.result);
    } catch (err) {
      console.error('Error:', err);
      setSqlError({
        message: err.message || 'Unknown Error',
        query: sharedQuery,
        details: 'An unexpected error occurred.',
        error: err.toString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <div className="md:w-1/4 ">
          <div className="bg-white h-full overflow-hidden rounded-lg shadow-md shadow-gray-200">
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
                onChange={setSharedQuery}
                fontSize={16}
                width="100%"
                height={editorHeight}
                value={sharedQuery}
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
      <div className="bg-white rounded-lg p-6 shadow-gray-200 mt-4">
        <QueryResults
          sqlError={sqlError}
          queryResult={queryResult}
          rowsPerPage={rowsPerPage}
        />
      </div>
    </div>
  );
};

export default QueryTab;