import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { CategoryType, SubCategoryType, SUBCATEGORY_MAPPING } from '../types';

interface SearchBarProps {
  onSearch: (query: string, category: CategoryType, subCategory: SubCategoryType) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryType>('all');
  const [subCategory, setSubCategory] = useState<SubCategoryType>('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), category, subCategory);
    }
  };

  const hasSubCategories = (category: CategoryType): boolean => {
    return category === 'movies' || category === 'tv';
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value as CategoryType;
    setCategory(newCategory);
    setSubCategory('all'); // Réinitialiser la sous-catégorie lors du changement de catégorie
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher des torrents..."
            className="w-full px-4 py-3 pl-12 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
          />
          <Search 
            size={20} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
        <select
          value={category}
          onChange={handleCategoryChange}
          className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
        >
          <option value="all">Toutes catégories</option>
          <option value="movies">Films</option>
          <option value="tv">Séries TV</option>
          <option value="anime">Anime</option>
          <option value="music">Musique</option>
          <option value="software">Logiciels</option>
          <option value="books">Livres</option>
        </select>
        {hasSubCategories(category) && (
          <select
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value as SubCategoryType)}
            className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
          >
            <option value="all">Toutes qualités</option>
            <option value="sd">SD</option>
            <option value="hd">HD</option>
            <option value="uhd">UHD</option>
            {category === 'movies' && <option value="bluray">BluRay</option>}
          </select>
        )}
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
        >
          Rechercher
        </button>
      </div>
    </form>
  );
}