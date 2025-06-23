import React from 'react';
import {
  InstantSearch,
  SearchBox,
  Hits,
  Pagination,
  Stats,
  RefinementList,
  Configure,
  connectStateResults,
} from 'react-instantsearch-dom';

import ProductHit from '../ProductHit';
import NoResultsFound from '../NoResultsFound';
import searchClient, { ALGOLIA_INDEX_NAME } from '../../lib/algolia';

const ResultsWrapper = connectStateResults(({ searchResults, searchState, children }: any) => {
  if (searchResults && searchResults.nbHits === 0) {
    return <NoResultsFound query={searchState?.query ?? ''} />;
  }
  return children;
});

const SearchExperience: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow p-6">
      <InstantSearch indexName={ALGOLIA_INDEX_NAME} searchClient={searchClient}>
        {/* Champ de recherche */}
        <div className="mb-6">
          <SearchBox
            translations={{ placeholder: 'Rechercher un produit éthique…' }}
            className="ais-SearchBox w-full"
          />
        </div>

        {/* Layout principal */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filtres */}
          <aside className="md:w-72">
            <h2 className="font-semibold text-gray-700 mb-2">🎯 Filtres</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Catégorie</p>
                <RefinementList attribute="category" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Zone</p>
                <RefinementList attribute="zones_dispo" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Couleur de confiance</p>
                <RefinementList attribute="confidence_color" />
              </div>
            </div>
          </aside>

          {/* Résultats */}
          <main className="flex-1">
            <Stats className="mb-4" />

            <ResultsWrapper>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Hits hitComponent={ProductHit} />
              </div>
            </ResultsWrapper>

            <div className="mt-6">
              <Pagination />
            </div>
          </main>
        </div>

        <Configure hitsPerPage={9} />
      </InstantSearch>
    </div>
  );
};

export default SearchExperience;
