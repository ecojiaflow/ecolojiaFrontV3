import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Search, X, ChevronDown, Filter, Grid, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SearchExperience from '../components/search/SearchExperience';



// Import des composants existants
import ProductHit from '../components/ProductHit';
import NoResultsFound from '../components/NoResultsFound';

// Import de la configuration Algolia
import searchClient, { ALGOLIA_INDEX_NAME } from '../lib/algolia';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // États de recherche
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [originalResults, setOriginalResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchStats, setSearchStats] = useState({ nbHits: 0, processingTimeMS: 0 });
  
  // États de pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hitsPerPage] = useState(12);
  
  // États d'affichage
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // États des filtres
  const [filters, setFilters] = useState({
    ecoScore: '',
    zone: '',
    confidence: ''
  });

  // Chargement initial des produits
  useEffect(() => {
    loadInitialProducts();
  }, []);

  const loadInitialProducts = async () => {
    try {
      setIsSearching(true);
      const index = searchClient.initIndex(ALGOLIA_INDEX_NAME);
      const results = await index.search('', {
        hitsPerPage,
        page: 0,
        attributesToRetrieve: [
          'objectID', 'title', 'description', 'slug', 'images',
          'eco_score', 'ai_confidence', 'confidence_color', 'confidence_pct',
          'tags', 'zones_dispo', 'resume_fr', 'verified_status'
        ]
      });
      
      setSearchResults(results.hits);
      setOriginalResults(results.hits);
      setTotalPages(results.nbPages);
      setSearchStats({ 
        nbHits: results.nbHits, 
        processingTimeMS: results.processingTimeMS 
      });
    } catch (error) {
      console.error('Erreur chargement initial:', error);
      setSearchResults([]);
      setOriginalResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Fonction de recherche optimisée avec debounce
  const performSearch = useCallback(async (searchQuery: string, page: number = 0) => {
    if (searchQuery.length === 0) {
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
        attributesToRetrieve: [
          'objectID', 'title', 'description', 'slug', 'images',
          'eco_score', 'ai_confidence', 'confidence_color', 'confidence_pct',
          'tags', 'zones_dispo', 'resume_fr', 'verified_status'
        ],
        attributesToHighlight: ['title', 'description'],
        highlightPreTag: '<mark class="bg-eco-leaf/20 text-eco-text">',
        highlightPostTag: '</mark>'
      });
      
      setSearchResults(results.hits);
      setOriginalResults(results.hits);
      setTotalPages(results.nbPages);
      setCurrentPage(page);
      setSearchStats({ 
        nbHits: results.nbHits, 
        processingTimeMS: results.processingTimeMS 
      });
      setHasSearched(true);
      
    } catch (error) {
      console.error('Erreur recherche:', error);
      setSearchResults([]);
      setOriginalResults([]);
      setSearchStats({ nbHits: 0, processingTimeMS: 0 });
    } finally {
      setIsSearching(false);
    }
  }, [hitsPerPage]);

  // Debounce pour la recherche automatique
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query, 0);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  // Navigation fluide vers les résultats
  const scrollToResults = () => {
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Gestion des événements
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClear = () => {
    setQuery('');
    setHasSearched(false);
    setCurrentPage(0);
    setFilters({ ecoScore: '', zone: '', confidence: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setHasSearched(true);
      setTimeout(scrollToResults, 100);
    }
  };

  // Pagination
  const handlePageChange = (newPage: number) => {
    performSearch(query, newPage);
    scrollToResults();
  };

  // Navigation vers page produit
  const handleProductClick = (hit: any) => {
    const productSlug = hit.slug || hit.objectID;
    navigate(`/product/${productSlug}`);
  };

  // Fonction pour enrichir la base de données
  const handleEnrichRequest = async (searchQuery: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery })
      });
      
      if (response.ok) {
        setTimeout(() => {
          performSearch(searchQuery, 0);
        }, 2000);
      }
    } catch (error) {
      console.error('Erreur enrichissement:', error);
    }
  };

  // Fonction pour appliquer les filtres
  const applyFilters = () => {
    let filteredResults = [...originalResults];
    
    if (filters.ecoScore) {
      filteredResults = filteredResults.filter(hit => 
        hit.eco_score && hit.eco_score >= parseFloat(filters.ecoScore)
      );
    }
    
    if (filters.zone) {
      filteredResults = filteredResults.filter(hit => 
        hit.zones_dispo && hit.zones_dispo.includes(filters.zone)
      );
    }
    
    if (filters.confidence) {
      filteredResults = filteredResults.filter(hit => 
        hit.ai_confidence && hit.ai_confidence >= parseFloat(filters.confidence)
      );
    }
    
    setSearchResults(filteredResults);
    setSearchStats({ ...searchStats, nbHits: filteredResults.length });
    setShowFilters(false);
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setFilters({ ecoScore: '', zone: '', confidence: '' });
    setSearchResults(originalResults);
    setSearchStats({ ...searchStats, nbHits: originalResults.length });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Section Hero */}
      <section className="bg-eco-gradient py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <Leaf className="h-16 w-16 text-eco-leaf animate-pulse" />
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-eco-text mb-6">
            <span dangerouslySetInnerHTML={{ 
              __html: t('homepage.hero.title', { 
                interpolation: { escapeValue: false } 
              }).replace('<highlight>', '<span class="text-eco-leaf">').replace('</highlight>', '</span>')
            }} />
          </h1>
          
          <p className="text-lg md:text-xl text-eco-text/80 max-w-3xl mx-auto mb-12">
            {t('homepage.hero.subtitle')}
          </p>

          {/* Barre de recherche optimisée */}
          <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder={t('common.searchPlaceholder')}
                className="w-full py-4 px-12 pr-16 border-2 border-eco-text/10 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-eco-leaf/30 focus:border-eco-leaf/50 transition-all text-eco-text placeholder-eco-text/50 bg-white/95 backdrop-blur"
                autoComplete="off"
              />
              
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-eco-text/50" />
              
              {isSearching && (
                <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-eco-leaf/30 border-t-eco-leaf rounded-full animate-spin"></div>
                </div>
              )}
              
              {query && !isSearching && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 hover:bg-eco-text/10 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-eco-text/50 hover:text-eco-text" />
                </button>
              )}
            </div>

            {/* Indicateurs de recherche */}
            {query && query.length >= 2 && (
              <div className="mt-4 flex justify-center">
                <div className="inline-flex items-center gap-2 text-sm text-eco-leaf bg-eco-leaf/10 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-eco-leaf rounded-full animate-pulse"></div>
                  {t('common.searchingAlgolia')}
                </div>
              </div>
            )}
            
            {!hasSearched && query.length === 0 && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={scrollToResults}
                  className="inline-flex items-center gap-2 text-eco-text/70 hover:text-eco-text transition-all group hover:scale-105"
                >
                  <span>{t('common.discoverProducts')}</span>
                  <ChevronDown className="h-4 w-4 group-hover:translate-y-1 transition-transform" />
                </button>
              </div>
            )}
          </form>

          {/* Stats de recherche */}
          {hasSearched && searchStats.nbHits > 0 && (
            <div className="text-eco-text/60 text-sm">
              {t('common.resultsFoundMs', { 
                count: searchStats.nbHits, 
                time: searchStats.processingTimeMS 
              })}
            </div>
          )}
        </div>
      </section>

      {/* Section Résultats */}
      <section id="results-section" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header des résultats */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-eco-text mb-2">
                {query ? t('common.searchResults', { query }) : t('common.ecoProducts')}
              </h2>
              <p className="text-eco-text/70">
                {searchResults.length === 1 ? 
                  t('common.productsFound_one', { count: searchResults.length }) :
                  t('common.productsFound_other', { count: searchResults.length })
                }
                {hasSearched ? ` ${t('common.correspondingSearch')}` : ` ${t('common.available')}`}
                {(filters.ecoScore || filters.zone || filters.confidence) && (
                  <span className="text-eco-leaf"> ({searchResults.length > 1 ? t('common.filtered_plural') : t('common.filtered')})</span>
                )}
              </p>
            </div>

            {/* Contrôles d'affichage */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                  (filters.ecoScore || filters.zone || filters.confidence) 
                    ? 'border-eco-leaf bg-eco-leaf/10 text-eco-leaf' 
                    : 'border-eco-leaf/20 hover:bg-eco-leaf/10'
                }`}
              >
                <Filter className="h-4 w-4" />
                {t('common.filters')}
                {(filters.ecoScore || filters.zone || filters.confidence) && (
                  <span className="bg-eco-leaf text-white text-xs px-1.5 py-0.5 rounded-full">
                    {[filters.ecoScore, filters.zone, filters.confidence].filter(Boolean).length}
                  </span>
                )}
              </button>
              
              <div className="flex items-center border border-eco-leaf/20 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-eco-leaf text-white' : 'hover:bg-eco-leaf/10'} transition-colors`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-eco-leaf text-white' : 'hover:bg-eco-leaf/10'} transition-colors`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Panneau de filtres */}
          {showFilters && (
            <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-eco-leaf/10 animate-fade-in">
              <h3 className="text-lg font-semibold text-eco-text mb-4">{t('common.filterResults')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Filtre par score écologique */}
                <div>
                  <label className="block text-sm font-medium text-eco-text mb-2">
                    {t('common.ecoScoreMin')}
                  </label>
                  <select 
                    value={filters.ecoScore}
                    onChange={(e) => setFilters({...filters, ecoScore: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-leaf/30"
                  >
                    <option value="">{t('common.allScores')}</option>
                    <option value="0.8">{t('common.excellent')}</option>
                    <option value="0.6">{t('common.veryGood')}</option>
                    <option value="0.4">{t('common.good')}</option>
                  </select>
                </div>

                {/* Filtre par zone */}
                <div>
                  <label className="block text-sm font-medium text-eco-text mb-2">
                    {t('common.availabilityZone')}
                  </label>
                  <select 
                    value={filters.zone}
                    onChange={(e) => setFilters({...filters, zone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-leaf/30"
                  >
                    <option value="">{t('common.allZones')}</option>
                    <option value="FR">{t('common.france')}</option>
                    <option value="EU">{t('common.europe')}</option>
                    <option value="US">{t('common.usa')}</option>
                  </select>
                </div>

                {/* Filtre par confiance IA */}
                <div>
                  <label className="block text-sm font-medium text-eco-text mb-2">
                    {t('common.aiConfidence')}
                  </label>
                  <select 
                    value={filters.confidence}
                    onChange={(e) => setFilters({...filters, confidence: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-leaf/30"
                  >
                    <option value="">{t('common.allLevels')}</option>
                    <option value="0.8">{t('common.certified')}</option>
                    <option value="0.6">{t('common.validated')}</option>
                    <option value="0.4">{t('common.analyzing')}</option>
                  </select>
                </div>
              </div>
              
              {/* Boutons d'action des filtres */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {t('common.hideFilters')}
                </button>
                <div className="space-x-3">
                  <button 
                    onClick={resetFilters}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t('common.reset')}
                  </button>
                  <button 
                    onClick={applyFilters}
                    className="px-4 py-2 bg-eco-leaf text-white rounded-lg hover:bg-eco-leaf/90 transition-colors"
                  >
                    {t('common.apply')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Contenu principal */}
          {isSearching && searchResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-eco-leaf/30 border-t-eco-leaf rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-eco-text/60">{t('common.searchInProgress')}</p>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              {/* Grille de produits */}
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }>
                {searchResults.map((hit, index) => (
                  <div 
                    key={hit.objectID || index}
                    className="animate-fade-in-up cursor-pointer"
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      animationFillMode: 'both'
                    }}
                    onClick={() => handleProductClick(hit)}
                  >
                    <ProductHit hit={hit} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && !filters.ecoScore && !filters.zone && !filters.confidence && (
                <div className="flex justify-center items-center mt-12 gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-4 py-2 border border-eco-leaf/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-eco-leaf/10 transition-colors"
                  >
                    {t('common.previous')}
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const pageNum = currentPage <= 2 ? i : currentPage - 2 + i;
                      if (pageNum >= totalPages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-eco-leaf text-white'
                              : 'border border-eco-leaf/20 hover:bg-eco-leaf/10'
                          }`}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="px-4 py-2 border border-eco-leaf/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-eco-leaf/10 transition-colors"
                  >
                    {t('common.next')}
                  </button>
                </div>
              )}
            </>
        ) : hasSearched ? (
            <NoResultsFound 
              query={query} 
              onEnrichRequest={handleEnrichRequest}
            />
          ) : null}

          {/* 🧪 TEST ALGOLIA INSTANTSEARCH - À RETIRER PLUS TARD */}
          <section id="instantsearch-test" className="py-16 bg-gray-50 border-t border-gray-200 mt-16">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-eco-text mb-6">
                🔍 Nouvelle recherche (Test Algolia InstantSearch)
              </h2>
              <div className="bg-white rounded-xl shadow p-6">
                <SearchExperience />
              </div>
            </div>
          </section>

        </div>
      </section>
    </div>
  );
};

export default HomePage;