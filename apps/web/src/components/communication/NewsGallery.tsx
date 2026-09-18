import React, { useEffect, useState } from 'react';
import type { NewsArticle, SocialPost } from '../../types';
import { apiUrl } from '../../services/api';
import {
  Newspaper,
  Eye,
  Calendar,
  ArrowRight,
  X,
  Play,
  Clock,
  Sparkles,
  Maximize2,
  Flag,
} from 'lucide-react';

interface GalleryMediaItem {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  title: string;
  category: string;
  videoUrl?: string;
  date?: string;
}

export const NewsGallery: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'NEWS' | 'GALLERY' | 'SOCIAL_FEED'>('NEWS');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [postContent, setPostContent] = useState('');
  const [postError, setPostError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  // État de modération / signalement
  const [reportingPost, setReportingPost] = useState<SocialPost | null>(null);
  const [reportReason, setReportReason] = useState<string>('SPAM');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [reportSending, setReportSending] = useState<boolean>(false);

  // Lightbox Media State (Image or Video preview like MatchCenter)
  const [activeMedia, setActiveMedia] = useState<{ type: 'IMAGE' | 'VIDEO'; url: string; title: string } | null>(null);

  useEffect(() => {
    // Fetch news (posts with mediaUrl, ordered by views)
    setLoadingNews(true);
    fetch(apiUrl('/posts'))
      .then(async (response) => {
        if (!response.ok) throw new Error('Feed indisponible');
        const posts = await response.json() as Array<{
          id: string;
          content: string;
          mediaUrl: string | null;
          createdAt: string;
          author: { name: string; avatarUrl: string | null; role: string };
          _count: { likes: number; comments: number };
        }>;
        // All posts appear as social feed items
        setSocialPosts(posts.map((post) => ({
          id: post.id,
          authorName: post.author.name,
          authorAvatar: post.author.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}&background=B91C1C&color=fff`,
          authorRole: post.author.role as SocialPost['authorRole'],
          timestamp: new Date(post.createdAt).toLocaleString('fr-FR'),
          content: post.content,
          mediaUrl: post.mediaUrl || undefined,
          likesCount: post._count.likes,
          comments: [],
          reactions: [],
        })));
        // Posts with mediaUrl that have a title-like content become news cards
        const newsItems: NewsArticle[] = posts
          .filter((p) => p.mediaUrl)
          .map((p) => ({
            id: p.id,
            title: p.content.split('\n')[0].slice(0, 100),
            category: 'ACTUALITÉ',
            date: new Date(p.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
            author: p.author.name,
            authorAvatar: p.author.avatarUrl || undefined,
            image: p.mediaUrl!,
            summary: p.content.slice(0, 200),
            content: p.content,
            readTime: `${Math.max(1, Math.ceil(p.content.length / 1000))} min de lecture`,
            tags: [],
            views: p._count.likes,
            isFeatured: false,
          }));
        setNews(newsItems);
      })
      .catch(() => undefined)
      .finally(() => setLoadingNews(false));
  }, []);

  const publishPost = async (event: React.FormEvent) => {
    event.preventDefault();
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (!session?.token) {
      setPostError('Connectez-vous pour publier dans le fil social.');
      return;
    }
    if (!postContent.trim()) return;
    setPublishing(true);
    setPostError(null);
    try {
      const response = await fetch(apiUrl('/posts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ content: postContent }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Publication impossible.');
      const author = data.post.author;
      const published: SocialPost = {
        id: data.post.id,
        authorName: author.name,
        authorAvatar: author.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        authorRole: author.role as SocialPost['authorRole'],
        timestamp: 'À l’instant',
        content: data.post.content,
        likesCount: 0,
        comments: [],
        reactions: [],
      };
      setSocialPosts((current) => [published, ...current]);
      setPostContent('');
    } catch (error) {
      setPostError(error instanceof Error ? error.message : 'Publication impossible.');
    } finally {
      setPublishing(false);
    }
  };

  // Gallery items with both HD photos and videos
  const galleryItems: GalleryMediaItem[] = [
    {
      id: 'g1',
      type: 'VIDEO',
      url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80',
      title: 'Résumé HD : Victoire Explosive vs Red Dragons (94-86)',
      category: 'Matchs',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      date: '29 Juillet 2026',
    },
    {
      id: 'g2',
      type: 'IMAGE',
      url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
      title: 'Atelier Dunk Darius Jackson au-dessus du cercle',
      category: 'Entraînements',
      date: '28 Juillet 2026',
    },
    {
      id: 'g3',
      type: 'VIDEO',
      url: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&auto=format&fit=crop&q=80',
      title: 'Highlights : Les 3 Pointers Létaux de Marcus Vance',
      category: 'Pro',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      date: '25 Juillet 2026',
    },
    {
      id: 'g4',
      type: 'IMAGE',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80',
      title: 'Shoot-off Lucas Dubois lors de la séance matinale',
      category: 'Matchs',
      date: '24 Juillet 2026',
    },
    {
      id: 'g5',
      type: 'IMAGE',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
      title: 'Séance Mixte Académie U18 & Groupe Pro',
      category: 'Académie',
      date: '22 Juillet 2026',
    },
    {
      id: 'g6',
      type: 'IMAGE',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
      title: 'Gala Annuel des Partenaires & Sponsors',
      category: 'Événements',
      date: '20 Juillet 2026',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2 border border-purple-500/30">
            <Newspaper className="w-3.5 h-3.5" /> Médias, Actus & Fil du Staff
          </div>
          <h2 className="text-3xl font-extrabold text-white">Actualités & Médias du Club</h2>
          <p className="text-slate-400 text-sm">
            Reportages complets, fil social des entraîneurs et galerie photos & vidéos en Haute Définition.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-2xl border border-white/10 self-start md:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('NEWS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'NEWS'
                ? 'bg-linear-to-r from-[#B91C1C] to-[#881337] text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            📰 Articles Détaillés
          </button>
          <button
            onClick={() => setActiveTab('SOCIAL_FEED')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'SOCIAL_FEED'
                ? 'bg-linear-to-r from-[#B91C1C] to-[#881337] text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            💬 Posts Staff (Fil Flash)
          </button>
          <button
            onClick={() => setActiveTab('GALLERY')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'GALLERY'
                ? 'bg-linear-to-r from-[#B91C1C] to-[#881337] text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            🎬 Galerie Photos & Vidéos
          </button>
        </div>
      </div>

      {/* 1. ARTICLES FEED */}
      {activeTab === 'NEWS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {loadingNews ? (
            <div className="col-span-2 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="glass-panel rounded-3xl overflow-hidden border border-white/10 h-64 animate-pulse bg-white/5" />
              ))}
            </div>
          ) : news.length === 0 ? (
            <div className="col-span-2 flex flex-col items-center justify-center py-20 space-y-3 text-center">
              <Newspaper className="w-10 h-10 text-slate-600" />
              <p className="text-slate-400 text-sm">Aucun article disponible pour le moment.</p>
              <p className="text-slate-500 text-xs">Les publications avec photos du club apparaîtront ici.</p>
            </div>
          ) : (
          news.map((article) => (
            <div
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="group glass-panel rounded-3xl overflow-hidden border border-white/10 hover:border-[#B91C1C]/50 cursor-pointer flex flex-col justify-between transition-all duration-300 bg-[#0A0C13]"
            >
              <div className="relative h-64 w-full overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0A0C13] via-transparent to-black/40" />

                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#B91C1C] text-white text-xs font-extrabold shadow-md">
                    {article.category}
                  </span>
                  {article.isFeatured && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#D97706] text-black text-[10px] font-black uppercase">
                      ⭐ À la une
                    </span>
                  )}
                </div>

                {article.videoUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#B91C1C]/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#D97706]" /> {article.date}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> {article.readTime || '4 min'}</span>
                  <span className="flex items-center gap-1.5 ml-auto"><Eye className="w-3.5 h-3.5 text-slate-400" /> {article.views} vues</span>
                </div>

                <h3 className="text-xl font-extrabold text-white group-hover:text-[#D97706] transition-colors leading-snug">
                  {article.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 font-normal">
                  {article.summary}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    {article.authorAvatar && (
                      <img src={article.authorAvatar} alt={article.author} className="w-6 h-6 rounded-full object-cover border border-white/20" />
                    )}
                    <span className="text-slate-300 font-semibold">{article.author}</span>
                  </div>

                  <span className="text-[#B91C1C] font-extrabold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Lire le reportage complet <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))
          )}
        </div>
      )}

      {/* 2. SOCIAL FEED FROM STAFF & COACHES (Synchronized with Homepage) */}
      {activeTab === 'SOCIAL_FEED' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <form onSubmit={publishPost} className="glass-panel p-4 rounded-3xl border border-[#D97706]/30 space-y-3 bg-[#0A0C13]">
            <label htmlFor="social-post" className="text-xs font-bold text-[#D97706]">Nouvelle publication</label>
            <textarea
              id="social-post"
              value={postContent}
              onChange={(event) => setPostContent(event.target.value)}
              placeholder="Partagez une actualité du club..."
              maxLength={2000}
              className="w-full min-h-24 rounded-2xl glass-input p-3 text-sm resize-y"
            />
            {postError && <p className="text-xs text-amber-300">{postError}</p>}
            <button type="submit" disabled={publishing || !postContent.trim()} className="px-4 py-2 rounded-xl bg-[#B91C1C] text-white text-xs font-bold disabled:opacity-50">
              {publishing ? 'Publication...' : 'Publier'}
            </button>
          </form>
          <div className="bg-[#0D0E15] p-4 rounded-2xl border border-white/10 text-xs text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D97706] shrink-0" />
            <span>
              Toutes les publications faites par le Coach & le Staff sur l'accueil apparaissent également ici. Les publications de l'accueil sont éphémères (24h).
            </span>
          </div>

          {socialPosts.map((post) => (
            <div key={post.id} className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 bg-[#0A0C13]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={post.authorAvatar} alt={post.authorName} className="w-10 h-10 rounded-2xl object-cover border border-[#D97706]" />
                  <div>
                    <div className="font-extrabold text-white text-sm flex items-center gap-2">
                      <span>{post.authorName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#B91C1C]/30 text-red-300 text-[10px] font-bold">
                        {post.authorBadge}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">{post.timestamp}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setReportingPost(post);
                    setReportSuccess(null);
                    setReportDetails('');
                  }}
                  type="button"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  title="Signaler cette publication"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden sm:inline">Signaler</span>
                </button>
              </div>

              <p className="text-sm text-slate-200 leading-relaxed">{post.content}</p>

              {post.mediaUrl && (
                <div className="rounded-2xl overflow-hidden border border-white/10 max-h-96">
                  <img src={post.mediaUrl} alt="Media" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Tags & Reactions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                {post.tags?.map((t, idx) => (
                  <span key={idx} className="text-xs text-[#D97706] font-semibold">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. GALLERY PHOTOS & VIDEOS WITH LIGHTBOX */}
      {activeTab === 'GALLERY' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryItems.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (item.type === 'VIDEO' && item.videoUrl) {
                  setActiveMedia({ type: 'VIDEO', url: item.videoUrl, title: item.title });
                } else {
                  setActiveMedia({ type: 'IMAGE', url: item.url, title: item.title });
                }
              }}
              className="glass-panel rounded-3xl overflow-hidden border border-white/10 group relative h-64 cursor-pointer bg-[#0A0C13] hover:border-[#B91C1C]/50 transition-all duration-300"
            >
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#B91C1C] text-white text-[10px] font-extrabold uppercase">
                    {item.category}
                  </span>
                  <span className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    {item.type === 'VIDEO' ? <Play className="w-4 h-4 fill-current text-[#D97706]" /> : <Maximize2 className="w-4 h-4" />}
                  </span>
                </div>

                <div className="space-y-1">
                  {item.date && <div className="text-[10px] text-slate-400">{item.date}</div>}
                  <h4 className="text-sm font-extrabold text-white group-hover:text-[#D97706] transition-colors line-clamp-2">
                    {item.title}
                  </h4>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================== */}
      {/* ULTRA DEVELOPED ARTICLE MODAL (PRESSE ARTICLE LAYOUT)          */}
      {/* ============================================================== */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl border border-white/15 max-w-3xl w-full p-6 sm:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto bg-[#0D0E15]">
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Main Header Image / Video Banner */}
            <div className="relative h-72 w-full rounded-2xl overflow-hidden border border-white/10">
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#0D0E15] via-transparent to-black/40" />

              {selectedArticle.videoUrl && (
                <button
                  onClick={() => setActiveMedia({ type: 'VIDEO', url: selectedArticle.videoUrl!, title: selectedArticle.title })}
                  className="absolute inset-0 flex items-center justify-center group"
                >
                  <div className="w-16 h-16 rounded-full bg-[#B91C1C] text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 fill-current ml-1" />
                  </div>
                </button>
              )}

              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full bg-[#B91C1C] text-white text-xs font-extrabold">
                  {selectedArticle.category}
                </span>
              </div>
            </div>

            {/* Article Header Info */}
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {selectedArticle.title}
              </h2>

              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  {selectedArticle.authorAvatar && (
                    <img src={selectedArticle.authorAvatar} alt={selectedArticle.author} className="w-9 h-9 rounded-full object-cover border border-[#D97706]" />
                  )}
                  <div>
                    <span className="font-extrabold text-white block">{selectedArticle.author}</span>
                    <span className="text-[10px] text-slate-400">Rédaction Officielle FIRE STONE</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-400">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#D97706]" /> {selectedArticle.date}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> {selectedArticle.readTime || '5 min'}</span>
                  <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-slate-400" /> {selectedArticle.views} vues</span>
                </div>
              </div>

              {/* Chapeau / Résumé En avant */}
              <div className="p-4 rounded-2xl bg-[#B91C1C]/15 border-l-4 border-[#B91C1C] text-sm text-slate-200 font-medium leading-relaxed italic">
                "{selectedArticle.summary}"
              </div>

              {/* Structured Article Sections */}
              <div className="space-y-6 pt-2">
                {selectedArticle.sections ? (
                  selectedArticle.sections.map((sec, idx) => (
                    <div key={idx} className="space-y-2">
                      {sec.heading && (
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                          {sec.heading}
                        </h3>
                      )}
                      <p className="text-sm text-slate-300 leading-relaxed font-normal">
                        {sec.body}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {selectedArticle.content}
                  </p>
                )}
              </div>

              {/* Related Gallery Photos in Article */}
              {selectedArticle.galleryImages && selectedArticle.galleryImages.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <h4 className="text-xs font-bold text-[#D97706] uppercase tracking-wider">
                    📸 Galerie Photos du Reportage
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedArticle.galleryImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveMedia({ type: 'IMAGE', url: imgUrl, title: `${selectedArticle.title} - Photo ${idx + 1}` })}
                        className="h-28 rounded-xl overflow-hidden border border-white/10 cursor-pointer group relative"
                      >
                        <img src={imgUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedArticle.tags && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                  {selectedArticle.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full bg-white/5 text-slate-300 text-xs font-bold border border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* FULLSCREEN MEDIA LIGHTBOX (PHOTOS & VIDEOS)                    */}
      {/* ============================================================== */}
      {activeMedia && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <button
            onClick={() => setActiveMedia(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-5xl w-full space-y-4 text-center">
            <div className="text-white text-base font-extrabold">{activeMedia.title}</div>

            {activeMedia.type === 'VIDEO' ? (
              <div className="relative aspect-video w-full rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-black">
                <iframe
                  src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1"
                  title={activeMedia.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex justify-center">
                <img
                  src={activeMedia.url}
                  alt={activeMedia.title}
                  className="max-h-[80vh] max-w-[90vw] object-contain rounded-3xl border border-white/20 shadow-2xl"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODALE DE SIGNALEMENT DE CONTENU                               */}
      {/* ============================================================== */}
      {reportingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-white/20 p-6 space-y-4 shadow-2xl bg-[#090A0F]">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Flag className="w-4 h-4 text-red-400" /> Signaler cette publication
              </h4>
              <button onClick={() => setReportingPost(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center space-y-2">
                <p>{reportSuccess}</p>
                <button
                  onClick={() => setReportingPost(null)}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-2.5 rounded-xl bg-white/5 text-slate-300 text-[11px] line-clamp-2 italic border border-white/5">
                  « {reportingPost.content} »
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Motif du signalement</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none"
                  >
                    <option value="SPAM">Spam ou publicité abusive</option>
                    <option value="HARASSMENT">Harcèlement ou intimidation</option>
                    <option value="HATE_SPEECH">Propos haineux ou injurieux</option>
                    <option value="VIOLENCE">Violence ou incitation</option>
                    <option value="OTHER">Autre infraction</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Précisions (facultatif)</label>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Expliquez brièvement le problème..."
                    maxLength={500}
                    className="w-full h-20 px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs resize-none focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setReportingPost(null)}
                    type="button"
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={async () => {
                      setReportSending(true);
                      try {
                        const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
                        const token = session?.token;
                        const res = await fetch(apiUrl('/reports'), {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                          },
                          body: JSON.stringify({
                            targetType: 'POST',
                            targetId: reportingPost.id,
                            reason: reportReason,
                            details: reportDetails,
                          }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Erreur signalement');
                        setReportSuccess('Merci. Votre signalement a été transmis à l’équipe de modération.');
                      } catch (err) {
                        alert(err instanceof Error ? err.message : 'Erreur lors de l’envoi');
                      } finally {
                        setReportSending(false);
                      }
                    }}
                    disabled={reportSending}
                    type="button"
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black disabled:opacity-50"
                  >
                    {reportSending ? 'Envoi...' : 'Transmettre le signalement'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
