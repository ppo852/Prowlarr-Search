import React, { useState } from 'react';
import { Download, Info, Film } from 'lucide-react';
import type { SearchResult } from '../types';
import { tmdbAPI } from '../lib/tmdb';

interface ResultCardProps {
  result: SearchResult;
  onDownload: () => void;
  poster: string | null | undefined;
}

export function ResultCard({ result, onDownload, poster }: ResultCardProps) {
  const [tmdbError, setTmdbError] = useState<string | null>(null);
  const [isSearchingTmdb, setIsSearchingTmdb] = useState(false);

  const formatSize = (bytes: number): string => {
    const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const handleTmdbSearch = async () => {
    setIsSearchingTmdb(true);
    setTmdbError(null);

    try {
      const tmdbResult = await tmdbAPI.searchTitle(result.name);
      if (tmdbResult) {
        window.open(tmdbAPI.getTmdbUrl(tmdbResult.id, tmdbResult.type), '_blank');
      } else {
        setTmdbError("Aucun résultat trouvé sur TMDB");
      }
    } catch (error) {
      setTmdbError(error instanceof Error ? error.message : "Erreur lors de la recherche TMDB");
    } finally {
      setIsSearchingTmdb(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors">
      <div className="flex justify-between items-start gap-4">
        <div className="flex gap-4 flex-1">
          {poster && (
            <div className="flex-shrink-0">
              <img
                src={poster}
                alt="Poster"
                className="w-24 h-36 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-100 mb-3 line-clamp-2">
              {result.name}
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="px-3 py-1 bg-gray-700 rounded-full text-gray-200">
                {formatSize(result.size)}
              </span>
              <span className="px-3 py-1 bg-green-900/50 text-green-400 rounded-full">
                {result.seeds} sources
              </span>
              <span className="px-3 py-1 bg-red-900/50 text-red-400 rounded-full">
                {result.leech} pairs
              </span>
              <span className="px-3 py-1 bg-blue-900/50 text-blue-400 rounded-full">
                {result.category}
              </span>
            </div>
            {tmdbError && (
              <div className="mt-2 text-sm text-red-400">
                {tmdbError}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleTmdbSearch}
            disabled={isSearchingTmdb}
            className={`p-2 text-gray-400 hover:text-yellow-400 transition-colors rounded-full hover:bg-yellow-500/10 ${
              isSearchingTmdb ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Rechercher sur TMDB"
          >
            <Film className={`h-5 w-5 ${isSearchingTmdb ? 'animate-spin' : ''}`} />
          </button>
          <a
            href={result.desc_link}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-full hover:bg-blue-500/10"
            title="Plus d'informations"
          >
            <Info className="h-5 w-5" />
          </a>
          <button
            onClick={onDownload}
            className="p-2 text-gray-400 hover:text-green-400 transition-colors rounded-full hover:bg-green-500/10"
            title="Télécharger"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}