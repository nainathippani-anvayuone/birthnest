import type { ReactNode } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

export interface Column<T> {
  header: string;
  accessor: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyField: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  rows,
  keyField,
  loading,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  onRowClick,
}: DataTableProps<T>) {
  if (loading) return <Spinner />;
  if (rows.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="overflow-x-auto rounded-xl border border-brand-100">
      <table className="min-w-full divide-y divide-brand-100 text-sm">
        <thead className="bg-brand-50/70">
          <tr>
            {columns.map((col) => (
              <th
                key={col.header}
                className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-500"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-50 bg-white">
          {rows.map((row) => (
            <tr
              key={keyField(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'cursor-pointer hover:bg-brand-50/60' : ''}
            >
              {columns.map((col) => (
                <td key={col.header} className={`px-4 py-3 align-middle text-brand-800 ${col.className ?? ''}`}>
                  {col.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
