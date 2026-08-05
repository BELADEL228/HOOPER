import React, { useState } from 'react';
import { mockNews, mockSocialPosts } from '../data/mockData';
import type { NewsArticle } from '../types';
import {
  Newspaper,
  Eye,
  Calendar,
  ArrowRight,
  X,
  Play,
  Clock,
  Sparkles,
  Maximize2
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

  // Lightbox Media State (Image or Video preview like MatchCenter)
  const [activeMedia, setActiveMedia] = useState<{ type: 'IMAGE' | 'VIDEO'; url: string; title: string } | null>(null);

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
      url: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=800&auto=format&fit=crop&q=80',
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
                ? 'bg-gradient-to-r from-[#B91C1C] to-[#881337] text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            📰 Articles Détaillés
          </button>
          <button
            onClick={() => setActiveTab('SOCIAL_FEED')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'SOCIAL_FEED'
                ? 'bg-gradient-to-r from-[#B91C1C] to-[#881337] text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            💬 Posts Staff (Fil Flash)
          </button>
          <button
            onClick={() => setActiveTab('GALLERY')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'GALLERY'
                ? 'bg-gradient-to-r from-[#B91C1C] to-[#881337] text-white shadow-md'
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
          {mockNews.map((article) => (
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0C13] via-transparent to-black/40" />

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
          ))}
        </div>
      )}

      {/* 2. SOCIAL FEED FROM STAFF & COACHES (Synchronized with Homepage) */}
      {activeTab === 'SOCIAL_FEED' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-[#0D0E15] p-4 rounded-2xl border border-white/10 text-xs text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D97706] shrink-0" />
            <span>
              Toutes les publications faites par le Coach & le Staff sur l'accueil apparaissent également ici. Les publications de l'accueil sont éphémères (24h).
            </span>
          </div>

          {mockSocialPosts.map((post) => (
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-5 flex flex-col justify-between">
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
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0E15] via-transparent to-black/40" />

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

    </div>
  );
};
