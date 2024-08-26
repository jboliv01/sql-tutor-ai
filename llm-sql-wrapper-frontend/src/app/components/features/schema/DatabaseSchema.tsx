import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Database } from 'lucide-react';
import { SchemaItem } from '../../../utils/types';

interface DatabaseSchemaProps {
  schemaData: SchemaItem[];
}

const DatabaseSchema: React.FC<DatabaseSchemaProps> = ({ schemaData }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderSchemaItem = (item: SchemaItem) => {
    const isExpanded = expandedItems.includes(item.id || '');
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="ml-4">
        <div
          className="flex items-center cursor-pointer hover:bg-gray-100 p-1 rounded"
          onClick={() => hasChildren && toggleExpand(item.id || '')}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={16} className="mr-1" />
            ) : (
              <ChevronRight size={16} className="mr-1" />
            )
          ) : (
            <span className="w-4 mr-1" />
          )}
          <span>{item.label}</span>
        </div>
        {isExpanded && hasChildren && (
          <div className="ml-4">
            {item.children?.map((child) => renderSchemaItem(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2 flex items-center">
        <Database className="mr-2" size={20} />
        Database Schema
      </h3>
      <div className="overflow-auto h-full">
        {schemaData.map((item) => renderSchemaItem(item))}
      </div>
    </div>
  );
};

export default DatabaseSchema;