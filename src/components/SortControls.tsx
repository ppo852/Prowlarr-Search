import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import type { SortOption } from '../types';

interface SortControlsProps {
  sortOption: SortOption;
  sortDirection: 'asc' | 'desc';
  onSortChange: (option: SortOption) => void;
  onDirectionChange: (direction: 'asc' | 'desc') => void;
}

export function SortControls({
  sortOption,
  sortDirection,
  onSortChange,
  onDirectionChange,
}: SortControlsProps) {
  return (
    <div className="mt-6 flex items-center gap-4">
      <span className="text-sm text-gray-400">Trier par:</span>
      <select
        value={sortOption}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="name">Nom</option>
        <option value="size">Taille</option>
        <option value="seeds">Sources</option>
        <option value="leech">Pairs</option>
      </select>
      <button
        onClick={() => onDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')}
        className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
        title={sortDirection === 'asc' ? 'Tri croissant' : 'Tri décroissant'}
      >
        <ArrowUpDown size={20} className={sortDirection === 'desc' ? 'rotate-180' : ''} />
      </button>
    </div>
  );
}