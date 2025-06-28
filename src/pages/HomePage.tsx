import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Search, X, ChevronDown, Filter, Grid, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Composants internes
import ProductHit from '../components/ProductHit';
import NoResultsFound from '../components/NoResultsFound';

// Config Algolia
import searchClient, { ALGOLIA_INDEX_NAME } from '../lib/algolia';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  /* --- état & logique de recherche (inchangé) --- */
  // ... ✂️  (tout le code que tu as déjà : useState, useEffect, performSearch, etc.) ...
  // AUCUNE ligne supprimée ici.

  return (
    <div className="min-h-screen flex flex-col">
      {/* ---------- HERO ---------- */}
      <section className="bg-eco-gradient py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <Leaf className="h-16 w-16 text-eco-leaf animate-pulse" />
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-eco-text mb-6">
            <span
              dangerouslySetInnerHTML={{
                __html: t('homepage.hero.title', {
                  interpolation: { escapeValue: false },
                })
                  .replace('<highlight>', '<span class="text-eco-leaf">')
                  .replace('</highlight>', '</span>'),
              }}
            />
          </h1>

          <p className="text-lg md:text-xl text-eco-text/80 max-w-3xl mx-auto mb-12">
            {t('homepage.hero.subtitle')}
          </p>

          {/* --- barre de recherche optimisée (inchangée) --- */}
          {/* ... ton <form> avec input, icônes, indicateurs, etc. ... */}
        </div>
      </section>

      {/* ---------- SECTION RÉSULTATS ---------- */}
      <section id="results-section" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ... tout le bloc résultats + filtres + pagination, inchangé ... */}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
