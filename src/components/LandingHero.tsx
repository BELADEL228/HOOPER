import React, { useState, useEffect } from 'react';
import type { UserRole, SocialPost } from '../types';
import {
  Flame,
  Trophy,
  Calendar,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Award,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Send,
  Sparkles,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { mockMatches, mockTeamStats, mockPlayers, mockNews, mockSocialPosts, mockTickerAnnouncements } from '../data/mockData';

interface LandingHeroProps {
  currentRole?: UserRole;
  onNavigate: (tab: string) => void;
  onOpenAuth: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ currentRole = 'SUPER_ADMIN', onNavigate, onOpenAuth }) => {
  const nextMatch = mockMatches.find((m) => m.status === 'UPCOMING');
  const lastMatch = mockMatches.find((m) => m.status === 'FINISHED');

  // Dynamic Ticker Carousel State
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % mockTickerAnnouncements.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Real-Time Countdown Timer State
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetDate = nextMatch ? new Date(`${nextMatch.date}T${nextMatch.time}:00`).getTime() : Date.now() + 864000000;

    const updateCountdown = () => {
      const now = Date.now();
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextMatch]);

  // Social Posts State (Filter 24-hour ephemeral posts for Homepage)
  const twentyFourHoursMs = 24 * 3600 * 1000;
  const [posts, setPosts] = useState<SocialPost[]>(() => {
    return mockSocialPosts.filter((p) => {
      if (!p.createdAtMs) return true;
      return Date.now() - p.createdAtMs < twentyFourHoursMs;
    });
  });

  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState('');
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<{ [postId: string]: string }>({});

  // Real-time Notification Toast State
  const [notifToast, setNotifToast] = useState<{ message: string; author: string } | null>(null);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const author = currentRole === 'COACH' ? 'David Vance (Head Coach)' : 'Administration FIRE STONE';
    const newPost: SocialPost = {
      id: `post_${Date.now()}`,
      authorName: author,
      authorAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&auto=format&fit=crop&q=80',
      authorRole: currentRole,
      authorBadge: currentRole === 'COACH' ? 'Head Coach Officiel' : 'Super Admin Club',
      timestamp: 'À l\'instant (Éphémère 24h)',
      createdAtMs: Date.now(),
      content: newPostContent,
      mediaUrl: newPostMedia.trim() ? newPostMedia.trim() : undefined,
      mediaType: 'image',
      tags: ['#FireStoneOfficial', '#BasketballPro'],
      likesCount: 1,
      isLiked: true,
      reactions: [
        { emoji: '🔥', count: 1, userReacted: true },
        { emoji: '💪', count: 0, userReacted: false },
        { emoji: '🧠', count: 0, userReacted: false },
      ],
      comments: []
    };

    setPosts([newPost, ...posts]);
    mockSocialPosts.unshift(newPost); // Synchronize with Actus tab
    setNewPostContent('');
    setNewPostMedia('');

    // Trigger Real-Time Notification Toast
    setNotifToast({
      message: `Nouvelle annonce publiée par ${author} !`,
      author
    });

    setTimeout(() => {
      setNotifToast(null);
    }, 4500);
  };

  const handleReaction = (postId: string, emojiStr: string) => {
    setPosts(posts.map(p => {
      if (p.id !== postId) return p;
      const updatedReactions = p.reactions.map(r => {
        if (r.emoji === emojiStr) {
          const userReacted = !r.userReacted;
          return {
            ...r,
            count: userReacted ? r.count + 1 : Math.max(0, r.count - 1),
            userReacted
          };
        }
        return r;
      });
      return { ...p, reactions: updatedReactions };
    }));
  };

  const handleAddComment = (postId: string) => {
    const text = commentInput[postId];
    if (!text || !text.trim()) return;

    setPosts(posts.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        comments: [
          ...p.comments,
          {
            id: `c_${Date.now()}`,
            authorName: 'Session Utilisateur',
            authorAvatar: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150&auto=format&fit=crop&q=80',
            authorRole: currentRole,
            text: text.trim(),
            timestamp: 'À l\'instant'
          }
        ]
      };
    }));

    setCommentInput({ ...commentInput, [postId]: '' });
  };

  const isCoachOrAdmin = ['SUPER_ADMIN', 'ADMIN', 'COACH'].includes(currentRole);
  const currentTicker = mockTickerAnnouncements[tickerIndex];

  return (
    <div className="space-y-12 pb-12 relative">

      {/* Real-Time Publication Notification Toast */}
      {notifToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#0D0E15] border-2 border-[#B91C1C] rounded-2xl p-4 shadow-2xl shadow-red-950/80 flex items-center gap-3 animate-bounce max-w-sm">
          <div className="w-10 h-10 rounded-xl bg-[#B91C1C] text-white flex items-center justify-center font-bold shrink-0">
            🔔
          </div>
          <div>
            <div className="text-xs font-black text-white">Annonce Flash du Staff !</div>
            <div className="text-[11px] text-slate-300 line-clamp-2">{notifToast.message}</div>
          </div>
        </div>
      )}

      {/* 1. Dynamic Announcements Ticker Carousel */}
      <div className="bg-gradient-to-r from-red-950/80 via-[#0D0E15] to-[#121621] border border-white/10 rounded-2xl p-3 px-4 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="px-2.5 py-1 rounded-lg bg-[#B91C1C] text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shrink-0 animate-pulse">
            <Volume2 className="w-3.5 h-3.5" /> Live Annonce
          </div>
          <div className="truncate flex items-center gap-2 text-xs">
            <span className="font-extrabold text-[#D97706] uppercase tracking-wide">{currentTicker.badge}:</span>
            <span className="text-slate-200 font-medium truncate">{currentTicker.text}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setTickerIndex((prev) => (prev - 1 + mockTickerAnnouncements.length) % mockTickerAnnouncements.length)}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[10px] text-slate-400 font-mono px-1">
            {tickerIndex + 1}/{mockTickerAnnouncements.length}
          </span>
          <button
            onClick={() => setTickerIndex((prev) => (prev + 1) % mockTickerAnnouncements.length)}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Hero Banner & Real-Time Match Countdown Widget */}
      <div className="relative min-h-[520px] rounded-3xl overflow-hidden glass-panel border border-white/10 flex items-center justify-center p-6 lg:p-10">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105 opacity-40"
          style={{ backgroundImage: `url('/fire_stone_hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090A0F] via-[#090A0F]/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090A0F] via-transparent to-[#090A0F]/50" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full max-w-6xl">
          
          {/* Left: Main Hero Presentation */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B91C1C]/25 border border-[#B91C1C]/40 text-red-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Flame className="w-4 h-4 animate-bounce text-[#D97706]" />
              Saison Officielle 2026-2027
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              L'énergie du <span className="text-gradient-fire">FEU</span>. <br />
              La solidité de la <span className="text-gradient-gold">PIERRE</span>.
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-xl font-light leading-relaxed">
              Bienvenue sur le portail officiel de **FIRE STONE**. Suivez la vie du club en direct, les publications du Head Coach et vivez chaque match en immersion.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('matchs')}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#B91C1C] to-[#881337] text-white font-bold text-sm shadow-lg shadow-red-950/40 hover:scale-105 transition-all border border-red-700/30"
              >
                <span>Prochains Matchs & Feuillets</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('stats')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl glass-panel text-white font-bold text-sm hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <Trophy className="w-4 h-4 text-[#D97706]" />
                <span>Statistiques Pro</span>
              </button>

              <button
                onClick={onOpenAuth}
                className="px-5 py-3.5 rounded-xl border border-[#D97706]/40 text-[#D97706] font-semibold text-sm hover:bg-[#D97706]/10 transition-all"
              >
                Espace Membre
              </button>
            </div>

            {/* Metrics Quick Overview */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-4 max-w-md">
              <div>
                <div className="text-2xl font-black text-white">{mockTeamStats.wins}V - {mockTeamStats.losses}D</div>
                <div className="text-xs text-slate-400 font-medium">Bilan de la Saison</div>
              </div>
              <div>
                <div className="text-2xl font-black text-gradient-fire">{mockTeamStats.avgPointsScored}</div>
                <div className="text-xs text-slate-400 font-medium">Pts / Match</div>
              </div>
              <div>
                <div className="text-2xl font-black text-gradient-gold">#1</div>
                <div className="text-xs text-slate-400 font-medium">Défense de la Ligue</div>
              </div>
            </div>
          </div>

          {/* Right: Dynamic Real-time Countdown Timer Widget */}
          <div className="lg:col-span-5">
            {nextMatch && (
              <div className="glass-panel p-6 rounded-3xl border border-white/15 shadow-2xl relative overflow-hidden space-y-5 bg-[#0D0E15]/90">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#B91C1C]/15 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#D97706] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Prochain Choc Direct
                  </span>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {nextMatch.date} à {nextMatch.time}
                  </span>
                </div>

                <div className="flex items-center justify-around py-2">
                  {/* FIRE STONE */}
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#B91C1C] to-[#D97706] p-0.5 shadow-lg shadow-red-950/40">
                      <div className="w-full h-full bg-[#090A0F] rounded-[14px] flex items-center justify-center">
                        <Flame className="w-8 h-8 text-[#B91C1C]" />
                      </div>
                    </div>
                    <div className="font-extrabold text-white text-sm">FIRE STONE</div>
                    <div className="text-[10px] text-[#D97706] uppercase font-bold">Domicile</div>
                  </div>

                  <div className="text-center">
                    <span className="text-2xl font-black text-slate-500">VS</span>
                    <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">Championship</div>
                  </div>

                  {/* OPPONENT */}
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-2xl shadow-md">
                      {nextMatch.opponentLogo}
                    </div>
                    <div className="font-extrabold text-white text-sm">{nextMatch.opponent}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Extérieur</div>
                  </div>
                </div>

                {/* REAL-TIME DYNAMIC COUNTDOWN */}
                <div className="bg-black/60 rounded-2xl p-3.5 border border-white/10 flex justify-between items-center text-center shadow-inner">
                  <div className="flex-1">
                    <div className="text-xl font-black text-white font-mono">{String(timeLeft.days).padStart(2, '0')}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">Jours</div>
                  </div>
                  <div className="text-slate-600 font-bold">:</div>
                  <div className="flex-1">
                    <div className="text-xl font-black text-white font-mono">{String(timeLeft.hours).padStart(2, '0')}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">Heures</div>
                  </div>
                  <div className="text-slate-600 font-bold">:</div>
                  <div className="flex-1">
                    <div className="text-xl font-black text-white font-mono">{String(timeLeft.minutes).padStart(2, '0')}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">Minutes</div>
                  </div>
                  <div className="text-slate-600 font-bold">:</div>
                  <div className="flex-1">
                    <div className="text-xl font-black text-[#E53E3E] font-mono animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}</div>
                    <div className="text-[9px] text-[#E53E3E] uppercase font-bold">Sec</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300 pt-1">
                  <MapPin className="w-4 h-4 text-[#B91C1C] shrink-0" />
                  <span className="truncate">{nextMatch.venue} — {nextMatch.address}</span>
                </div>

                <button
                  onClick={() => onNavigate('matchs')}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors border border-white/10 flex items-center justify-center gap-2"
                >
                  <span>Consulter le Match Center</span>
                  <ChevronRight className="w-4 h-4 text-[#D97706]" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 3. Facebook-Style Dynamic Social Feed (Publications du Coach & Staff) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Fil d'Actualité du Coach & du Club
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Publications En Direct</h2>
          </div>
          <div className="text-xs text-slate-400">
            Suivez les déclarations tactiques, photos d'entraînement et coulisses du staff.
          </div>
        </div>

        {/* Coach / Admin Publisher Form */}
        {isCoachOrAdmin && (
          <div className="glass-panel p-5 rounded-3xl border border-white/15 space-y-4 bg-[#0F111A]">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80"
                alt="Author"
                className="w-10 h-10 rounded-xl object-cover border border-[#B91C1C]"
              />
              <div>
                <div className="font-bold text-white text-sm flex items-center gap-1.5">
                  <span>Partager une mise à jour d'équipe</span>
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs text-[#D97706] font-semibold">
                  Posté en tant que : {currentRole === 'COACH' ? 'Head Coach' : 'Super Admin'}
                </span>
              </div>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Rédigez une annonce pour les joueurs et supporters (consignes tactiques, entraînement, encouragements)..."
                className="w-full bg-[#090A0F] border border-white/10 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B91C1C] min-h-[90px] resize-none"
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={newPostMedia}
                    onChange={(e) => setNewPostMedia(e.target.value)}
                    placeholder="URL d'une photo / média (ex: Unsplash)"
                    className="bg-[#090A0F] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30 w-full sm:w-64"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newPostContent.trim()}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B91C1C] to-[#881337] text-white font-bold text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publier</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List of Social Posts (Facebook Card Style) */}
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 bg-[#0A0C13]">
              
              {/* Post Author Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={post.authorAvatar}
                    alt={post.authorName}
                    className="w-11 h-11 rounded-2xl object-cover border border-[#D97706]/40 shadow-md"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">{post.authorName}</span>
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      {post.authorBadge && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                          {post.authorBadge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">{post.timestamp}</div>
                  </div>
                </div>
              </div>

              {/* Post Text Content */}
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-line">
                {post.content}
              </p>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {post.tags.map((tag, idx) => (
                    <span key={idx} className="text-xs text-[#D97706] font-semibold hover:underline cursor-pointer">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Post Media / Photo */}
              {post.mediaUrl && (
                <div className="rounded-2xl overflow-hidden border border-white/10 max-h-96 bg-black/40">
                  <img
                    src={post.mediaUrl}
                    alt="Post media"
                    className="w-full h-full object-cover hover:scale-102 transition-transform duration-500"
                  />
                </div>
              )}

              {/* Reactions Bar (Facebook Style) */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                {/* Emoji Reactions Buttons */}
                <div className="flex items-center gap-2">
                  {post.reactions.map((r, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleReaction(post.id, r.emoji)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        r.userReacted
                          ? 'bg-[#B91C1C]/25 text-white border-[#B91C1C]/60 shadow-sm'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span>{r.emoji}</span>
                      <span>{r.count}</span>
                    </button>
                  ))}
                </div>

                {/* Action Controls */}
                <div className="flex items-center gap-4 text-slate-400">
                  <button
                    onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-slate-400" />
                    <span>{post.comments.length} Commentaires</span>
                  </button>

                  <button className="flex items-center gap-1.5 hover:text-white transition-colors hidden sm:flex">
                    <Share2 className="w-4 h-4 text-slate-400" />
                    <span>Partager</span>
                  </button>
                </div>
              </div>

              {/* Comments Drawer / Section */}
              {(activeCommentPostId === post.id || post.comments.length > 0) && (
                <div className="pt-3 space-y-3 bg-black/30 p-4 rounded-2xl border border-white/5">
                  {/* List of comments */}
                  {post.comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-3 text-xs">
                      <img
                        src={c.authorAvatar}
                        alt={c.authorName}
                        className="w-7 h-7 rounded-lg object-cover border border-white/10 mt-0.5"
                      />
                      <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white">{c.authorName}</span>
                          <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                        </div>
                        <p className="text-slate-300">{c.text}</p>
                      </div>
                    </div>
                  ))}

                  {/* Add comment input */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={commentInput[post.id] || ''}
                      onChange={(e) => setCommentInput({ ...commentInput, [post.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddComment(post.id);
                      }}
                      placeholder="Écrivez un commentaire..."
                      className="flex-1 bg-[#090A0F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      </div>

      {/* 4. Featured Highlights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#B91C1C]/20 border border-[#B91C1C]/40 flex items-center justify-center text-[#B91C1C]">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Dernier Match Récap</h3>
          {lastMatch && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-white">FIRE STONE</span>
                <span className="text-lg font-black text-[#D97706]">{lastMatch.scoreTeam} - {lastMatch.scoreOpponent}</span>
                <span className="text-slate-400">{lastMatch.opponent}</span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {lastMatch.summary}
              </p>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
                <span className="text-slate-400">MVP : <strong className="text-white">{lastMatch.mvpPlayerName}</strong></span>
                <button onClick={() => onNavigate('matchs')} className="text-[#B91C1C] font-semibold hover:underline">Détails →</button>
              </div>
            </div>
          )}
        </div>

        <div className="glass-panel glass-panel-hover p-6 rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#D97706]/20 border border-[#D97706]/40 flex items-center justify-center text-[#D97706]">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Joueur Star du Mois</h3>
          {mockPlayers[0] && (
            <div className="flex items-center gap-4">
              <img
                src={mockPlayers[0].photo}
                alt={mockPlayers[0].name}
                className="w-16 h-16 rounded-xl object-cover border border-[#D97706]/40 shadow-md"
              />
              <div className="space-y-1">
                <div className="font-bold text-white text-sm">{mockPlayers[0].name}</div>
                <div className="text-xs text-[#D97706] font-semibold">#{mockPlayers[0].number} — {mockPlayers[0].position}</div>
                <div className="text-xs text-slate-300 font-medium">
                  {mockPlayers[0].seasonStats.ppg} PPG • {mockPlayers[0].seasonStats.apg} APG
                </div>
              </div>
            </div>
          )}
          <button onClick={() => onNavigate('equipe')} className="text-xs text-slate-300 font-semibold hover:text-white transition-colors">
            Voir tout l'effectif →
          </button>
        </div>

        <div className="glass-panel glass-panel-hover p-6 rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Dernières Actualités</h3>
          {mockNews[0] && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider">{mockNews[0].category}</div>
              <h4 className="text-sm font-bold text-white line-clamp-2">{mockNews[0].title}</h4>
              <p className="text-xs text-slate-400 line-clamp-2">{mockNews[0].summary}</p>
            </div>
          )}
          <button onClick={() => onNavigate('actus')} className="text-xs text-purple-400 font-semibold hover:underline">
            Lire les articles →
          </button>
        </div>

      </div>

    </div>
  );
};
