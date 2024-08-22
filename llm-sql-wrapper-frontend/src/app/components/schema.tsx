import React, { useState } from 'react';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import { Database, RefreshCw } from 'lucide-react';

const renderTree = (nodes) => (
  nodes.map((node) => (
    <TreeItem key={node.id} itemId={node.id} label={node.label}>
      {Array.isArray(node.children) ? renderTree(node.children) : null}
    </TreeItem>
  ))
);

export default function DatabaseSchema({ schemaData, onRefresh }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();  // Ensure onRefresh updates schemaData
    }
    setIsRefreshing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4" style={{ minHeight: '430px' }}>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-m font-semibold text-gray-700 flex items-center">
          <Database size={24} className="mr-2" />
          Database Schema
        </h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`flex items-center px-3 py-2 text-md font-2xl text-blue-500 bg-none rounded-md hover:bg-none hover:text-blue-300  ${
            isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <RefreshCw size={20} className={` ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="overflow-auto" style={{ maxHeight: '380px' }}>
        <SimpleTreeView aria-label="database schema">
          {renderTree(schemaData)}
        </SimpleTreeView>
      </div>
    </div>
  );
}
