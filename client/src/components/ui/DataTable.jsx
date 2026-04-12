import React from 'react';

// Expected props:
// columns = [{ key: 'id', label: 'Order #' }, { key: 'plate', label: 'Plate No.' }]
// data = [{ id: '123', plate: 'ABC-123' }]
const DataTable = ({ columns, data, onRowClick }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 transition-colors duration-300 shadow-sm">
      <table className="w-full text-left text-sm text-slate-600 dark:text-gray-300">
        
        {/* Table Header */}
        <thead className="bg-slate-50 dark:bg-black/20 text-xs uppercase font-bold text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-white/10 transition-colors">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="px-6 py-4">{col.label}</th>
            ))}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-400 dark:text-gray-500 italic">
                No records found.
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5' : ''}`}
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    {/* If the data is a React Component (like a StatusBadge), it renders directly! */}
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>

      </table>
    </div>
  );
};

export default DataTable;