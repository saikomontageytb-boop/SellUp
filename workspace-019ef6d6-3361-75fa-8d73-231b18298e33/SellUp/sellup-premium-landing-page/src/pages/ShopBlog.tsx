import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, timeAgo } from '../lib/api';
import { ShopLayout } from '../components/ShopLayout';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function ShopBlog() {
  const { slug, postSlug } = useParams<{ slug: string; postSlug?: string }>();
  const [shopData, setShopData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    if (!slug) return;
    api.getShop(slug).then(setShopData);
    if (postSlug) {
      fetch(`/api/public/shop/${slug}/blog/${postSlug}`).then(r => r.json()).then(d => setPost(d.post));
    } else {
      fetch(`/api/public/shop/${slug}/blog`).then(r => r.json()).then(d => setPosts(d.posts || []));
    }
  }, [slug, postSlug]);

  if (!shopData) return <div className="min-h-screen flex items-center justify-center opacity-50">Chargement...</div>;

  return (
    <ShopLayout shop={shopData.shop} pages={shopData.pages} hasBlog={shopData.has_blog}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        {postSlug ? (
          post ? (
            <article>
              <Link to={`/s/${slug}/blog`} className="inline-flex items-center gap-2 opacity-60 hover:opacity-100 text-sm mb-6">
                <ArrowLeft className="w-4 h-4" /> Tous les articles
              </Link>
              {post.image_url && (
                <img src={post.image_url} className="w-full aspect-video object-cover rounded-2xl mb-6" alt="" />
              )}
              <h1 className="text-4xl font-extrabold mb-2">{post.title}</h1>
              <p className="opacity-50 text-sm mb-8">{timeAgo(post.created_at)}</p>
              <div className="prose prose-invert max-w-none whitespace-pre-line opacity-90">
                {post.content}
              </div>
            </article>
          ) : (
            <p className="opacity-50">Chargement...</p>
          )
        ) : (
          <>
            <Link to={`/s/${slug}`} className="inline-flex items-center gap-2 opacity-60 hover:opacity-100 text-sm mb-6">
              <ArrowLeft className="w-4 h-4" /> Retour
            </Link>
            <h1 className="text-4xl font-extrabold mb-2 flex items-center gap-3">
              <BookOpen className="w-8 h-8" /> Blog
            </h1>
            <p className="opacity-60 mb-8">Actualités et nouveautés</p>
            {posts.length === 0 ? (
              <p className="opacity-50">Pas d'article pour l'instant.</p>
            ) : (
              <div className="space-y-4">
                {posts.map(p => (
                  <Link key={p.id} to={`/s/${slug}/blog/${p.slug}`}
                    className="glass-card overflow-hidden flex flex-col sm:flex-row hover:scale-[1.01] transition">
                    {p.image_url && (
                      <img src={p.image_url} className="w-full sm:w-56 h-40 object-cover" alt="" />
                    )}
                    <div className="p-5 flex-1">
                      <h2 className="text-xl font-bold mb-2">{p.title}</h2>
                      <p className="opacity-60 text-sm line-clamp-2">{p.excerpt}</p>
                      <p className="opacity-40 text-xs mt-3">{timeAgo(p.created_at)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </ShopLayout>
  );
}
