import React from 'react';
import { cn } from '../../lib/utils';

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[] | null | undefined;
  emptyMessage?: string;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
}

export function Table<T>({
  columns,
  data,
  emptyMessage = 'No data available',
  className,
  striped = false,
  hoverable = true,
}: TableProps<T>) {
  const rows = Array.isArray(data) ? data : [];

  if (rows.length === 0) {
    return (
      <div className={cn('empty-state', className)}>
        <div className="empty-state-icon">
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="empty-state-title">No data</p>
        <p className="empty-state-description">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('table-container overflow-x-auto', className)}>
      <table className="w-full">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  'table-header',
                  col.className
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-canvas-border/50">
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className={cn(
                hoverable && 'table-row',
                striped && idx % 2 === 0 && 'bg-canvas-surface/30',
              )}
            >
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  className={cn('table-cell', col.className)}
                >
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