import React from "react";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import EcoScoreBadge from "./EcoScoreBadge";

interface HitProps {
  hit: {
    id: string;
    title: string;
    slug?: string;
    brand?: string;
    image_url?: string;
    eco_score?: number;
    confidence_pct?: number;
    confidence_color?: "green" | "yellow" | "red";
    verified_status?: string;
    category?: string;
  };
}

// ❌ SUPPRIMÉ: const fallbackImage = "/fallback.png";
const fallbackImage = "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&q=80";

const ProductHit: React.FC<HitProps> = ({ hit }) => {
  const navigate = useNavigate();

  // Gestion intelligente des images
  const getHitImage = () => {
    if (hit.image_url?.trim() && !hit.image_url.includes('fallback')) {
      return hit.image_url.trim();
    }
    
    // Fallback par catégorie
    const categoryFallbacks: Record<string, string> = {
      'Alimentation': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop&q=80',
      'Cosmétiques': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop&q=80',
      'Maison': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&q=80'
    };
    
    return categoryFallbacks[hit.category || ''] || fallbackImage;
  };

  const handleClick = () => {
    if (hit.slug) {
      navigate(`/product/${hit.slug}`);
    } else {
      console.warn("Produit sans slug détecté", hit);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer bg-white border border-gray-200 rounded-xl shadow hover:shadow-md transition p-4 flex flex-col gap-3"
    >
      {/* Image produit */}
      <div className="aspect-[4/3] bg-gray-100 rounded overflow-hidden border">
        <img
          src={getHitImage()}
          alt={hit.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (!target.src.includes('unsplash.com')) {
              target.src = fallbackImage;
            }
          }}
        />
      </div>

      {/* Infos */}
      <div className="flex flex-col gap-1">
        {hit.brand && (
          <p className="text-xs text-gray-500 uppercase">{hit.brand}</p>
        )}
        <h3 className="text-sm font-semibold text-eco-text line-clamp-2">{hit.title}</h3>

        <EcoScoreBadge
          score={hit.eco_score ?? 0}
          confidenceColor={hit.confidence_color}
        />

        {hit.verified_status === "verified" && (
          <div className="flex items-center gap-1 text-green-600 text-xs mt-1">
            <Shield className="w-4 h-4" />
            Vérifié
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductHit;