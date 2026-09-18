import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Club, Team, UserRole } from '../../types';
import type { ApiClub } from '../../services/clubApi';
import { clubApi } from '../../services/clubApi';
import { toFrontendClub } from '../../services/clubMapper';
import { ClubCreateModal } from '../club/ClubCreateModal';
import {
  Search,
  MapPin,
  Trophy,
  ArrowRight,
  Building2,
  Users,
  ChevronDown,
  ChevronUp,
  Plus,
  RotateCcw,
  CheckCircle2,
  FileText,
  Sparkles,
  Lock,
  LogIn,
} from 'lucide-react';

interface ClubsDirectoryPageProps {
  onSelectTeamWorkspace: (team: Team) => void;
  onSelectClubProfile: (club: Club, focusedTeam?: Team) => void;
  onOpenAuth?: () => void;                // ✅ optionnel maintenant
  currentUserRole?: UserRole;
  isAuthenticated?: boolean;
}

export const ClubsDirectoryPage: React.FC<ClubsDirectoryPageProps> = ({
  onSelectTeamWorkspace,
  onSelectClubProfile,
  onOpenAuth,
  currentUserRole = 'VISITOR',
  isAuthenticated = false,
}) => {
  const [clubs, setClubs] = useState<ApiClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [expandedClubId, setExpandedClubId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  const loadClubs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await clubApi.fetchClubs();
      setClubs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(
        err?.message ||
        'Impossible de charger la liste des clubs depuis le serveur.'
      );
      setClubs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClubs();
  }, [loadClubs]);

  // Villes uniques
  const cities = useMemo(() => {
    const set = new Set(
      clubs.map((c) => c.city).filter((city): city is string => Boolean(city))
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [clubs]);

  // Filtrage SAFE
  const filteredClubs = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return clubs.filter((club) => {
      const matchesSearch =
        !term ||
        (club.name?.toLowerCase().includes(term) ?? false) ||
        (club.shortName?.toLowerCase().includes(term) ?? false) ||
        (club.city?.toLowerCase().includes(term) ?? false) ||
        (club.description?.toLowerCase().includes(term) ?? false) ||
        (club.teams?.some((t) => t.name?.toLowerCase().includes(term)) ?? false);

      const matchesCity = selectedCity === 'ALL' || club.city === selectedCity;
      return matchesSearch && matchesCity;
    });
  }, [clubs, searchTerm, selectedCity]);

  const totalTeams = useMemo(
    () => clubs.reduce((acc, c) => acc + (c.teams?.length || 0), 0),
    [clubs]
  );

  const toggleExpand = (clubId: string) => {
    setExpandedClubId((prev) => (prev === clubId ? null : clubId));
  };

  // ✅ Helper : actions publiques (consultation)
  const handleViewProfile = (apiClub: ApiClub) => {
    const club = toFrontendClub(apiClub);
    const firstTeam = club.teams[0];
    onSelectClubProfile(club, firstTeam);
  };

  // ✅ Helper : actions protégées (entrée workspace = nécessite auth)
  const requireAuth = (action?: () => void) => {
    if (!isAuthenticated) {
      onOpenAuth?.();
      return;
    }
    action?.();
  };

  const handleEnterTeamWorkspace = (apiClub: ApiClub, teamIndex = 0) => {
    requireAuth(() => {
      const club = toFrontendClub(apiClub);
      const team = club.teams[teamIndex];
      if (team) onSelectTeamWorkspace(team);
    });
  };

  const handleCreateClubClick = () => {
    if (!isAuthenticated) {
      onOpenAuth?.();
      return;
    }
    setShowCreateModal(true);
  };

  const handleClubCreated = (newClub: ApiClub) => {
    setClubs((prev) => [newClub, ...prev]);
    handleViewProfile(newClub);
  };

  return (
    <div className="space-y-10 pb-20">
      {/* ─── BANDEAU CTA INVITÉ ─────────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="social-card-border rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl bg-gradient-to-r from-[#FF2A3B]/10 via-[#0D1018] to-[#FFB800]/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#FF2A3B]/20 border border-[#FF2A3B]/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#FFB800]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-black text-white">
                Rejoignez la Ligue HOOPERS
              </h4>
              <p className="text-xs text-slate-400">
                Créez un compte gratuit pour gérer votre club, vos équipes et vos matchs.
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenAuth?.()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#E60023] text-white text-xs font-bold shadow-lg shadow-red-500/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Se connecter</span>
          </button>
        </section>
      )}

      {/* ─── EN-TÊTE DU HUB CLUBS ─────────────────────────────────── */}
      <section className="relative rounded-3xl p-6 sm:p-10 md:p-12 overflow-hidden border border-white/10 bg-gradient-to-br from-[#121621] via-[#0D1018] to-[#0A0D14] shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-500" /> Annuaire &amp; Hub
              Officiel des Clubs
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
              Les Clubs &amp; Franchises
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Consultez les franchises officielles de basketball de la ligue.
              Chaque club dispose de ses propres équipes, effectifs, calendrier
              de matchs et fil de publications officiel.
            </p>

            <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-4 border-t border-white/10 max-w-md">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {loading ? '—' : clubs.length}
                </div>
                <div className="text-[11px] sm:text-xs text-slate-400 font-semibold">
                  Clubs Enregistrés
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {loading ? '—' : totalTeams}
                </div>
                <div className="text-[11px] sm:text-xs text-slate-400 font-semibold">
                  Équipes Engagées
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {loading ? '—' : cities.length}
                </div>
                <div className="text-[11px] sm:text-xs text-slate-400 font-semibold">
                  Métropoles
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCreateClubClick}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF2A3B] to-[#FFB800] text-white text-xs font-black uppercase tracking-wider hover:opacity-95 transition-all shadow-lg shadow-red-500/25 cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>
                {currentUserRole === 'SUPER_ADMIN'
                  ? 'Créer un Club'
                  : 'Inscrire mon Club'}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── BARRE DE RECHERCHE ET FILTRES ─────────────────────────────────── */}
      <section className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/10 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un club, une ville, une équipe..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:border-[#FF2A3B] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#FF2A3B]" /> Métropole :
            </span>
            <button
              onClick={() => setSelectedCity('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 min-h-[36px] ${selectedCity === 'ALL'
                  ? 'bg-white/20 text-white shadow-sm border border-white/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
            >
              Toutes ({clubs.length})
            </button>
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 min-h-[36px] ${selectedCity === city
                    ? 'bg-white/20 text-white shadow-sm border border-white/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                  }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GRILLE DES CLUBS ET ÉTATS UI ───────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Clubs &amp; Franchises</span>
            {!loading && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-normal">
                {filteredClubs.length} disponible
                {filteredClubs.length > 1 ? 's' : ''}
              </span>
            )}
          </h2>

          <button
            onClick={loadClubs}
            title="Rafraîchir"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/5"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/30 text-center space-y-3">
            <p className="text-sm font-semibold text-red-200">{error}</p>
            <button
              onClick={loadClubs}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Réessayer
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-white/10 bg-[#10141D] p-6 space-y-4 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-white/10 rounded-md w-2/3" />
                    <div className="h-3 bg-white/5 rounded-md w-1/3" />
                  </div>
                </div>
                <div className="h-3 bg-white/5 rounded-md w-full" />
                <div className="h-3 bg-white/5 rounded-md w-4/5" />
                <div className="pt-4 border-t border-white/5 flex gap-3">
                  <div className="h-9 bg-white/10 rounded-xl flex-1" />
                  <div className="h-9 bg-white/10 rounded-xl flex-1" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredClubs.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-3xl border border-white/10 p-8 space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-2xl text-slate-400">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-white">
              {searchTerm || selectedCity !== 'ALL'
                ? 'Aucun club ne correspond à votre filtre'
                : 'Aucun club répertorié pour le moment'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              {searchTerm || selectedCity !== 'ALL'
                ? 'Modifiez vos critères de recherche ou explorez toutes les métropoles.'
                : 'Soyez le premier à inscrire une franchise ou un club officiel sur la plateforme HOOPERS.'}
            </p>

            <div className="pt-2 flex flex-wrap justify-center gap-3">
              {searchTerm || selectedCity !== 'ALL' ? (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCity('ALL');
                  }}
                  className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Réinitialiser les filtres
                </button>
              ) : (
                <button
                  onClick={handleCreateClubClick}
                  className="px-5 py-2.5 bg-[#FF2A3B] hover:bg-[#E60023] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-red-500/25"
                >
                  Inscrire un premier Club
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredClubs.map((club) => {
              const primary = club.primaryColor || '#FF2A3B';
              const isExpanded = expandedClubId === club.id;
              const teams = Array.isArray(club.teams) ? club.teams : [];

              return (
                <div
                  key={club.id}
                  className="rounded-3xl border border-white/10 bg-[#10141D] hover:border-white/20 transition-all duration-300 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1 opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{ background: primary }}
                  />

                  <div>
                    {/* Header Club */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md border shrink-0 bg-black overflow-hidden"
                          style={{ borderColor: `${primary}60` }}
                        >
                          {club.logoUrl ? (
                            <img
                              src={club.logoUrl}
                              alt={club.name || 'Club'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>🏀</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-black text-white leading-tight truncate">
                              {club.name || 'Club inconnu'}
                            </h3>
                            {club.isVerified && (
                              <span title="Club vérifié officiel">
                                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1 text-slate-400 text-xs">
                            <span className="flex items-center gap-1 text-slate-300">
                              <MapPin className="w-3 h-3 text-[#FF2A3B]" />
                              {club.city || '—'}
                              {club.country ? `, ${club.country}` : ''}
                            </span>
                            {club.foundedYear && (
                              <>
                                <span>•</span>
                                <span>Fondé en {club.foundedYear}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 shrink-0">
                        {teams.length} équipe{teams.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-slate-300 text-xs leading-relaxed line-clamp-2 mb-4">
                      {club.description ||
                        `Franchise officielle de basketball basée à ${club.city || 'Lomé'
                        }. Effectifs compétitifs et vie de club active.`}
                    </p>

                    {/* Arène & Indicateurs */}
                    <div className="text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2 mb-4 py-2 border-y border-white/5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {club.arena || `Complexe Sportif de ${club.city || 'Lomé'}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
                        {club.postsCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" /> {club.postsCount} actus
                          </span>
                        )}
                        {club.membersCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {club.membersCount} membres
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Équipes rattachées */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" /> Équipes du
                          Club ({teams.length})
                        </span>
                        {teams.length > 2 && (
                          <button
                            onClick={() => toggleExpand(club.id)}
                            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer lowercase"
                          >
                            {isExpanded ? (
                              <>
                                réduire <ChevronUp className="w-3 h-3" />
                              </>
                            ) : (
                              <>
                                voir toutes <ChevronDown className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {(isExpanded ? teams : teams.slice(0, 2)).map((team, idx) => (
                          <div
                            key={team.id}
                            className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-3 group"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-white truncate group-hover:text-amber-400 transition-colors">
                                  {team.name || 'Équipe'}
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 shrink-0">
                                  {team.category || '—'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                {team.coachName && (
                                  <span>Coach : {team.coachName}</span>
                                )}
                                {team.record && <span>• {team.record}</span>}
                              </div>
                            </div>

                            {/* ✅ "Gérer" nécessite auth */}
                            <button
                              onClick={() => handleEnterTeamWorkspace(club, idx)}
                              title={
                                isAuthenticated
                                  ? 'Ouvrir le vestiaire de cette équipe'
                                  : 'Connectez-vous pour gérer cette équipe'
                              }
                              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-colors cursor-pointer shrink-0 min-h-[32px] flex items-center gap-1"
                            >
                              {!isAuthenticated && <Lock className="w-3 h-3" />}
                              <span>Gérer →</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions bas de carte */}
                  <div className="pt-5 mt-5 border-t border-white/10 flex items-center gap-3">
                    {/* ✅ Page Sociale : publique, accessible à tous */}
                    <button
                      onClick={() => handleViewProfile(club)}
                      className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/15 hover:bg-white/10 text-white min-h-[40px]"
                    >
                      <Building2 className="w-3.5 h-3.5 text-slate-300" />
                      <span>Page Sociale Club</span>
                    </button>

                    {/* ✅ Espace Club : nécessite auth */}
                    <button
                      onClick={() => handleEnterTeamWorkspace(club, 0)}
                      title={
                        isAuthenticated
                          ? 'Entrer dans le vestiaire du club'
                          : 'Connectez-vous pour accéder au vestiaire'
                      }
                      className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer bg-white/15 hover:bg-white/25 text-white min-h-[40px]"
                    >
                      {!isAuthenticated && <Lock className="w-3 h-3" />}
                      <span>Espace Club</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── BANNIÈRE AFFILIATION CLUB ───────────────────────────────────────── */}
      <section className="relative rounded-3xl p-6 sm:p-8 border border-white/10 bg-[#121621] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#FFB800]" /> Rejoindre le Réseau de
            la Ligue
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Vous dirigez un club de basketball ?
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Créez votre page officielle de club, réunissez vos effectifs, vos matchs
            et vos annonces officielles sur HOOPERS.
          </p>
        </div>

        <button
          onClick={handleCreateClubClick}
          className="px-6 py-3 bg-gradient-to-r from-[#FF2A3B] to-[#FFB800] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer shrink-0 min-h-[44px]"
        >
          {currentUserRole === 'SUPER_ADMIN' ? 'Créer un Club' : 'Inscrire mon club'}
        </button>
      </section>

      {/* Modale de Création / Inscription */}
      <ClubCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleClubCreated}
        isSuperAdmin={currentUserRole === 'SUPER_ADMIN'}
        isAuthenticated={isAuthenticated}
        onOpenAuth={onOpenAuth ?? (() => undefined)}
      />
    </div>
  );
};