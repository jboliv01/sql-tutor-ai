import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Database } from 'lucide-react'
import { SchemaItem } from '../../../utils/types'

interface DatabaseSchemaProps {
  schemaData: SchemaItem[]
}

export default function DatabaseSchema({ schemaData }: DatabaseSchemaProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    )
  }

  const renderSchemaItem = (item: SchemaItem, isTopLevel: boolean) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = isTopLevel || expandedItems.includes(item.id || '')

    return (
      <div key={item.id} className={isTopLevel ? '' : 'ml-4'}>
        <div
          className={`flex items-center p-1 rounded ${
            !isTopLevel ? 'cursor-pointer hover:bg-gray-100' : ''
          }`}
          onClick={() => !isTopLevel && hasChildren && toggleExpand(item.id || '')}
          aria-expanded={isExpanded}
        >
          {hasChildren && (
            isExpanded ? (
              <ChevronDown size={16} className="mr-1" />
            ) : (
              <ChevronRight size={16} className="mr-1" />
            )
          )}
          <span>{item.label}</span>
        </div>
        {isExpanded && hasChildren && (
          <div className="ml-4">
            {item.children?.map((child) => renderSchemaItem(child, false))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2 flex items-center">
        <Database className="mr-2" size={20} />
        Database Schema
      </h3>
      <div className="overflow-hidden max-h-[calc(100vh-200px)]">
        {schemaData.map((item) => renderSchemaItem(item, true))}
      </div>
    </div>
  )
}