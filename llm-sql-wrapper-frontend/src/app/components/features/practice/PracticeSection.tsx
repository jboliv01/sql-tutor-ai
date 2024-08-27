import React from 'react';
import { Play, Send, TextCursorInput, RefreshCw } from 'lucide-react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-textmate';
import Question from './Question';
import QueryResults from '../query/QueryResults';
import { PracticeSectionProps } from '../../../utils/types';

const PracticeSection: React.FC<PracticeSectionProps> = ({
  currentQuestion,
  sqlQuery,
  setSqlQuery,
  handleSqlSubmit,
  onSolutionSubmit,
  handleCategorySelect,
  isLoading,
  queryResults,
  sqlError,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  username,
  questionError,
  onRetryQuestion
}) => {
  return (
    <div className="space-y-6">
    
      {questionError ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{questionError}</span>
          <button
            onClick={onRetryQuestion}
            className="absolute top-0 right-0 px-4 py-3"
            title="Retry generating question"
          >
            <RefreshCw className="h-6 w-6 text-red-500" />
          </button>
        </div>
      ) : currentQuestion ? (
        <Question question={currentQuestion} />
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-indigo-500 italic">Loading practice question...</p>
        </div>
      )}

      <div className="bg-white rounded-lg p-6 space-y-4">
        <h3 className="text-2xl pb-2 flex items-center font-semibold text-indigo-800">
          <TextCursorInput className="mr-2 h-6 w-6" />
          Your Solution
        </h3>
        <AceEditor
          mode="sql"
          theme="textmate"
          name="practice_sql_editor"
          onChange={setSqlQuery}
          value={sqlQuery}
          setOptions={{
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true,
            showLineNumbers: true,
            tabSize: 2,
          }}
          style={{
            width: '100%',
            height: '200px',
            border: '1px solid #e2e8f0',
            borderRadius: '0.375rem',
          }}
          editorProps={{ $blockScrolling: true }}
        />
        <div className="flex justify-between items-center space-x-4">
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleSqlSubmit}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300 flex items-center justify-center disabled:opacity-50"
              disabled={isLoading}
            >
              <Play size={20} className="mr-2" />
              {isLoading ? 'Executing...' : 'Test SQL'}
            </button>
            <button
              type="button"
              onClick={onSolutionSubmit}
              className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 flex items-center justify-center disabled:opacity-50"
              disabled={isLoading || !currentQuestion}
            >
              <Send size={20} className="mr-2" />
              {isLoading ? 'Submitting...' : 'Submit Solution'}
            </button>
          </div>
        </div>
      </div>

      <QueryResults
        sqlError={sqlError}
        queryResults={queryResults}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        rowsPerPage={rowsPerPage}
      />
    </div>
  );
};

export default PracticeSection;