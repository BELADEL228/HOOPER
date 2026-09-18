import React, { useState } from 'react';
import type { Team, Player, Match, SocialPost } from '../../types';
import {
  X,
  MapPin,
  Users,
  Calendar,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Video,
  Heart,
} from 'lucide-react';
import { ClubLogo } from '../common/ClubLogo';

interface TeamOverviewModalProps {
  team: Team | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  players?: Player[];
  matches?: Match[];
  posts?: SocialPost[];
}

export const TeamOverviewModal: React.FC<TeamOverviewModalProps> = ({
  team,
  isOpen,
  onClose,
  onNavigate,
  players = [],
  matches = [],
  posts = [],
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'roster' | 'matches' | 'posts' | 'shop'
  >('overview');
  const [isFollowing, setIsFollowing] = useState(false);

  if (!isOpen || !team) return null;

  const primaryColor = team.primaryColor || '#FF2A3B';
  const secondaryColor = team.secondaryColor || '#FFB800';

  // ─── Filtre SAFE des posts liés à cette équipe ─────────────────────
  const teamNameLower = team.name?.toLowerCase() ?? '';

  const teamPosts = posts.filter((p) => {
    if (p.teamId === team.id) return true;

    // Recherche dans le contenu (protégée)
    if (p.content && teamNameLower) {
      if (p.content.toLowerCase().includes(teamNameLower)) return true;
    }

    // Posts généraux sans teamId → rattachés à l'équipe par défaut
    if (team.id === 'team-001' && !p.teamId) return true;

    return false;
  });

  return (
    <div
      data-testid="team-overview-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] rounded-3xl border border-white/20 bg-[#0A0C14] shadow-2xl text-slate-100 overflow-hidden flex flex-col">
        {/* ─── BANNIÈRE COVER ──────────────────────────────────────── */}
        <div
          className="relative h-44 sm:h-56 p-6 flex flex-col justify-between overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}dd 0%, #0F121E 60%, ${secondaryColor}33 100%)`,
          }}
        >
          <div
            className="absolute -top-12 -right-12 w-64 h-64 rounded-full blur-3xl opacity-40 pointer-events-none"
            style={{ backgroundColor: secondaryColor }}
          />

          <button
            onClick={onClose}
            type="button"
            className="self-end p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm border border-white/10 transition-all cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-end justify-between gap-4 z-10">
            <div className="flex items-end gap-4">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/80 border-2 p-1 flex items-center justify-center text-3xl sm:text-4xl shadow-2xl shrink-0"
                style={{ borderColor: primaryColor }}
              >
                <ClubLogo
                  logoUrl={team.logoUrl}
                  alt={`Logo ${team.name}`}
                  className="w-full h-full object-contain"
                  fallback="🔥"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-black font-mono shadow"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    {team.category || 'SENIOR PRO'}
                  </span>
                  <span className="text-xs text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-400" />{' '}
                    {team.city || '—'}, Togo
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
                  {team.name || 'Équipe'}
                  <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                </h2>
              </div>
            </div>

            <button
              onClick={() => setIsFollowing(!isFollowing)}
              type="button"
              className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg ${isFollowing
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white text-black hover:bg-slate-200'
                }`}
            >
              <Heart
                className={`w-4 h-4 ${isFollowing ? 'fill-red-500 text-red-500' : ''}`}
              />
              {isFollowing ? 'Abonné' : 'Suivre'}
            </button>
          </div>
        </div>

        {/* ─── ONGLETS ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 p-2 px-4 border-b border-white/10 bg-[#0E111C] overflow-x-auto text-xs font-bold">
          {[
            { id: 'overview', label: 'Vue d’ensemble', icon: Sparkles },
            { id: 'roster', label: `Effectif Joueurs (${players.length})`, icon: Users },
            { id: 'matches', label: 'Matchs & Calendrier', icon: Calendar },
            { id: 'posts', label: `Publications & Vidéos (${teamPosts.length})`, icon: Video },
            { id: 'shop', label: 'Boutique Maillots', icon: ShoppingBag },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                type="button"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${isActive
                    ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── CONTENU ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ═══ TAB 1 : VUE D'ENSEMBLE ═══ */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#FFB800]">
                  Présentation du Pôle
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {team.description ||
                    `${team.name || 'Cette équipe'} est l'équipe de référence évoluant au Terrain du Lycée d'Adétikopé à Lomé. Portée par des valeurs de rigueur tactique, de puissance athlétique et de cohésion, elle incarne la relève et l'élite du basketball togolais.`}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xl font-black text-white font-mono">14V - 2D</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">
                    Bilan de Saison
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xl font-black text-[#FFB800] font-mono">#1</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">
                    Classement D1
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xl font-black text-white font-mono">88.5</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">
                    Points / Match
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xl font-black text-emerald-400 font-mono">2026</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">
                    Année de Référence
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">
                      Terrain du Lycée d'Adétikopé
                    </h5>
                    <p className="text-xs text-slate-400">
                      Quartier Adétikopé, Lomé — Togo (Gradins 1 200 places)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('terrains');
                  }}
                  type="button"
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer shrink-0"
                >
                  Voir sur la Carte →
                </button>
              </div>
            </div>
          )}

          {/* ═══ TAB 2 : ROSTER ═══ */}
          {activeTab === 'roster' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Joueurs enregistrés dans l'effectif :
                </h4>
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('equipe');
                  }}
                  className="text-xs text-[#FFB800] hover:underline font-bold"
                >
                  Ouvrir le Roster complet →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {players.slice(0, 6).map((player) => (
                  <div
                    key={player.id}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 hover:border-amber-500/40 transition-all"
                  >
                    <img
                      src={
                        player.photo ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          player.name || 'Joueur'
                        )}&background=B91C1C&color=fff`
                      }
                      alt={player.name || 'Joueur'}
                      className="w-12 h-12 rounded-xl object-cover border border-white/20 shadow bg-slate-800"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs truncate">
                          {player.name || 'Joueur inconnu'}
                        </span>
                        <span className="font-mono font-black text-xs text-[#FFB800]">
                          #{player.number ?? '—'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {player.position || '—'} • {player.height || '—'}
                      </div>
                      <div className="text-[10px] text-amber-300/80 font-mono mt-0.5">
                        {player.seasonStats?.ppg ?? '—'} PPG •{' '}
                        {player.seasonStats?.apg ?? '—'} APG
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ TAB 3 : MATCHS ═══ */}
          {activeTab === 'matches' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Matchs officiels de la saison :
                </h4>
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('matchs');
                  }}
                  className="text-xs text-[#FFB800] hover:underline font-bold"
                >
                  Accéder au Match Center →
                </button>
              </div>

              <div className="space-y-3">
                {matches.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-black text-[9px] uppercase">
                        {m.status === 'FINISHED' ? 'TERMINÉ' : 'À VENIR'}
                      </span>
                      <h5 className="font-bold text-white mt-1 text-sm">
                        {team.name || 'Équipe'} vs {m.opponent || '?'}
                      </h5>
                      <p className="text-slate-400 text-[11px]">
                        {m.date || '—'} à {m.time || '—'} • {m.venue || '—'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {m.status === 'FINISHED' ? (
                        <div className="text-base font-black text-[#FFB800] font-mono">
                          {m.scoreTeam ?? 0} - {m.scoreOpponent ?? 0}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            onClose();
                            onNavigate('marketplace');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold text-[11px] shadow cursor-pointer"
                        >
                          Billet Match
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ TAB 4 : POSTS ═══ */}
          {activeTab === 'posts' && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Publications du Staff et Vidéos de l'équipe :
              </h4>

              {teamPosts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 rounded-2xl bg-white/5 border border-white/10">
                  Aucune publication spécifique trouvée pour cette équipe.
                </div>
              ) : (
                teamPosts.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          p.authorAvatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            p.authorName || 'User'
                          )}&background=FF2A3B&color=fff`
                        }
                        alt={p.authorName || 'User'}
                        className="w-9 h-9 rounded-xl object-cover border border-white/20 bg-slate-800"
                      />
                      <div>
                        <div className="font-bold text-white text-xs flex items-center gap-1.5">
                          <span>{p.authorName || 'Utilisateur'}</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {p.timestamp || '—'}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed">
                      {p.content || ''}
                    </p>

                    {p.mediaUrl && (
                      <div className="rounded-xl overflow-hidden max-h-60 border border-white/10 relative">
                        {p.mediaType === 'video' && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase flex items-center gap-1">
                            <Video className="w-3 h-3" /> Vidéo Club
                          </div>
                        )}
                        <img
                          src={p.mediaUrl}
                          alt="Media"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 border-t border-white/10">
                      <span>🔥 {p.likesCount ?? 0} J'aime</span>
                      <span>💬 {p.comments?.length ?? 0} Commentaires</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ═══ TAB 5 : SHOP ═══ */}
          {activeTab === 'shop' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-6 rounded-2xl bg-linear-to-r from-red-950/60 via-slate-900 to-amber-950/40 border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-left">
                  <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-black uppercase">
                    Boutique Officielle
                  </span>
                  <h4 className="text-xl font-black text-white">
                    Maillot Officiel de {team.name || 'l\'équipe'}
                  </h4>
                  <p className="text-xs text-slate-300 max-w-md">
                    Personnalisez votre flocage officiel avec votre nom et votre
                    numéro préféré, ou offrez le maillot collector du club.
                  </p>
                  <div className="text-base font-black text-[#FFB800] font-mono pt-1">
                    18 000 FCFA{' '}
                    <span className="text-xs text-slate-400 font-normal">
                      (Flocage offert)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onNavigate('marketplace');
                  }}
                  type="button"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-red-500/25 transition-all cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <ShoppingBag className="w-4 h-4" /> Personnaliser dans la Boutique
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── FOOTER ─────────────────────────────────────────────── */}
        <div className="p-4 border-t border-white/10 bg-[#0E111C] flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Pôle officiel FIRE STONE Basketball Club • Lomé, Togo
          </span>
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer"
          >
            Fermer l'aperçu
          </button>
        </div>
      </div>
    </div>
  );
};