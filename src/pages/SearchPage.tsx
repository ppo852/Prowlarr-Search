import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { SearchBar } from '../components/SearchBar';
import { ResultCard } from '../components/ResultCard';
import { SortControls } from '../components/SortControls';
import type { SearchResult, SortOption, CategoryType } from '../types';
import { prowlarrAPI } from '../lib/prowlarr';
import { tmdbAPI } from '../lib/tmdb';
import { globalSettings } from '../lib/settings';

interface EnhancedSearchResult extends SearchResult {
  tmdbPoster?: string | null;
}

export function SearchPage() {
  const [results, setResults] = useState<EnhancedSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('seeds');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [lastSearchCategory, setLastSearchCategory] = useState<CategoryType | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        await globalSettings.load();
        setSettings(globalSettings);
      } catch (err) {
        console.error('Failed to load global settings:', err);
        setError('Erreur lors du chargement des paramètres. Contactez votre administrateur.');
      }
    };
    loadSettings();
  }, []);

  const fetchTmdbInfo = async (result: SearchResult): Promise<EnhancedSearchResult> => {
    try {
      const tmdbToken = globalSettings.getTmdbAccessToken();
      if (!tmdbToken) return result;

      const tmdbResult = await tmdbAPI.searchTitle(result.name);
      return {
        ...result,
        tmdbPoster: tmdbResult?.posterUrl || null
      };
    } catch (error) {
      console.error('Error fetching TMDB info:', error);
      return result;
    }
  };

  const handleSearch = async (query: string, category: CategoryType) => {
    setIsLoading(true);
    setError(null);
    setLastSearchCategory(category);

    try {
      const searchResults = await prowlarrAPI.search(query, category);
      
      // Fetch TMDB info for all results in parallel
      const enhancedResults = await Promise.all(
        searchResults.map(result => fetchTmdbInfo(result))
      );
      
      setResults(enhancedResults);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erreur lors de la recherche. Vérifiez les paramètres Prowlarr avec votre administrateur.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (result: SearchResult) => {
    if (!user?.qbit_url) {
      setError('Veuillez configurer vos paramètres qBittorrent dans les réglages');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('urls', result.link);

      if (user.qbit_username && user.qbit_password) {
        formData.append('username', user.qbit_username);
        formData.append('password', user.qbit_password);
      }

      await fetch(`${user.qbit_url}/api/v2/torrents/add`, {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
      });

      alert('Demande de téléchargement envoyée à qBittorrent');
    } catch (err) {
      setError('Erreur lors du téléchargement. Vérifiez vos paramètres qBittorrent.');
    }
  };

  const sortResults = (results: EnhancedSearchResult[]): EnhancedSearchResult[] => {
    return [...results].sort((a, b) => {
      let comparison = 0;

      switch (sortOption) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'seeds':
          comparison = a.seeds - b.seeds;
          break;
        case 'leech':
          comparison = a.leech - b.leech;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const getCategoryName = (category: CategoryType): string => {
    switch (category) {
      case 'movies': return 'films';
      case 'tv': return 'séries TV';
      case 'anime': return 'animes';
      case 'music': return 'musique';
      case 'software': return 'logiciels';
      case 'books': return 'livres';
      default: return 'toutes catégories';
    }
  };

  const getNoResultsMessage = () => {
    if (!lastSearchCategory || lastSearchCategory === 'all') {
      return "Utilisez la barre de recherche ci-dessus pour trouver des torrents";
    }
    return `Aucun résultat trouvé dans la catégorie ${getCategoryName(lastSearchCategory)}`;
  };

  const sortedResults = sortResults(results);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <SearchBar onSearch={handleSearch} />
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <SortControls
          sortOption={sortOption}
          sortDirection={sortDirection}
          onSortChange={setSortOption}
          onDirectionChange={setSortDirection}
        />
      )}

      <div className="mt-8 space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-600 border-t-blue-500"></div>
            <p className="mt-2 text-gray-400">Recherche en cours...</p>
          </div>
        ) : sortedResults.length > 0 ? (
          sortedResults.map((result, index) => (
            <ResultCard
              key={`${result.name}-${index}`}
              result={result}
              onDownload={() => handleDownload(result)}
              poster={result.tmdbPoster}
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-400">
            {getNoResultsMessage()}
          </div>
        )}
      </div>
    </div>
  );
}