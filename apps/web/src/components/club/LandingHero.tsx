import React from 'react';
import type { UserRole } from '../../types';
import { useClub } from '../../context/ClubContext';
import { ArrowRight, Calendar, MapPin, Newspaper, Trophy } from 'lucide-react';
import { ClubLogo } from '../common/ClubLogo';

interface LandingHeroProps {
  currentRole?: UserRole;
  onNavigate: (tab: string) => void;
  onOpenAuth: () => void;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(
    new Date(`${value}T00:00:00`),
  );

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(
    new Date(value),
  );

export const LandingHero: React.FC<LandingHeroProps> = ({ onNavigate }) => {
  const { activeClub, roster, matches, news, stats, loading } = useClub();
  const primary = activeClub.primaryColor || '#475569';
  const upcoming = matches.find((m) => m.status === 'UPCOMING');
  const recent = matches.find((m) => m.status === 'FINISHED');
  const leader = [...roster].sort(
    (a, b) => (b.seasonStats.efficiency ?? 0) - (a.seasonStats.efficiency ?? 0),
  )[0];

  return (
    <div className="space-y-6 pb-12">

      {/* ── SECTION 1 : Identité (gauche) + Prochain match (droite) ── */}
      <section
        className="rounded-3xl border border-white/10 p-6 sm:p-8 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-6"
        style={{ background: `linear-gradient(135deg, ${primary}50, #0b1020 70%)` }}
      >
        {/* ── Colonne gauche — Identité du club ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-4">
            <span className="w-16 h-16 rounded-2xl bg-black/25 grid place-items-center text-3xl overflow-hidden shrink-0">
              <ClubLogo
                logoUrl={activeClub.logoUrl}
                alt={`Logo ${activeClub.name}`}
                className="w-full h-full object-contain"
                fallback="🏀"
              />
            </span>
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl font-black text-white truncate">
                {activeClub.name}
              </h1>
              <p className="text-sm text-slate-300 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {activeClub.city || 'Ville non renseignée'}
              </p>
            </div>
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
            Espace club
          </p>
          <p className="text-sm text-slate-200 max-w-2xl leading-relaxed">
            {activeClub.description ||
              'Complétez la présentation de votre club dans l’administration.'}
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={() => onNavigate('equipe')}
              className="px-4 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-sm cursor-pointer hover:bg-slate-100 transition-colors"
            >
              Gérer l’effectif
            </button>
            <button
              onClick={() => onNavigate('matchs')}
              className="px-4 py-2.5 rounded-xl bg-black/20 border border-white/20 text-white font-bold text-sm cursor-pointer hover:bg-black/30 transition-colors"
            >
              Voir les matchs
            </button>
          </div>
        </div>

        {/* ── Colonne droite — Prochain match ── */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black text-white flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" /> Prochain match
            </h2>
            <button
              onClick={() => onNavigate('matchs')}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              Calendrier <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcoming ? (
            <div className="mt-4 rounded-xl bg-white/5 p-4 space-y-2 flex-1">
              <p className="text-base font-bold text-white leading-tight">
                {activeClub.name} <span className="text-slate-500">vs</span>{' '}
                {upcoming.opponent}
              </p>
              <p className="text-sm text-slate-300">
                {formatDate(upcoming.date)} · {upcoming.time}
              </p>
              <p className="text-xs text-slate-400 flex gap-1.5 items-center">
                <MapPin className="w-3.5 h-3.5" />
                {upcoming.venue || 'Lieu non renseigné'}
              </p>
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-white/10 p-4 text-xs text-slate-400 flex-1">
              Aucun match à venir n’est publié.
            </p>
          )}

          {recent && (
            <p className="mt-3 pt-3 border-t border-white/5 text-xs text-slate-400">
              Dernier :{' '}
              <span className="text-slate-200 font-semibold">
                {recent.scoreTeam ?? '—'} – {recent.scoreOpponent ?? '—'}
              </span>{' '}
              vs {recent.opponent}
            </p>
          )}
        </div>
      </section>

      {/* ── SECTION 2 : Fil d'actualité ── */}
      <section className="glass-panel rounded-3xl p-6 border border-white/10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-black text-white flex gap-2 items-center">
            <Newspaper className="w-5 h-5" /> Actualités
          </h2>
          <button
            onClick={() => onNavigate('actualites')}
            className="text-xs text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            Voir tout <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {news.length ? (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {news.slice(0, 6).map((post) => (
              <article
                key={post.id}
                className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 hover:border-white/15 transition-colors flex flex-col"
              >
                <p className="text-sm text-slate-200 line-clamp-3 leading-relaxed flex-1">
                  {post.content}
                </p>
                <p className="mt-3 pt-3 border-t border-white/5 text-xs text-slate-500">
                  {post.authorName} · {formatDateTime(post.createdAt)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
            Aucune actualité publiée.
          </p>
        )}
      </section>

      {/* ── SECTION 3 : Statistiques ── */}
      <section className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ['Matchs joués', stats?.played ?? 0],
            ['Victoires', stats?.wins ?? 0],
            ['Défaites', stats?.losses ?? 0],
            ['Joueurs inscrits', roster.length],
          ].map(([label, value]) => (
            <div
              key={label}
              className="glass-panel rounded-2xl p-5 border border-white/10"
            >
              <p className="text-xs text-slate-400">{label}</p>
              <p className="mt-1 text-3xl font-black text-white">
                {loading ? '—' : value}
              </p>
            </div>
          ))}
        </div>

        {/* Leader statistique */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black text-white flex items-center gap-2">
              <Trophy className="w-5 h-5" /> Leader statistique
            </h2>
            <button
              onClick={() => onNavigate('stats')}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              Statistiques <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {leader ? (
            <div className="mt-5 flex items-center gap-4">
              <img
                src={leader.photo}
                alt={leader.name}
                className="w-16 h-16 rounded-2xl object-cover bg-white/5"
              />
              <div>
                <p className="font-bold text-white">{leader.name}</p>
                <p className="text-xs text-slate-400">
                  #{leader.number} · {leader.position}
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  {leader.seasonStats.ppg} PTS · {leader.seasonStats.rpg} REB ·{' '}
                  {leader.seasonStats.apg} AST
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-5 rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
              Aucun joueur avec statistiques n’est disponible.
            </p>
          )}
        </div>
      </section>

    </div>
  );
};