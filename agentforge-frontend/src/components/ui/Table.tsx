// src/components/ui/Table.tsx

import React from 'react';
import { cn } from '../../lib/utils';

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[] | null | undefined; // allow undefined/null
  emptyMessage?: string;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  emptyMessage = 'No data available',
  className,
}: TableProps<T>) {
  // Guard against non-array data
  const rows = Array.isArray(data) ? data : [];

  if (rows.length === 0) {
    return <div className="text-center text-base-500 py-4">{emptyMessage}</div>;
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full">
        <thead className="bg-base-800/50">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-4 py-3 text-left text-xs font-semibold text-base-400 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-base-800">
          {rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-base-800/30 transition-colors">
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-3 text-sm text-base-200">
                  {col.render
                    ? col.render(row[col.key], row)
                    : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}