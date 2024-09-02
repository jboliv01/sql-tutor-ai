// types.ts

// Type representing a single chat message
export type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
  };
  
  // Type representing an error that occurs during SQL execution
  export type SqlError = {
    message: string;
    query: string;
    details: string;
  };
  
  // Type representing a single item in the query history
  export type QueryHistoryItem = {
    query_definition: string;
    timestamp: string;
    results: string;
  };
  
  export interface QueryTabProps {
    schemaData: SchemaItem[];
    username: string;
    defaultQuery: string;
  }
  
  // Type representing the results of a SQL query
  export type QueryResult = Record<string, any>;
  
  export interface SchemaItem {
    id?: string;
    label: string;
    children?: SchemaItem[];
  }
  
  export interface DatabaseSchemaProps {
    schemaData: SchemaItem[];
  }
  
  // Update PracticeTabProps if it exists, or add it if it doesn't
  export interface PracticeTabProps {
    schemaData: SchemaItem[];
    submissionHistory: SubmissionHistoryItem[];
    fetchSubmissionHistory: () => Promise<void>;
    username: string;
    defaultQuery: string;
  }
  
  // Type representing a single submission history item
  export interface SubmissionHistoryItem {
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
  
  // Type representing the current question in the practice section
  export interface CurrentQuestion {
    id: string;
    category: string;
    question: string;
    tables: string;
    hint: string;
  }
  
  // Type for the props of PracticeSection component
  export interface PracticeSectionProps {
    currentQuestion: CurrentQuestion | null;
    sqlQuery: string;
    setSqlQuery: React.Dispatch<React.SetStateAction<string>>;
    handleSqlSubmit: (e: React.FormEvent) => Promise<void>;
    onSolutionSubmit: () => Promise<void>;
    handleCategorySelect: (category: string) => Promise<void>;
    isLoading: boolean;
    queryResults: QueryResult[];
    sqlError: SqlError | null;
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    rowsPerPage: number;
    username: string;
    questionError: string | null;
    onRetryQuestion: () => void;
  }
  
  
  // Type for the props of FeedbackDisplay component
  export interface FeedbackDisplayProps {
    feedback: string;
    userSolution: string;
    correctSolution: string;
    onTryAgain: () => void;
    onNextChallenge: () => Promise<void>;
  }
