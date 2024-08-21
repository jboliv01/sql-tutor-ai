import React from 'react';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import { Database } from 'lucide-react'; // Add this import

const renderTree = (nodes) => (
  nodes.map((node) => (
    <TreeItem key={node.id} itemId={node.id} label={node.label}>
      {Array.isArray(node.children) ? renderTree(node.children) : null}
    </TreeItem>
  ))
);

export default function DatabaseSchema({ schemaData }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4" style={{ minHeight: '450px' }}>
      <h2 className="text-xl font-semibold mb-2 text-gray-700 flex items-center">
        <Database size={24} className="mr-2" />
        Database Schema
      </h2>
      <div className="overflow-auto" style={{ maxHeight: '380px' }}>
        <SimpleTreeView
          aria-label="database schema"
        >
          {renderTree(schemaData)}
        </SimpleTreeView>
      </div>
    </div>
  );
}