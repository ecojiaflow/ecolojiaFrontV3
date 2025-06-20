import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Leaf, Users, Shield } from "lucide-react";

import ConfidenceBadge from "../components/ConfidenceBadge";
import PartnerLinks from "../components/PartnerLinks";

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
  confidence_color?: "green" | "yellow" | "red";
  verified_status: "verified" | "manual_review" | "rejected";
  resume_fr?: string;
  partnerLinks: PartnerLink[];
}

const fallbackImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='%23999' text-anchor='middle' dy='0.3em'%3EProduit%3C/text%3E%3C/svg%3E";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const ProductPage: React.FC = () => {
  const params = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Récupération intelligente du slug
  const getSlugFromUrl = (): string | null => {
    // Méthode 1: depuis useParams
    if (params.slug && params.slug !== 'undefined') {
      return params.slug;
    }
    
    // Méthode 2: parsing manuel de l'URL
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length >= 2 && pathSegments[0] === 'product') {
      const urlSlug = pathSegments[1];
      if (urlSlug && urlSlug !== 'undefined') {
        return urlSlug;
      }
    }
    
    // Méthode 3: depuis window.location en dernier recours
    const windowSegments = window.location.pathname.split('/').filter(Boolean);
    if (windowSegments.length >= 2 && windowSegments[0] === 'product') {
      const windowSlug = windowSegments[1];
      if (windowSlug && windowSlug !== 'undefined') {
        return windowSlug;
      }
    }
    
    return null;
  };

  const actualSlug = getSlugFromUrl();

  console.log("🔍 Frontend Debug:", {
    "params.slug": params.slug,
    "location.pathname": location.pathname,
    "window.location.pathname": window.location.pathname,
    "actualSlug": actualSlug,
    "API_BASE_URL": API_BASE_URL
  });

  useEffect(() => {
    if (!actualSlug) {
      console.log("❌ Frontend: Impossible de récupérer le slug");
      setError("Aucun produit spécifié");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchProduct = async () => {
      try {
        const cleanSlug = actualSlug.trim();
        const encodedSlug = encodeURIComponent(cleanSlug);
        const finalUrl = `${API_BASE_URL}/api/products/${encodedSlug}`;
        
        console.log("🔍 Frontend: Fetching avec slug =", cleanSlug);
        console.log("🔍 Frontend: URL complète =", finalUrl);
        
        const response = await fetch(finalUrl, { 
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log("🔍 Frontend: Response status =", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.log("❌ Frontend: Response error =", errorText);
          
          throw new Error(
            response.status === 404
              ? "Produit non trouvé"
              : `Erreur serveur (${response.status})`
          );
        }

        const data: Product | { product: Product } = await response.json();
        console.log("✅ Frontend: Données reçues =", data);
        
        const rawProduct = (data as any).product ?? data;

        const normalised: Product = {
          ...rawProduct,
          eco_score:
            typeof rawProduct.eco_score === "string"
              ? parseFloat(rawProduct.eco_score)
              : rawProduct.eco_score,
          ai_confidence:
            typeof rawProduct.ai_confidence === "string"
              ? parseFloat(rawProduct.ai_confidence)
              : rawProduct.ai_confidence,
        };

        console.log("✅ Frontend: Produit normalisé =", normalised.title);
        setProduct(normalised);
        
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        
        console.error("❌ Frontend: Erreur fetch:", err);
        setError(err instanceof Error ? err.message : "Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    return () => controller.abort();
  }, [actualSlug]);

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
            
            {/* Debug info en mode développement */}
            {import.meta.env.DEV && (
              <div className="bg-gray-100 p-4 rounded-lg text-left text-sm mb-6 max-w-md mx-auto">
                <p><strong>Debug Info:</strong></p>
                <p>URL: {location.pathname}</p>
                <p>Params slug: {JSON.stringify(params.slug)}</p>
                <p>Actual slug: {JSON.stringify(actualSlug)}</p>
                <p>API URL: {API_BASE_URL}</p>
              </div>
            )}
            
            <button
              onClick={() => navigate("/")}
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

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-eco-text/70 hover:text-eco-leaf transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux résultats
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-eco-leaf/20">
              <img
                src={product.image_url || fallbackImage}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = fallbackImage;
                }}
              />
            </div>
          </div>

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

              <div className="flex items-center gap-4 mb-6">
                <ConfidenceBadge
                  pct={product.confidence_pct ?? 0}
                  color={product.confidence_color ?? "yellow"}
                />
                {product.verified_status === "verified" && (
                  <div className="flex items-center gap-1 text-eco-leaf">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Vérifié</span>
                  </div>
                )}
              </div>
            </div>

            {typeof product.eco_score === "number" && (
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
                          style={{ width: `${product.eco_score * 100}%` }}
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

            <div>
              <h3 className="text-xl font-semibold text-eco-text mb-3">Description</h3>
              <p className="text-eco-text/80 leading-relaxed">{product.description}</p>
            </div>

            {product.tags?.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-eco-text mb-3">Caractéristiques</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-eco-leaf/10 text-eco-leaf rounded-full text-sm font-medium border border-eco-leaf/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {product.resume_fr && (
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <Users className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Analyse IA
                    </h3>
                    <p className="text-blue-800 leading-relaxed">{product.resume_fr}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="border-t border-gray-200 pt-8">
          <PartnerLinks partnerLinks={product.partnerLinks} productTitle={product.title} />
        </section>
      </div>
    </div>
  );
};

export default ProductPage;