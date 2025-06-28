import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Search, X, ChevronDown, Filter, Grid, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import ProductHit from '../components/ProductHit';
import NoResultsFound from '../components/NoResultsFound';
import searchClient, { ALGOLIA_INDEX_NAME } from '../lib/algolia';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  /* ---------- ÉTATS ---------- */
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [originalResults, setOriginalResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchStats, setSearchStats] = useState({ nbHits: 0, processingTimeMS: 0 });

  /* pagination */
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hitsPerPage] = useState(12);

  /* affichage & filtres */
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ ecoScore: '', zone: '', confidence: '' });

  /* ---------- CHARGEMENT INITIAL ---------- */
  useEffect(() => { loadInitialProducts(); }, []);

  const loadInitialProducts = async () => {
    try {
      setIsSearching(true);
      const index = searchClient.initIndex(ALGOLIA_INDEX_NAME);
      const results = await index.search('', { hitsPerPage, page: 0 });
      setSearchResults(results.hits);
      setOriginalResults(results.hits);
      setTotalPages(results.nbPages);
      setSearchStats({ nbHits: results.nbHits, processingTimeMS: results.processingTimeMS });
    } catch (err) {
      console.error('Erreur chargement initial:', err);
    } finally {
      setIsSearching(false);
    }
  };

  /* ---------- RECHERCHE ---------- */
  const performSearch = useCallback(
    async (searchQuery: string, page = 0) => {
      if (!searchQuery.length) {
        loadInitialProducts();
        setHasSearched(false);
        setCurrentPage(0);
        return;
      }
      if (searchQuery.length < 2) return;

      try {
        setIsSearching(true);
        const index = searchClient.initIndex(ALGOLIA_INDEX_NAME);
        const results = await index.search(searchQuery, {
          hitsPerPage,
          page,
          highlightPreTag: '<mark class="bg-eco-leaf/20 text-eco-text">',
          highlightPostTag: '</mark>',
        });
        setSearchResults(results.hits);
        setOriginalResults(results.hits);
        setTotalPages(results.nbPages);
        setCurrentPage(page);
        setSearchStats({ nbHits: results.nbHits, processingTimeMS: results.processingTimeMS });
        setHasSearched(true);
      } catch (err) {
        console.error('Erreur recherche:', err);
      } finally {
        setIsSearching(false);
      }
    },
    [hitsPerPage],
  );

  /* debounce */
  useEffect(() => {
    const id = setTimeout(() => performSearch(query, 0), 300);
    return () => clearTimeout(id);
  }, [query, performSearch]);

  /* ---------- HANDLERS ---------- */
  const scrollToResults = () => {
    document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value);
  const handleClear = () => {
    setQuery(''); setHasSearched(false); setCurrentPage(0);
    setFilters({ ecoScore: '', zone: '', confidence: '' });
  };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (query.trim()) scrollToResults(); };
  const handlePageChange = (p: number) => { performSearch(query, p); scrollToResults(); };
  const handleProductClick = (hit: any) => navigate(`/product/${hit.slug || hit.objectID}`);

  /* filtres locaux */
  const applyFilters = () => {
    let filtered = [...originalResults];
    if (filters.ecoScore)  filtered = filtered.filter(h => h.eco_score >= parseFloat(filters.ecoScore));
    if (filters.zone)      filtered = filtered.filter(h => h.zones_dispo?.includes(filters.zone));
    if (filters.confidence)filtered = filtered.filter(h => h.ai_confidence >= parseFloat(filters.confidence));
    setSearchResults(filtered);
    setSearchStats({ ...searchStats, nbHits: filtered.length });
    setShowFilters(false);
  };
  const resetFilters = () => {
    setFilters({ ecoScore: '', zone: '', confidence: '' });
    setSearchResults(originalResults);
    setSearchStats({ ...searchStats, nbHits: originalResults.length });
  };

  /* ---------- RENDER ---------- */
  return (
    <div className="min-h-screen flex flex-col">
      {/* HERO ------------------------------------------------------- */}
      <section className="bg-eco-gradient py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8"><Leaf className="h-16 w-16 text-eco-leaf animate-pulse" /></div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-eco-text mb-6">
            <span
              dangerouslySetInnerHTML={{
                __html: t('homepage.hero.title', { interpolation: { escapeValue: false } })
                  .replace('<highlight>', '<span class="text-eco-leaf">')
                  .replace('</highlight>', '</span>'),
              }}
            />
          </h1>

          <p className="text-lg md:text-xl text-eco-text/80 max-w-3xl mx-auto mb-12">
            {t('homepage.hero.subtitle')}
          </p>

          {/* UNIQUE barre de recherche -------------------------------- */}
          <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto mb-8">
            <div className="relative">
              <input
                value={query}
                onChange={handleInputChange}
                placeholder={t('common.searchPlaceholder')}
                className="w-full py-4 px-12 pr-16 border-2 border-eco-text/10 rounded-full shadow-lg focus:ring-2 focus:ring-eco-leaf/30 focus:border-eco-leaf/50 text-eco-text placeholder-eco-text/50 bg-white/95"
                autoComplete="off"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-eco-text/50" />
              {isSearching && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-eco-leaf/30 border-t-eco-leaf rounded-full animate-spin" />
                </div>
              )}
              {query && !isSearching && (
                <button type="button" onClick={handleClear}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-eco-text/10 rounded-full">
                  <X className="h-4 w-4 text-eco-text/50 hover:text-eco-text" />
                </button>
              )}
            </div>
            {query && query.length >= 2 && (
              <div className="mt-4 flex justify-center text-sm text-eco-leaf bg-eco-leaf/10 px-3 py-1 rounded-full gap-2">
                <div className="w-2 h-2 bg-eco-leaf rounded-full animate-pulse" />
                {t('common.searchingAlgolia')}
              </div>
            )}
            {!hasSearched && !query && (
              <div className="mt-6">
                <button type="button" onClick={scrollToResults}
                  className="inline-flex items-center gap-2 text-eco-text/70 hover:text-eco-text group">
                  {t('common.discoverProducts')}
                  <ChevronDown className="h-4 w-4 group-hover:translate-y-1 transition-transform" />
                </button>
              </div>
            )}
          </form>

          {hasSearched && searchStats.nbHits > 0 && (
            <div className="text-eco-text/60 text-sm">
              {t('common.resultsFoundMs', { count: searchStats.nbHits, time: searchStats.processingTimeMS })}
            </div>
          )}
        </div>
      </section>

      {/* RÉSULTATS -------------------------------------------------- */}
      <section id="results-section" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ... reste du composant résultats / filtres / pagination inchangé ... */}
          {/* utilise ProductHit pour afficher chaque hit */}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
