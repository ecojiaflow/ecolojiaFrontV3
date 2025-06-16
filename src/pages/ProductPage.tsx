import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Leaf, Users, Shield } from 'lucide-react';
import ConfidenceBadge from '../components/ConfidenceBadge';
import PartnerLinks from '../components/PartnerLinks';

interface Partner {
  id: string;
  name: string;
  website?: string;
  commission_rate: number;
  ethical_score: number;
}

interface PartnerLink {
  id: string;
  url: string;
  tracking_id?: string;
  commission_rate: number;
  clicks: number;
  partner: Partner;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  brand?: string;
  category?: string;
  tags: string[];
  image_url?: string;
  eco_score?: number;
  ai_confidence?: number;
  confidence_pct?: number;
  confidence_color?: 'green' | 'yellow' | 'red';
  verified_status: 'verified' | 'manual_review' | 'rejected';
  resume_fr?: string;
  partnerLinks: PartnerLink[];
}

const ProductPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Aucun produit spécifié');
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${slug}`);
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: Produit non trouvé`);
        }

        const data = await response.json();
        console.log('✅ Données produit reçues:', data);
        
        // L'API peut retourner soit data.product soit directement data
        const productData = data.product || data;
        
        // Convertir les scores en nombres si nécessaire
        if (productData.eco_score && typeof productData.eco_score === 'string') {
          productData.eco_score = parseFloat(productData.eco_score);
        }
        if (productData.ai_confidence && typeof productData.ai_confidence === 'string') {
          productData.ai_confidence = parseFloat(productData.ai_confidence);
        }
        
        setProduct(productData);
      } catch (err) {
        console.error('❌ Erreur lors du chargement du produit:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-leaf"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-eco-text mb-4">Produit non trouvé</h1>
            <p className="text-eco-text/70 text-lg mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-eco-leaf text-white rounded-lg hover:bg-eco-leaf/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fallbackImage = 'https://res.cloudinary.com/dma0ywmfb/image/upload/w_600,h_600,c_fill,q_auto,f_auto/v1750024282/placeholder-product_nkxe8m.jpg';

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header avec retour */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-eco-text/70 hover:text-eco-leaf transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux résultats
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Image du produit */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-eco-leaf/20">
              <img
                src={product.image_url || fallbackImage}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = fallbackImage;
                }}
              />
            </div>
          </div>

          {/* Informations du produit */}
          <div className="space-y-6">
            <div>
              {product.brand && (
                <p className="text-sm text-eco-text/60 uppercase tracking-wider mb-2">
                  {product.brand}
                </p>
              )}
              <h1 className="text-4xl font-bold text-eco-text mb-4">
                {product.title}
              </h1>
              
              {/* Badges */}
              <div className="flex items-center gap-4 mb-6">
                <ConfidenceBadge
                  pct={product.confidence_pct || 0}
                  color={product.confidence_color || 'yellow'}
                />
                {product.verified_status === 'verified' && (
                  <div className="flex items-center gap-1 text-eco-leaf">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Vérifié</span>
                  </div>
                )}
              </div>
            </div>

            {/* Score écologique */}
            {product.eco_score && (
              <div className="bg-eco-leaf/5 p-6 rounded-xl border border-eco-leaf/20">
                <div className="flex items-start gap-3">
                  <Leaf className="h-6 w-6 text-eco-leaf mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-eco-text mb-3">
                      Score écologique
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-eco-leaf/20 rounded-full h-4">
                        <div
                          className="bg-eco-leaf h-4 rounded-full transition-all duration-500"
                          style={{ width: `${(product.eco_score * 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-eco-text">
                        {(product.eco_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-xl font-semibold text-eco-text mb-3">Description</h3>
              <p className="text-eco-text/80 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-eco-text mb-3">Caractéristiques</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-eco-leaf/10 text-eco-leaf rounded-full text-sm font-medium border border-eco-leaf/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Résumé IA */}
            {product.resume_fr && (
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <Users className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Analyse IA
                    </h3>
                    <p className="text-blue-800 leading-relaxed">
                      {product.resume_fr}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Liens partenaires */}
        <section className="border-t border-gray-200 pt-8">
          <PartnerLinks 
            partnerLinks={product.partnerLinks} 
            productTitle={product.title}
          />
        </section>
      </div>
    </div>
  );
};

export default ProductPage;


