import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Filter, Grid, List } from 'lucide-react';
import { CATEGORIES, CategoryType } from '../types/categories';
import { Product } from '../types';
import { fetchRealProducts } from '../api/realApi';

const CategoryPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categoryConfig = category ? CATEGORIES[category as CategoryType] : null;

  useEffect(() => {
    if (category) {
      loadCategoryProducts();
    }
  }, [category]);

  const loadCategoryProducts = async () => {
    try {
      setLoading(true);
      // Pour l'instant, on charge tous les produits et on filtre côté client
      const allProducts = await fetchRealProducts();
      
      // Filtrage par catégorie (temporaire jusqu'à ce que l'API supporte le filtrage)
      const categoryProducts = allProducts.filter(product => 
        product.category === category || 
        product.tagsKeys.some(tag => 
          categoryConfig?.criteria.includes(tag.toLowerCase())
        )
      );
      
      setProducts(categoryProducts);
    } catch (error) {
      console.error('Erreur chargement catégorie:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.nameKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brandKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.tagsKeys.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!categoryConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800">Catégorie non trouvée</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Catégorie */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="text-4xl">{categoryConfig.icon}</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{categoryConfig.name}</h1>
              <p className="text-gray-600 mt-2">
                Découvrez des produits {categoryConfig.name.toLowerCase()} éco-responsables
              </p>
            </div>
          </div>

          {/* Critères spécialisés */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="text-sm text-gray-600">Critères importants :</span>
            {categoryConfig.criteria.map(criterion => (
              <span
                key={criterion}
                className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {criterion}
              </span>
            ))}
          </div>

          {/* Barre de recherche */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={`Rechercher dans ${categoryConfig.name.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="h-5 w-5" />
              <span>Filtres</span>
            </button>
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 ${viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'hover:bg-gray-50'}`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 ${viewMode === 'list' ? 'bg-green-100 text-green-600' : 'hover:bg-gray-50'}`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des produits...</p>
          </div>
        ) : (
          <>
            {/* Résultats */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé{filteredProducts.length !== 1 ? 's' : ''}
              </h2>
            </div>

            {/* Grille produits */}
            {filteredProducts.length > 0 ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} viewMode={viewMode} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucun produit trouvé</h3>
                <p className="text-gray-600">
                  Essayez de modifier votre recherche ou explorez d'autres catégories
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Composant ProductCard simplifié
interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode }) => {
  const isListMode = viewMode === 'list';

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${
      isListMode ? 'flex' : ''
    }`}>
      <img
        src={product.image}
        alt={product.nameKey}
        className={`object-cover ${
          isListMode ? 'w-24 h-24' : 'w-full h-48'
        }`}
      />
      <div className={`p-4 ${isListMode ? 'flex-1' : ''}`}>
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.nameKey}
        </h3>
        <p className="text-sm text-gray-600 mb-2">{product.brandKey}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
              {(product.ethicalScore * 20).toFixed(0)}%
            </div>
            {product.verified && (
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                ✓ Vérifié
              </div>
            )}
          </div>
          <span className="text-lg font-bold text-gray-900">
            {product.price}€
          </span>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;