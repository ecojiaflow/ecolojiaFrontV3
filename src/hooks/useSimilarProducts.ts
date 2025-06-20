import { useEffect, useState } from "react";

export interface SimilarProduct {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
  eco_score: number;
}

export function useSimilarProducts(productId: string) {
  const [similar, setSimilar] = useState<SimilarProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;

    fetch(`/api/products/${productId}/similar`)
      .then(res => res.json())
      .then(setSimilar)
      .catch(err => console.error("❌ Erreur suggestions :", err))
      .finally(() => setLoading(false));
  }, [productId]);

  return { similar, loading };
}
