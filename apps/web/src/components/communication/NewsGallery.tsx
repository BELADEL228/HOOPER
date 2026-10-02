import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Search,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  MessageSquare,
  Send,
  Heart,
  Bookmark,
  Share2,
  TrendingUp,
  Zap,
  Star,
  Filter,
  PenLine,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface GalleryMediaItem {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  title: string;
  category: string;
  videoUrl?: string;
  date?: string;
}

type Tab = 'NEWS' | 'GALLERY' | 'SOCIAL_FEED';

const ARTICLE_CATEGORIES = ['Tout', 'ACTUALITÉ', 'MATCH', 'FORMATION', 'CLUB'];
const CAT_COLORS: Record<string, string> = {
  ACTUALITÉ: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  MATCH: 'bg-red-500/20 text-red-300 border-red-500/30',
  FORMATION: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  CLUB: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

// ── Mock articles (shown when backend returns nothing) ─────────────────────────

const MOCK_NEWS: NewsArticle[] = [
  {
    id: 'n1',
    title: 'HOOPERS écrase les Panthers 89-67 : une démonstration collective',
    category: 'MATCH',
    date: '28 septembre 2026',
    author: 'Rédaction FIRE STONE',
    image: 'https://images.unsplash.com/photo-1546519638405-a9551b521d9a?w=800&q=80',
    summary: 'Dans une salle comble, nos joueurs ont livré une masterclass offensive avec 12 passes décisives et un taux à 3pts de 47%. Un match à marquer d\'une pierre blanche.',
    content: 'Le HOOPERS Basketball Club a livré hier soir une performance remarquable face aux Panthers de Kpalimé...',
    readTime: '4 min',
    tags: ['Match', 'Victoire', 'Championnat'],
    views: 847,
    isFeatured: true,
  },
  {
    id: 'n2',
    title: 'Recrutement : Kofi Mensah signe pour 2 saisons',
    category: 'CLUB',
    date: '25 septembre 2026',
    author: 'Direction Sportive',
    image: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800&q=80',
    summary: 'Le meneur de 22 ans en provenance du Ghana Basketball League rejoint notre effectif avec des statistiques de 18.4 pts et 7.2 assists par match.',
    content: 'Kofi Mensah, nouvelle acquisition phare du HOOPERS...',
    readTime: '3 min',
    tags: ['Recrutement', 'Transfert'],
    views: 612,
    isFeatured: false,
  },
  {
    id: 'n3',
    title: 'Stage intensif pré-tournoi : 4 jours pour affûter la défense',
    category: 'FORMATION',
    date: '20 septembre 2026',
    author: 'Coach David Vance',
    image: 'https://images.unsplash.com/photo-1607627000458-210e8d2bdb1d?w=800&q=80',
    summary: 'Le staff a organisé un stage de 4 jours centré sur la défense en zone 2-3 et la transition rapide. Retour sur les grandes lignes tactiques.',
    content: 'Pendant 4 jours intensifs, le groupe a travaillé...',
    readTime: '5 min',
    tags: ['Formation', 'Tactique', 'Stage'],
    views: 389,
    isFeatured: false,
  },
  {
    id: 'n4',
    title: 'Tournoi Régional : HOOPERS champion de poule avec 100% de victoires',
    category: 'ACTUALITÉ',
    date: '15 septembre 2026',
    author: 'Rédaction FIRE STONE',
    image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80',
    summary: '4 victoires, 4 matchs : notre équipe première valide sa place en quart de finale du tournoi régional avec une domination sans faille.',
    content: 'Un sans-faute impressionnant pour le HOOPERS...',
    readTime: '3 min',
    tags: ['Tournoi', 'Résultats'],
    views: 521,
    isFeatured: false,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const getEmbedUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      return v ? `https://www.youtube-nocookie.com/embed/${v}?autoplay=1` : null;
    }
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.slice(1);
      return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1` : null;
    }
  } catch { return null; }
  return null;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'à l\'instant';
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  return `il y a ${Math.floor(hrs / 24)}j`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CategoryBadge({ cat }: { cat: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${CAT_COLORS[cat] ?? 'bg-white/10 text-slate-300 border-white/20'}`}>
      {cat}
    </span>
  );
}

