import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export default function SortableHeader({ label, sortKey, sortConfig, onSort }) {
  const isActive = sortConfig.key === sortKey;
  const direction = isActive ? sortConfig.direction : null;

  return (
    <th
      className="px-4 py-3 text-left whitespace-nowrap cursor-pointer select-none group"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-white transition-colors">
        {label}
        <span className="text-gray-600 group-hover:text-gray-400 transition-colors">
          {direction === 'asc' ? (
            <ChevronUp size={14} className="text-red-400" />
          ) : direction === 'desc' ? (
            <ChevronDown size={14} className="text-red-400" />
          ) : (
            <ChevronsUpDown size={14} />
          )}
        </span>
      </div>
    </th>
  );
}
