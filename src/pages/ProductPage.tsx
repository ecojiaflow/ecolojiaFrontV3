import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, MapPin, Star, Loader, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ConfidenceBadge from '../components/ConfidenceBadge';
import { cleanText } from '../lib/algolia';

type Product = {
  id: string;
  title: string;
  description: string;
  images: string[];
  tags: string[];
  eco_score: number;
  confidence_pct: number;
  confidence_color: 'green' | 'yellow' | 'red';
  zones_dispo: string[];
  resume_fr?: string;
  criteria_score?: Record<string, number>;
  verified_status?: string;
  partnerLinks?: { id: string; url: string }[];
};

const ProductPage: React.FC = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      if (!slug) {
        setError(t('common.productNotFound'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'https://ecolojia-backend.onrender.com'}/api/products/${slug}`;
        console.log('🔍 Appel API:', apiUrl);
        
        const res = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(t('common.productNotFound'));
          }
          throw new Error(`Erreur serveur: ${res.status}`);
        }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('Réponse invalide du serveur');
        }

        const data = await res.json();
        setProduct(data);
        console.log('✅ Produit chargé:', data);
        
      } catch (err: any) {
        console.error('❌ Erreur chargement produit:', err);
        setError(err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [slug, t]);

  const renderEcoStars = (score: number) => {
    const normalizedScore = Math.min(5, Math.max(0, score * 5));
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < normalizedScore ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const trackingUrl = product?.partnerLinks?.[0]?.id
    ? `${import.meta.env.VITE_API_BASE_URL || 'https://ecolojia-backend.onrender.com'}/api/track/${product.partnerLinks[0].id}`
    : null;

  // État de chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-eco-leaf mx-auto mb-4" />
          <p className="text-eco-text">{t('common.loadingProduct')}</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-eco-text mb-2">{t('common.productNotFound')}</h2>
          <p className="text-gray-600 mb-4">
            {error || t('common.productNotFoundDesc')}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/')}
              className="block w-full bg-eco-leaf text-white px-6 py-2 rounded-lg hover:bg-eco-leaf/90 transition-colors"
            >
              {t('common.backToHome')}
            </button>
            <button
              onClick={() => navigate(-1)}
              className="block w-full border border-eco-leaf/20 text-eco-text px-6 py-2 rounded-lg hover:bg-eco-leaf/10 transition-colors"
            >
              {t('common.previousPage')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Bouton retour */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-eco-leaf hover:text-eco-text transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          {t('common.back')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image du produit */}
          <div className="space-y-4">
            <div className="relative">
              <img
                src={product.images?.[0] || '/placeholder.jpg'}
                alt={cleanText(product.title)}
                className="w-full h-80 object-cover rounded-xl shadow-sm"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.jpg';
                }}
              />
              {product.verified_status === 'verified' && (
                <div className="absolute top-4 right-4 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                  ✅ {t('common.verified')}
                </div>
              )}
            </div>
            
            {/* Images supplémentaires */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1, 5).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`${cleanText(product.title)} - vue ${i + 2}`}
                    className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.jpg';
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Détails du produit */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-eco-leaf/10">
              {/* En-tête avec titre et badge confiance */}
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-2xl lg:text-3xl font-bold text-eco-text pr-4">
                  {cleanText(product.title)}
                </h1>
                <ConfidenceBadge 
                  pct={product.confidence_pct} 
                  color={product.confidence_color} 
                />
              </div>

              {/* Description */}
              <p className="text-gray-600 leading-relaxed mb-6">
                {cleanText(product.description)}
              </p>

              {/* Analyse IA */}
              {product.resume_fr && (
                <div className="bg-eco-leaf/5 border-l-4 border-eco-leaf p-4 rounded-r-lg mb-6">
                  <h3 className="font-semibold text-eco-text mb-2 flex items-center gap-2">
                    🤖 {t('common.analysisAI')}
                  </h3>
                  <p className="text-sm text-eco-text/80 leading-relaxed">
                    {cleanText(product.resume_fr)}
                  </p>
                </div>
              )}

              {/* Score écologique */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-eco-text">{t('common.ecoScore')} :</span>
                  <div className="flex items-center gap-1">
                    {renderEcoStars(product.eco_score)}
                  </div>
                  <span className="text-sm text-gray-600">
                    {(product.eco_score * 5).toFixed(1)}/5
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-eco-leaf h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(product.eco_score || 0) * 100}%` }}
                  />
                </div>
              </div>

              {/* Tags */}
              {product.tags?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-eco-text mb-3">🏷️ {t('common.characteristics')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, i) => (
                      <span 
                        key={i} 
                        className="bg-eco-leaf/10 text-eco-text text-sm px-3 py-1 rounded-full border border-eco-leaf/20"
                      >
                        {cleanText(tag)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Zones disponibles */}
              {product.zones_dispo?.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-eco-leaf" />
                    <span className="font-semibold text-eco-text">{t('common.availableZones')} :</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.zones_dispo.map((zone, i) => (
                      <span 
                        key={i} 
                        className="bg-blue-50 text-blue-700 text-sm px-2 py-1 rounded border border-blue-200"
                      >
                        {cleanText(zone)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bouton d'achat */}
              {trackingUrl ? (
                <div className="pt-4 border-t border-gray-100">
                  <a
                    href={trackingUrl}
                    className="inline-flex items-center gap-2 w-full justify-center bg-eco-leaf text-white px-6 py-3 rounded-xl hover:bg-eco-leaf/90 transition-colors font-medium shadow-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('common.buyProduct')}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {t('common.ethicalPartner')}
                  </p>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-100 text-center">
                  <div className="text-sm text-gray-400 mb-2">
                    {t('common.noAffiliateLink')}
                  </div>
                  <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-eco-leaf/20 text-eco-leaf rounded-lg hover:bg-eco-leaf/10 transition-colors"
                  >
                    {t('common.seeOtherProducts')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductPage;