import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { ShopLayout } from '../components/ShopLayout';
import { ArrowLeft } from 'lucide-react';

export default function ShopPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();
  const [shopData, setShopData] = useState<any>(null);
  const [page, setPage] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug || !pageSlug) return;
    api.getShop(slug).then(setShopData);
    fetch(`/api/public/shop/${slug}/page/${pageSlug}`).then(r => r.json()).then(d => {
      if (d.error) setError(d.error); else setPage(d.page);
    });
  }, [slug, pageSlug]);

  if (!shopData) return <div className="min-h-screen flex items-center justify-center opacity-50">Chargement...</div>;
  if (error) return (
    <ShopLayout shop={shopData.shop} pages={shopData.pages} hasBlog={shopData.has_blog}>
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Page introuvable</h1>
        <p className="opacity-60 mb-6">{error}</p>
      </div>
    </ShopLayout>
  );

  return (
    <ShopLayout shop={shopData.shop} pages={shopData.pages} hasBlog={shopData.has_blog}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link to={`/s/${slug}`} className="inline-flex items-center gap-2 opacity-60 hover:opacity-100 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour à la boutique
        </Link>
        {page && (
          <>
            <h1 className="text-4xl font-extrabold mb-6">{page.title}</h1>
            <div className="prose prose-invert max-w-none whitespace-pre-line opacity-90">
              {page.content}
            </div>
          </>
        )}
      </div>
    </ShopLayout>
  );
}