function ReadingProgress({ articleRef }: { articleRef: React.RefObject<HTMLDivElement | null> }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const pct = Math.min(100, (scrollTop / (scrollHeight - clientHeight)) * 100);
      setProgress(isNaN(pct) ? 0 : pct);
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [articleRef]);
  return (
    <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-[#B91C1C] to-[#D97706] transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export const NewsGallery: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('NEWS');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [postContent, setPostContent] = useState('');
  const [postError, setPostError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tout');
  const [likedArticles, setLikedArticles] = useState<Set<string>>(new Set());
  const [savedArticles, setSavedArticles] = useState<Set<string>>(new Set());

  // Report state
  const [reportingPost, setReportingPost] = useState<SocialPost | null>(null);
  const [reportReason, setReportReason] = useState('SPAM');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [reportSending, setReportSending] = useState(false);

  // Lightbox state
  const [activeMedia, setActiveMedia] = useState<{ type: 'IMAGE' | 'VIDEO'; url: string; title: string; idx: number } | null>(null);

  const articleModalRef = useRef<HTMLDivElement>(null);

  // ── Data fetching ──
  useEffect(() => {
    setLoadingNews(true);
    fetch(apiUrl('/posts'))
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const posts = await res.json() as Array<{
          id: string; content: string; mediaUrl: string | null; createdAt: string;
          author: { name: string; avatarUrl: string | null; role: string };
          _count: { likes: number; comments: number };
        }>;
        setSocialPosts(posts.map(p => ({
          id: p.id,
          authorName: p.author.name,
          authorAvatar: p.author.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.author.name)}&background=B91C1C&color=fff`,
          authorRole: p.author.role as SocialPost['authorRole'],
          timestamp: timeAgo(p.createdAt),
          content: p.content,
          mediaUrl: p.mediaUrl || undefined,
          likesCount: p._count.likes,
          comments: [],
          reactions: [],
        })));
        const newsItems: NewsArticle[] = posts.filter(p => p.mediaUrl).map(p => ({
          id: p.id,
          title: p.content.split('\n')[0].slice(0, 100),
          category: 'ACTUALITÉ',
          date: new Date(p.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
          author: p.author.name,
          authorAvatar: p.author.avatarUrl || undefined,
          image: p.mediaUrl!,
          summary: p.content.slice(0, 200),
          content: p.content,
          readTime: `${Math.max(1, Math.ceil(p.content.length / 1000))} min`,
          tags: [],
          views: p._count.likes,
          isFeatured: false,
        }));
        setNews(newsItems.length > 0 ? newsItems : MOCK_NEWS);
      })
      .catch(() => setNews(MOCK_NEWS))
      .finally(() => setLoadingNews(false));
  }, []);

  // ── Derived ──
  const filteredNews = useMemo(() =>
    news.filter(a => {
      const matchCat = categoryFilter === 'Tout' || a.category === categoryFilter;
      const matchSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.author.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    }),
    [news, categoryFilter, searchQuery]);

  const featuredArticle = filteredNews.find(a => a.isFeatured) ?? filteredNews[0];
  const restArticles = filteredNews.filter(a => a.id !== featuredArticle?.id);

  const galleryItems: GalleryMediaItem[] = useMemo(() =>
    socialPosts.filter(p => Boolean(p.mediaUrl)).map(p => {
      const url = p.mediaUrl!;
      const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(url) || url.includes('youtube');
      return {
        id: p.id,
        type: isVideo ? 'VIDEO' : 'IMAGE',
        url,
        videoUrl: isVideo ? url : undefined,
        title: p.content?.slice(0, 80) || 'Moment fort du club',
        category: p.authorRole === 'COACH' ? 'Staff' : p.authorRole === 'CLUB_ADMIN' ? 'Club' : 'Communauté',
        date: p.timestamp,
      };
    }),
    [socialPosts]);

  // Lightbox navigation
  const allMediaItems = galleryItems;
  const navigateMedia = (dir: 1 | -1) => {
    if (!activeMedia) return;
    const newIdx = (activeMedia.idx + dir + allMediaItems.length) % allMediaItems.length;
    const item = allMediaItems[newIdx];
    setActiveMedia({ type: item.type, url: item.url, title: item.title, idx: newIdx });
  };

  // Keyboard nav in lightbox
  useEffect(() => {
    if (!activeMedia) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigateMedia(-1);
      if (e.key === 'ArrowRight') navigateMedia(1);
      if (e.key === 'Escape') setActiveMedia(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeMedia]);

  const publishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (!session?.token) { setPostError('Connectez-vous pour publier.'); return; }
    if (!postContent.trim()) return;
    setPublishing(true); setPostError(null);
    try {
      const res = await fetch(apiUrl('/posts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ content: postContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Publication impossible.');
      const author = data.post.author;
      const published: SocialPost = {
        id: data.post.id, authorName: author.name,
        authorAvatar: author.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=B91C1C&color=fff`,
        authorRole: author.role as SocialPost['authorRole'],
        timestamp: 'à l\'instant', content: data.post.content,
        likesCount: 0, comments: [], reactions: [],
      };
      setSocialPosts(c => [published, ...c]);
      setPostContent('');
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Publication impossible.');
    } finally { setPublishing(false); }
  };

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'NEWS', label: 'Articles', icon: <Newspaper className="w-3.5 h-3.5" /> },
    { key: 'SOCIAL_FEED', label: 'Fil du Staff', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { key: 'GALLERY', label: 'Galerie', icon: <ImageIcon className="w-3.5 h-3.5" /> },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-16">

      {/* ── Header ── */}
      <div className="rounded-2xl bg-[#0C0F1A] border border-white/10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Newspaper className="w-3.5 h-3.5" />
              Médias officiels
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-none tracking-tight">Actualités & Médias</h1>
            <p className="text-slate-400 text-sm max-w-lg">
              Articles, fil du staff, galerie photos & vidéos de la franchise HOOPERS.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { icon: <TrendingUp className="w-4 h-4 text-[#D97706]" />, value: news.length, label: 'Articles' },
              { icon: <Zap className="w-4 h-4 text-violet-400" />, value: socialPosts.length, label: 'Posts' },
              { icon: <ImageIcon className="w-4 h-4 text-sky-400" />, value: galleryItems.length, label: 'Médias' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
                {s.icon}
                <div>
                  <div className="text-sm font-black text-white">{s.value}</div>
                  <div className="text-[10px] text-slate-400">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="relative mt-6 flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 self-start w-fit">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-[#B91C1C] to-[#881337] text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          TAB : ARTICLES / NEWS
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'NEWS' && (
        <div className="space-y-6">
          {/* Search & filter bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher un article, un auteur…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#B91C1C]/50 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              {ARTICLE_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    categoryFilter === cat
                      ? 'bg-[#D97706] text-white border-[#D97706] shadow-lg shadow-amber-900/30'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {loadingNews && (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="rounded-2xl overflow-hidden h-72 animate-pulse bg-white/5 border border-white/10" />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loadingNews && filteredNews.length === 0 && (
            <div className="py-20 text-center rounded-2xl bg-white/5 border border-white/10">
              <Newspaper className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-bold">Aucun article trouvé</p>
              <p className="text-slate-600 text-sm mt-1">Essayez un autre filtre ou terme de recherche</p>
            </div>
          )}

          {/* Featured Hero Article */}
          {!loadingNews && featuredArticle && (
            <div
              onClick={() => setSelectedArticle(featuredArticle)}
              className="group cursor-pointer relative overflow-hidden rounded-2xl border border-white/10 hover:border-white/25 transition-all duration-300 hover:shadow-2xl hover:shadow-black/40"
            >
              <div className="relative h-72 sm:h-96 w-full overflow-hidden">
                <img
                  src={featuredArticle.image}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090A0F] via-[#090A0F]/60 to-transparent" />

                {/* Featured badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D97706] text-black text-xs font-black">
                    <Star className="w-3 h-3" /> À LA UNE
                  </span>
                  <CategoryBadge cat={featuredArticle.category} />
                </div>

                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[#D97706]" />{featuredArticle.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{featuredArticle.readTime}</span>
                    <span className="flex items-center gap-1 ml-auto"><Eye className="w-3 h-3" />{featuredArticle.views} vues</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight group-hover:text-[#D97706] transition-colors">
                    {featuredArticle.title}
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed line-clamp-2">{featuredArticle.summary}</p>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      {featuredArticle.authorAvatar && (
                        <img src={featuredArticle.authorAvatar} alt={featuredArticle.author} className="w-6 h-6 rounded-full object-cover border border-white/20" />
                      )}
                      <span className="text-xs text-slate-300 font-semibold">{featuredArticle.author}</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-[#B91C1C] group-hover:gap-2 transition-all">
                      Lire l'article <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Article grid */}
          {!loadingNews && restArticles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {restArticles.map(article => (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="group cursor-pointer bg-[#0D0F1A] rounded-2xl border border-white/10 hover:border-white/25 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30"
                >
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F1A] via-transparent to-black/20" />
                    <div className="absolute top-3 left-3">
                      <CategoryBadge cat={article.category} />
                    </div>
                    {article.videoUrl && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-[#B91C1C]/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-current text-white ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1 space-y-3">
                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[#D97706]" />{article.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTime}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-white leading-snug group-hover:text-[#D97706] transition-colors line-clamp-3">
                      {article.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{article.summary}</p>

                    {/* Footer */}
                    <div className="pt-3 mt-auto border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {article.authorAvatar && (
                          <img src={article.authorAvatar} alt={article.author} className="w-5 h-5 rounded-full object-cover border border-white/20" />
                        )}
                        <span className="text-xs text-slate-400 font-semibold truncate max-w-[100px]">{article.author}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500">
                        <button
                          onClick={e => { e.stopPropagation(); setLikedArticles(s => { const n = new Set(s); n.has(article.id) ? n.delete(article.id) : n.add(article.id); return n; }); }}
                          className={`flex items-center gap-1 hover:text-red-400 transition-colors ${likedArticles.has(article.id) ? 'text-red-400' : ''}`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${likedArticles.has(article.id) ? 'fill-current' : ''}`} />
                          {article.views + (likedArticles.has(article.id) ? 1 : 0)}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setSavedArticles(s => { const n = new Set(s); n.has(article.id) ? n.delete(article.id) : n.add(article.id); return n; }); }}
                          className={`flex items-center gap-1 hover:text-amber-400 transition-colors ${savedArticles.has(article.id) ? 'text-amber-400' : ''}`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${savedArticles.has(article.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB : SOCIAL FEED
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'SOCIAL_FEED' && (
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Compose */}
          <form
            onSubmit={publishPost}
            className="bg-[#0D0F1A] rounded-2xl border border-[#D97706]/25 p-5 space-y-3"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-[#D97706]">
              <PenLine className="w-4 h-4" /> Nouvelle publication
            </div>
            <textarea
              value={postContent}
              onChange={e => setPostContent(e.target.value)}
              placeholder="Partagez une actualité, un résultat, une annonce du club…"
              maxLength={2000}
              className="w-full min-h-[100px] rounded-xl bg-[#090A0F] border border-white/10 p-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-[#D97706]/40 transition-colors"
            />
            {postError && <p className="text-xs text-amber-300">{postError}</p>}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500">{postContent.length}/2000</span>
              <button
                type="submit"
                disabled={publishing || !postContent.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#B91C1C] to-[#881337] text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                <Send className="w-3.5 h-3.5" />
                {publishing ? 'Publication…' : 'Publier'}
              </button>
            </div>
          </form>

          {/* Info banner */}
          <div className="bg-[#0D0F1A] p-3.5 rounded-xl border border-white/10 text-xs text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D97706] shrink-0" />
            Les publications du Coach & Staff sur l'accueil apparaissent également ici.
          </div>

          {/* Posts */}
          {socialPosts.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-white/5 border border-white/10">
              <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-semibold">Aucune publication pour l'instant</p>
            </div>
          ) : (
            socialPosts.map(post => (
              <div key={post.id} className="bg-[#0D0F1A] rounded-2xl border border-white/10 overflow-hidden">
                {/* Post header */}
                <div className="flex items-center justify-between p-4 pb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      className="w-10 h-10 rounded-xl object-cover border border-[#D97706]/40"
                    />
                    <div>
                      <div className="font-extrabold text-white text-sm flex items-center gap-2">
                        {post.authorName}
                        {post.authorBadge && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#B91C1C]/25 text-red-300 text-[9px] font-bold">{post.authorBadge}</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">{post.timestamp}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setReportingPost(post); setReportSuccess(null); setReportDetails(''); }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                    title="Signaler"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-4 pb-3">
                  <p className="text-sm text-slate-200 leading-relaxed">{post.content}</p>
                </div>

                {/* Media */}
                {post.mediaUrl && (
                  <div
                    onClick={() => setActiveMedia({ type: 'IMAGE', url: post.mediaUrl!, title: post.content.slice(0, 60), idx: 0 })}
                    className="cursor-pointer overflow-hidden max-h-72 border-t border-white/5"
                  >
                    <img src={post.mediaUrl} alt="Media" className="w-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 px-4 py-3 border-t border-white/5 text-xs text-slate-500">
                  <button className="flex items-center gap-1.5 hover:text-red-400 transition-colors">
                    <Heart className="w-3.5 h-3.5" /> {post.likesCount}
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-sky-400 transition-colors">
                    <MessageSquare className="w-3.5 h-3.5" /> {post.comments?.length ?? 0}
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors ml-auto">
                    <Share2 className="w-3.5 h-3.5" /> Partager
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB : GALLERY
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'GALLERY' && (
        galleryItems.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto">
              <ImageIcon className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-base font-bold text-white">Galerie en cours de constitution</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Les photos et vidéos publiées par le staff et les joueurs apparaîtront ici automatiquement.
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {galleryItems.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setActiveMedia({ type: item.type, url: item.url, title: item.title, idx })}
                className="break-inside-avoid group cursor-pointer rounded-2xl overflow-hidden border border-white/10 hover:border-white/25 relative transition-all duration-300 hover:shadow-xl hover:shadow-black/40"
              >
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-[#B91C1C] text-white text-[10px] font-bold">
                      {item.category}
                    </span>
                    <span className="w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white">
                      {item.type === 'VIDEO' ? <Play className="w-3.5 h-3.5 fill-current text-[#D97706]" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                  <div>
                    {item.date && <div className="text-[10px] text-slate-400 mb-1">{item.date}</div>}
                    <h4 className="text-xs font-extrabold text-white line-clamp-2">{item.title}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ════════════════════════════════════════════════════════
          MODAL — ARTICLE READER
      ════════════════════════════════════════════════════════ */}
      {selectedArticle && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            ref={articleModalRef}
            className="bg-[#0D0F1A] rounded-3xl border border-white/15 max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Progress bar */}
            <div className="sticky top-0 z-10 rounded-t-3xl bg-[#0D0F1A] px-6 pt-4 pb-0">
              <div className="flex items-center justify-between mb-3">
                <CategoryBadge cat={selectedArticle.category} />
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ReadingProgress articleRef={articleModalRef} />
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Hero image */}
              <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden border border-white/10">
                <img src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F1A] via-[#0D0F1A]/30 to-transparent" />
                {selectedArticle.videoUrl && (
                  <button
                    onClick={() => setActiveMedia({ type: 'VIDEO', url: selectedArticle.videoUrl!, title: selectedArticle.title, idx: 0 })}
                    className="absolute inset-0 flex items-center justify-center group"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#B91C1C] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                      <Play className="w-7 h-7 fill-current text-white ml-1" />
                    </div>
                  </button>
                )}
              </div>

              {/* Article meta */}
              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">{selectedArticle.title}</h2>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10 text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    {selectedArticle.authorAvatar && (
                      <img src={selectedArticle.authorAvatar} alt={selectedArticle.author} className="w-8 h-8 rounded-full object-cover border border-[#D97706]/40" />
                    )}
                    <div>
                      <span className="font-extrabold text-white block">{selectedArticle.author}</span>
                      <span className="text-[10px] text-slate-500">Rédaction FIRE STONE</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[#D97706]" />{selectedArticle.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{selectedArticle.readTime}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{selectedArticle.views}</span>
                  </div>
                </div>

                {/* Summary chapeau */}
                <div className="p-4 rounded-2xl bg-[#B91C1C]/12 border-l-4 border-[#B91C1C] text-sm text-slate-200 leading-relaxed italic">
                  "{selectedArticle.summary}"
                </div>

                {/* Body */}
                <div className="space-y-5 pt-2">
                  {selectedArticle.sections ? (
                    selectedArticle.sections.map((sec, i) => (
                      <div key={i} className="space-y-2">
                        {sec.heading && (
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#D97706] shrink-0" />
                            {sec.heading}
                          </h3>
                        )}
                        <p className="text-sm text-slate-300 leading-relaxed">{sec.body}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-300 leading-relaxed">{selectedArticle.content}</p>
                  )}
                </div>

                {/* Gallery in article */}
                {selectedArticle.galleryImages && selectedArticle.galleryImages.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <h4 className="text-xs font-bold text-[#D97706] uppercase tracking-wider">📸 Galerie Photos</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedArticle.galleryImages.map((imgUrl, i) => (
                        <div
                          key={i}
                          onClick={() => setActiveMedia({ type: 'IMAGE', url: imgUrl, title: `${selectedArticle.title} — Photo ${i + 1}`, idx: i })}
                          className="h-28 rounded-xl overflow-hidden border border-white/10 cursor-pointer group relative"
                        >
                          <img src={imgUrl} alt={`Photo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                    {selectedArticle.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-white/5 text-slate-300 text-xs font-bold border border-white/10">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => setLikedArticles(s => { const n = new Set(s); n.has(selectedArticle.id) ? n.delete(selectedArticle.id) : n.add(selectedArticle.id); return n; })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${likedArticles.has(selectedArticle.id) ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                  >
                    <Heart className={`w-4 h-4 ${likedArticles.has(selectedArticle.id) ? 'fill-current' : ''}`} />
                    J'aime
                  </button>
                  <button
                    onClick={() => setSavedArticles(s => { const n = new Set(s); n.has(selectedArticle.id) ? n.delete(selectedArticle.id) : n.add(selectedArticle.id); return n; })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${savedArticles.has(selectedArticle.id) ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                  >
                    <Bookmark className={`w-4 h-4 ${savedArticles.has(selectedArticle.id) ? 'fill-current' : ''}`} />
                    Sauvegarder
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white text-xs font-bold transition-all ml-auto">
                    <Share2 className="w-4 h-4" /> Partager
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          LIGHTBOX — FULLSCREEN MEDIA
      ════════════════════════════════════════════════════════ */}
      {activeMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/97 backdrop-blur-2xl flex items-center justify-center p-4"
          onClick={() => setActiveMedia(null)}
        >
          {/* Close */}
          <button
            onClick={() => setActiveMedia(null)}
            className="absolute top-5 right-5 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Nav arrows */}
          {allMediaItems.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); navigateMedia(-1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); navigateMedia(1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div className="max-w-5xl w-full space-y-4 text-center" onClick={e => e.stopPropagation()}>
            <div className="text-white text-sm font-extrabold">{activeMedia.title}</div>
            {activeMedia.type === 'VIDEO' ? (
              <div className="relative aspect-video w-full rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-black">
                {getEmbedUrl(activeMedia.url) ? (
                  <iframe
                    src={getEmbedUrl(activeMedia.url)!}
                    title={activeMedia.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={activeMedia.url} controls autoPlay className="w-full h-full object-contain" />
                )}
              </div>
            ) : (
              <div className="flex justify-center">
                <img
                  src={activeMedia.url}
                  alt={activeMedia.title}
                  className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl border border-white/20 shadow-2xl"
                />
              </div>
            )}
            {allMediaItems.length > 1 && (
              <div className="text-xs text-slate-500">
                {activeMedia.idx + 1} / {allMediaItems.length} — Utilisez ← → pour naviguer
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          MODAL — REPORT
      ════════════════════════════════════════════════════════ */}
      {reportingPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setReportingPost(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/20 bg-[#090A0F] p-6 space-y-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Flag className="w-4 h-4 text-red-400" /> Signaler cette publication
              </h4>
              <button onClick={() => setReportingPost(null)} className="text-slate-400 hover:text-white p-1 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center space-y-2">
                <p>{reportSuccess}</p>
                <button onClick={() => setReportingPost(null)} className="px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black">
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
                    onChange={e => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none"
                  >
                    <option value="SPAM">Spam ou publicité abusive</option>
                    <option value="HARASSMENT">Harcèlement ou intimidation</option>
                    <option value="HATE_SPEECH">Propos haineux</option>
                    <option value="VIOLENCE">Violence ou incitation</option>
                    <option value="OTHER">Autre infraction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Précisions (facultatif)</label>
                  <textarea
                    value={reportDetails}
                    onChange={e => setReportDetails(e.target.value)}
                    placeholder="Expliquez brièvement le problème…"
                    maxLength={500}
                    className="w-full h-20 px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs resize-none focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setReportingPost(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    disabled={reportSending}
                    onClick={async () => {
                      setReportSending(true);
                      try {
                        const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
                        const token = session?.token;
                        const res = await fetch(apiUrl('/reports'), {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                          body: JSON.stringify({ targetType: 'POST', targetId: reportingPost.id, reason: reportReason, details: reportDetails }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Erreur');
                        setReportSuccess('Merci. Votre signalement a été transmis à l\'équipe de modération.');
                      } catch (err) {
                        alert(err instanceof Error ? err.message : 'Erreur lors de l\'envoi');
                      } finally { setReportSending(false); }
                    }}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black disabled:opacity-50 transition-colors"
                  >
                    {reportSending ? 'Envoi…' : 'Transmettre'}
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
