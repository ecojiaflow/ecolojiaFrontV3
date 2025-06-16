import React from 'react';
import ProductCard from './ProductCard';
import ConfidenceBadge from './ConfidenceBadge';
import { Product } from '../types';

interface ProductHitProps {
  hit: any;
}

const getConfidenceColor = (confidence: number): 'green' | 'yellow' | 'red' => {
  if (confidence >= 80) return 'green';
  if (confidence >= 60) return 'yellow';
  return 'red';
};

const ProductHit: React.FC<ProductHitProps> = ({ hit }) => {
  const getImageUrl = (hit: any): string => {
    const imageMap: { [key: string]: string } = {
      'savon-alep-artisanal': 'https://res.cloudinary.com/dma0ywmfb/image/upload/w_400,h_400,c_fill,q_auto,f_auto/v1750024282/savon-alep_txl6yj.jpg',
    };

    if (imageMap[hit.slug]) return imageMap[hit.slug];
    if (hit.image_url?.trim()) return hit.image_url.trim();
    if (Array.isArray(hit.images) && hit.images[0]) return hit.images[0];
    return '/placeholder-image.jpg';
  };

  const confidencePct = typeof hit.confidence_pct === 'string' ? parseInt(hit.confidence_pct) : hit.confidence_pct;
  const confidenceColor = hit.confidence_color || getConfidenceColor(confidencePct);

  const adaptedProduct: Product = {
    ...hit,
    image_url: getImageUrl(hit),
    tagsKeys: hit.tags || [],
    zonesDisponibles: hit.zones_dispo || [],
    brandKey: hit.brandKey || hit.brand || '',
    descriptionKey: hit.descriptionKey || hit.description || '',
    nameKey: hit.nameKey || hit.title || '',
    aiConfidence: typeof hit.ai_confidence === 'string' ? parseFloat(hit.ai_confidence) : hit.ai_confidence,
    confidence_pct: confidencePct,
    confidence_color: confidenceColor,
    ethicalScore: typeof hit.eco_score === 'string' ? parseFloat(hit.eco_score) : hit.eco_score,
    partnerLinks: hit.partnerLinks || [],
    price: typeof hit.price === 'string' ? parseFloat(hit.price) : hit.price || 0,
    currency: hit.currency || 'EUR',
    verified: hit.verified_status === 'verified',
  };

  return (
    <ProductCard
      product={adaptedProduct}
      onClick={() => {
        window.location.href = `/product/${hit.slug}`;
      }}
    />
  );
};

export default ProductHit;
