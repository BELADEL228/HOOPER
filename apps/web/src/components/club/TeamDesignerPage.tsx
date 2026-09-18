import { useState, useEffect } from 'react';
import {
  Upload,
  Wand2,
  Shield,
  Sparkles,
  Save,
  Sliders,
  Layers,
  Flame,
  Trophy,
  Copy,
  Check,
  Shirt,
  MapPin,
  Calendar,
  Zap,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { Team, ThemeTokens, JerseyKitConfig } from '../../types';
import { apiUrl } from '../../services/api';
import { analyzeLogoFile } from '../../services/logoPalette';

// ─── Charte visuelle par défaut (neutre — n'appartient à aucune équipe) ────────
const DEFAULT_THEME_TOKENS: ThemeTokens = {
  primary: '#FF2A3B',
  secondary: '#FFB800',
  accent: '#38BDF8',
  background: '#090A0F',
  surface: '#121621',
  textPrimary: '#FFFFFF',
  textSecondary: '#CBD5E1',
  border: '#841B23',
  gradient: 'linear-gradient(135deg, #FF2A3B 0%, #FFB800 100%)',
  matchdayGradient: 'radial-gradient(circle at 20% 20%, rgba(255, 42, 59, 0.35) 0%, #090A0F 75%)',
  shadow: '0 16px 40px rgba(255, 42, 59, 0.35)',
  glow: '0 0 24px rgba(56, 189, 248, 0.4)',
  themeType: 'dark',
  palette: ['#FF2A3B', '#FFB800', '#38BDF8', '#121621', '#FFFFFF'],
  contrastRatio: 5.4,
  homeKit: {
    jerseyBase: '#FF2A3B',
    jerseyTrims: '#FFB800',
    jerseyAccent: '#38BDF8',
    textColor: '#FFFFFF',
    shortsBase: '#121621',
    pattern: 'gradient',
  },
  awayKit: {
    jerseyBase: '#F8FAFC',
    jerseyTrims: '#FF2A3B',
    jerseyAccent: '#FFB800',
    textColor: '#0F172A',
    shortsBase: '#F8FAFC',
    pattern: 'stripes',
  },
};

// ─── Nuanciers de démarrage (nommés par leur palette, pas par une équipe) ─────
const COLOR_PRESETS: { name: string; subtitle: string; emoji: string; tokens: ThemeTokens }[] = [
  {
    name: 'Flamme & Or',
    subtitle: 'Rouge ardent et or solaire',
    emoji: '🔥',
    tokens: DEFAULT_THEME_TOKENS,
  },
  {
    name: 'Forêt & Safran',
    subtitle: 'Vert profond et jaune chaud',
    emoji: '🌿',
    tokens: {
      primary: '#059669',
      secondary: '#EAB308',
      accent: '#38BDF8',
      background: '#06130D',
      surface: '#0D2319',
      textPrimary: '#FFFFFF',
      textSecondary: '#A7F3D0',
      border: '#047857',
      gradient: 'linear-gradient(135deg, #059669 0%, #EAB308 100%)',
      matchdayGradient: 'radial-gradient(circle at 20% 20%, rgba(5, 150, 105, 0.4) 0%, #06130D 75%)',
      shadow: '0 16px 40px rgba(5, 150, 105, 0.35)',
      glow: '0 0 24px rgba(234, 179, 8, 0.4)',
      themeType: 'dark',
      palette: ['#059669', '#EAB308', '#38BDF8', '#0D2319', '#FFFFFF'],
      contrastRatio: 5.8,
      homeKit: {
        jerseyBase: '#059669',
        jerseyTrims: '#EAB308',
        jerseyAccent: '#FFFFFF',
        textColor: '#FFFFFF',
        shortsBase: '#0D2319',
        pattern: 'gradient',
      },
      awayKit: {
        jerseyBase: '#FFFFFF',
        jerseyTrims: '#059669',
        jerseyAccent: '#EAB308',
        textColor: '#06130D',
        shortsBase: '#FFFFFF',
        pattern: 'stripes',
      },
    },
  },
  {
    name: 'Océan & Cyan',
    subtitle: 'Bleu royal et cyan néon',
    emoji: '🌊',
    tokens: {
      primary: '#2563EB',
      secondary: '#06B6D4',
      accent: '#F59E0B',
      background: '#070C18',
      surface: '#0F1B33',
      textPrimary: '#FFFFFF',
      textSecondary: '#BAE6FD',
      border: '#1D4ED8',
      gradient: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
      matchdayGradient: 'radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.4) 0%, #070C18 75%)',
      shadow: '0 16px 40px rgba(37, 99, 235, 0.35)',
      glow: '0 0 24px rgba(6, 182, 212, 0.4)',
      themeType: 'dark',
      palette: ['#2563EB', '#06B6D4', '#F59E0B', '#0F1B33', '#FFFFFF'],
      contrastRatio: 5.1,
      homeKit: {
        jerseyBase: '#2563EB',
        jerseyTrims: '#06B6D4',
        jerseyAccent: '#F59E0B',
        textColor: '#FFFFFF',
        shortsBase: '#0F1B33',
        pattern: 'gradient',
      },
      awayKit: {
        jerseyBase: '#F0F9FF',
        jerseyTrims: '#2563EB',
        jerseyAccent: '#06B6D4',
        textColor: '#070C18',
        shortsBase: '#F0F9FF',
        pattern: 'modern',
      },
    },
  },
];

export function TeamDesignerPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [tokens, setTokens] = useState<ThemeTokens>(DEFAULT_THEME_TOKENS);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [activeView, setActiveView] = useState<'jerseys' | 'card' | 'matchday' | 'ui'>('jerseys');
  const [copiedCode, setCopiedCode] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [customJerseyNumber, setCustomJerseyNumber] = useState<number>(7);
  const [customPlayerName, setCustomPlayerName] = useState<string>('VANCE');

  // ── Chargement des équipes depuis l'API ───────────────────────────────────
  useEffect(() => {
    setTeamsLoading(true);
    fetch(apiUrl('/teams'))
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTeams(data);
          const first = data[0];
          setSelectedTeamId(first.id);
          applyTeamTheme(first);
        }
      })
      .catch(() => {
        // Mode hors ligne : on garde la liste vide, pas de fallback hardcodé
      })
      .finally(() => setTeamsLoading(false));
  }, []);

  // ── Applique le thème d'une équipe (themeJson, sinon couleurs de base) ────
  const applyTeamTheme = (team: Team) => {
    if (team.themeJson) {
      try {
        const parsed =
          typeof team.themeJson === 'string' ? JSON.parse(team.themeJson) : team.themeJson;
        setTokens({ ...DEFAULT_THEME_TOKENS, ...parsed });
        return;
      } catch {
        // fallback sur les couleurs ci-dessous
      }
    }
    // Pas de themeJson : soit couleurs de base, soit réinitialisation
    if (team.primaryColor || team.secondaryColor || team.accentColor) {
      setTokens({
        ...DEFAULT_THEME_TOKENS,
        primary: team.primaryColor || DEFAULT_THEME_TOKENS.primary,
        secondary: team.secondaryColor || DEFAULT_THEME_TOKENS.secondary,
        accent: team.accentColor || DEFAULT_THEME_TOKENS.accent,
        themeType:
          (team.themeType as 'dark' | 'light') || DEFAULT_THEME_TOKENS.themeType,
        gradient: `linear-gradient(135deg, ${team.primaryColor || DEFAULT_THEME_TOKENS.primary}, ${team.secondaryColor || DEFAULT_THEME_TOKENS.secondary})`,
      });
    } else {
      // Ni themeJson ni couleurs : on repart de la charte neutre
      setTokens(DEFAULT_THEME_TOKENS);
    }
  };

  const handleTeamChange = (teamId: string) => {
    setSelectedTeamId(teamId);
    const targetTeam = teams.find((t) => t.id === teamId);
    if (targetTeam) applyTeamTheme(targetTeam);
  };

  // ── Import + analyse de logo ──────────────────────────────────────────────
  const handleLogoSelect = (file: File) => {
    setLogoFile(file);
    const url = URL.createObjectURL(file);
    setLogoPreviewUrl(url);
    setStatusMessage(null);
  };

  const handleAnalyzeLogo = async () => {
    if (!logoFile) {
      setStatusMessage({ type: 'error', text: 'Veuillez sélectionner une image de logo d’abord.' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const extractedTokens = await analyzeLogoFile(logoFile);
      setTokens({ ...DEFAULT_THEME_TOKENS, ...extractedTokens });
      setStatusMessage({
        type: 'success',
        text: `Palette harmonisée extraite depuis "${logoFile.name}".`,
      });
    } catch (err) {
      console.warn('Logo palette analysis failed:', err);
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Analyse du logo impossible.',
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Sauvegarde du thème ───────────────────────────────────────────────────
  const handleSaveTheme = async () => {
    if (!selectedTeamId) {
      setStatusMessage({ type: 'error', text: 'Aucune équipe sélectionnée.' });
      return;
    }
    setSavingTheme(true);
    setStatusMessage(null);

    try {
      const savedAuth = localStorage.getItem('firestone-auth');
      const token = savedAuth ? JSON.parse(savedAuth)?.token : null;

      const response = await fetch(apiUrl(`/teams/${selectedTeamId}/theme`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          primaryColor: tokens.primary,
          secondaryColor: tokens.secondary,
          accentColor: tokens.accent,
          themeType: tokens.themeType,
          themeJson: tokens,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Erreur lors de l’enregistrement');
      }

      setStatusMessage({
        type: 'success',
        text: 'Thème et identité visuelle enregistrés avec succès pour cette équipe !',
      });
    } catch (err) {
      console.error('Save theme error:', err);
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Impossible de sauvegarder le thème.',
      });
    } finally {
      setSavingTheme(false);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(tokens, null, 2));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // ── Équipe sélectionnée (ou null) ────────────────────────────────────────
  const selectedTeam = teams.find((t) => t.id === selectedTeamId) || null;

  const homeKit: JerseyKitConfig = tokens.homeKit || {
    jerseyBase: tokens.primary,
    jerseyTrims: tokens.secondary,
    jerseyAccent: tokens.accent,
    textColor: '#FFFFFF',
    shortsBase: tokens.surface,
    pattern: 'gradient',
  };

  const awayKit: JerseyKitConfig = tokens.awayKit || {
    jerseyBase: '#FFFFFF',
    jerseyTrims: tokens.primary,
    jerseyAccent: tokens.secondary,
    textColor: '#0F172A',
    shortsBase: '#FFFFFF',
    pattern: 'stripes',
  };

  // ── Empty state global : aucune équipe en base ────────────────────────────
  if (!teamsLoading && teams.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center rounded-3xl border border-white/10 bg-[#10141D] p-12 space-y-4 my-12">
        <Shield className="w-12 h-12 mx-auto text-slate-500" />
        <h3 className="text-2xl font-black text-white">Aucune équipe à personnaliser</h3>
        <p className="text-sm text-slate-400">
          Créez d’abord une équipe dans le module d’administration pour pouvoir lui attribuer
          un thème et une identité visuelle.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-fadeIn text-slate-100">
      {/* En-tête */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-cyan-300">
            <Wand2 className="w-3.5 h-3.5 text-cyan-400" /> AI Team Designer & Studio Visuel
          </div>
          <h2 className="mt-2 text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            Identité Visuelle & Thèmes d’Équipe
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Analysez un logo par IA, générez la charte graphique officielle et visualisez les maillots & affiches en direct.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCopyJson}
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-white/10 hover:text-white transition-all shadow-sm"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            {copiedCode ? 'Tokens copiés !' : 'Exporter tokens (JSON)'}
          </button>
          <button
            onClick={handleSaveTheme}
            disabled={savingTheme || !selectedTeam}
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-red-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {savingTheme ? 'Enregistrement...' : 'Sauvegarder pour l’équipe'}
          </button>
        </div>
      </header>

      {/* Messages de statut */}
      {statusMessage && (
        <div
          className={`flex items-center gap-3 rounded-2xl p-4 text-xs font-semibold border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ─── Colonne gauche : Contrôles ─────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Étape 1 : Choix de l'équipe */}
          <div className="glass-panel rounded-3xl border border-white/10 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> Étape 1 : Équipe cible
              </span>
              <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                {teamsLoading ? '…' : `${teams.length} équipe(s)`}
              </span>
            </div>

            <select
              value={selectedTeamId}
              onChange={(e) => handleTeamChange(e.target.value)}
              disabled={teamsLoading || teams.length === 0}
              className="w-full rounded-2xl border border-white/15 bg-slate-900/90 px-4 py-3 text-sm font-bold text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:opacity-50"
            >
              {teamsLoading ? (
                <option value="">Chargement des équipes…</option>
              ) : teams.length === 0 ? (
                <option value="">Aucune équipe disponible</option>
              ) : (
                teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.city || '—'} - {team.category})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Étape 2 : Import Logo & Analyse IA */}
          <div className="glass-panel rounded-3xl border border-white/10 p-5 space-y-4 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Wand2 className="w-4 h-4" /> Étape 2 : Importation & Analyse IA
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                Analyse locale
              </span>
            </div>

            <label
              htmlFor="logo-uploader"
              className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                logoFile
                  ? 'border-cyan-400/60 bg-cyan-950/20'
                  : 'border-white/15 bg-white/5 hover:border-cyan-400/40 hover:bg-cyan-500/5'
              }`}
            >
              {logoPreviewUrl ? (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-950/80 p-2 border border-white/20 flex items-center justify-center overflow-hidden">
                    <img src={logoPreviewUrl} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white truncate max-w-[180px]">{logoFile?.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {(logoFile ? logoFile.size / 1024 : 0).toFixed(1)} Ko • Prêt pour l’analyse
                    </p>
                    <span className="text-[10px] text-cyan-300 underline mt-1 block">Changer d'image</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">Glissez ou cliquez pour importer le logo</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PNG transparent, JPEG ou WEBP (max 8 Mo)</p>
                  </div>
                </>
              )}
              <input
                id="logo-uploader"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(e) => e.target.files?.[0] && handleLogoSelect(e.target.files[0])}
                className="hidden"
              />
            </label>

            <button
              onClick={handleAnalyzeLogo}
              disabled={loading || !logoFile}
              type="button"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-4 py-3 text-xs font-black text-slate-950 uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyse des pigments & contrastes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyser les couleurs du logo</span>
                </>
              )}
            </button>

            {/* Nuanciers de démarrage */}
            <div className="pt-2 border-t border-white/10">
              <p className="text-[11px] font-bold text-slate-400 mb-2">
                Ou démarrez depuis un nuancier prédéfini :
              </p>
              <div className="grid grid-cols-3 gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setTokens(preset.tokens);
                      setStatusMessage({ type: 'info', text: `Nuancier appliqué : ${preset.name}` });
                    }}
                    type="button"
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-slate-300 font-bold transition-all text-center cursor-pointer"
                  >
                    <span className="text-base">{preset.emoji}</span>
                    <span className="truncate w-full">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Étape 3 : Ajustements */}
          <div className="glass-panel rounded-3xl border border-white/10 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sliders className="w-4 h-4" /> Étape 3 : Ajustements & Nuances
              </span>
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() =>
                    setTokens({
                      ...tokens,
                      themeType: 'dark',
                      background: '#090A0F',
                      surface: '#121621',
                      textPrimary: '#FFFFFF',
                      textSecondary: '#CBD5E1',
                    })
                  }
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all ${
                    tokens.themeType === 'dark' ? 'bg-white/20 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTokens({
                      ...tokens,
                      themeType: 'light',
                      background: '#F8FAFC',
                      surface: '#FFFFFF',
                      textPrimary: '#0F172A',
                      textSecondary: '#475569',
                    })
                  }
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all ${
                    tokens.themeType === 'light' ? 'bg-white/20 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Light
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Primaire', key: 'primary', val: tokens.primary },
                { label: 'Secondaire', key: 'secondary', val: tokens.secondary },
                { label: 'Accent', key: 'accent', val: tokens.accent },
              ].map((item) => (
                <div key={item.key} className="rounded-2xl bg-white/5 p-3 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span>{item.label}</span>
                    <input
                      type="color"
                      value={item.val}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        const next = { ...tokens, [item.key]: newColor };
                        next.gradient = `linear-gradient(135deg, ${next.primary} 0%, ${next.secondary} 100%)`;
                        setTokens(next);
                      }}
                      className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                    />
                  </div>
                  <div
                    className="h-7 w-full rounded-lg border border-white/20 flex items-center justify-center font-mono text-[10px] font-bold text-white shadow-inner"
                    style={{ background: item.val }}
                  >
                    {item.val}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Nom joueur (flocage)
                </label>
                <input
                  type="text"
                  value={customPlayerName}
                  onChange={(e) => setCustomPlayerName(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-xs font-bold text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Numéro
                </label>
                <input
                  type="number"
                  value={customJerseyNumber}
                  onChange={(e) => setCustomJerseyNumber(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-xs font-bold text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Colonne droite : Studio ────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-6">
          {/* Onglets */}
          <div className="glass-panel rounded-2xl border border-white/10 p-2 flex flex-wrap gap-2 shadow-lg">
            {[
              { id: 'jerseys', label: 'Maillots Officiels', icon: Shirt },
              { id: 'card', label: 'Carte Club Pro', icon: Shield },
              { id: 'matchday', label: 'Affiche Matchday', icon: Calendar },
              { id: 'ui', label: 'Guide UI & Boutons', icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id as typeof activeView)}
                  type="button"
                  className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md scale-[1.02]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* VUE 1 : Maillots */}
          {activeView === 'jerseys' && (
            <div className="glass-panel rounded-3xl border border-white/10 p-6 space-y-6 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Shirt className="w-5 h-5 text-cyan-400" /> Kit Officiel de Match
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modélisation 2D dynamique aux couleurs de{' '}
                    {selectedTeam?.name || 'l’équipe sélectionnée'}
                  </p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  Édition {new Date().getFullYear()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Domicile */}
                <div
                  className="rounded-3xl p-6 border border-white/15 flex flex-col items-center justify-between relative overflow-hidden transition-transform duration-300 hover:scale-[1.02]"
                  style={{ background: tokens.background, boxShadow: tokens.shadow }}
                >
                  <div className="w-full flex justify-between items-center mb-4">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> Domicile (Home)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {selectedTeam?.city ? `${selectedTeam.city} Arena` : '—'}
                    </span>
                  </div>

                  <div className="relative w-48 h-56 flex flex-col items-center justify-center my-2">
                    <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-2xl">
                      <path
                        d="M 50 10 C 65 30 135 30 150 10 L 190 45 L 165 75 L 155 60 L 155 220 L 45 220 L 45 60 L 35 75 L 10 45 Z"
                        fill={homeKit.jerseyBase}
                        stroke={homeKit.jerseyTrims}
                        strokeWidth="4"
                      />
                      <path d="M 60 18 C 80 40 120 40 140 18" fill="none" stroke={homeKit.jerseyTrims} strokeWidth="6" />
                      <path d="M 185 47 L 163 72" stroke={homeKit.jerseyAccent} strokeWidth="4" />
                      <path d="M 15 47 L 37 72" stroke={homeKit.jerseyAccent} strokeWidth="4" />
                      <line x1="52" y1="65" x2="52" y2="215" stroke={homeKit.jerseyTrims} strokeWidth="4" />
                      <line x1="148" y1="65" x2="148" y2="215" stroke={homeKit.jerseyTrims} strokeWidth="4" />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-4">
                      <span
                        className="text-[10px] font-black tracking-widest uppercase mb-1 drop-shadow"
                        style={{ color: homeKit.textColor }}
                      >
                        {selectedTeam?.name || 'TEAM'}
                      </span>
                      <span
                        className="text-4xl font-black tracking-tighter drop-shadow-md font-mono"
                        style={{ color: homeKit.textColor }}
                      >
                        {customJerseyNumber}
                      </span>
                      <span
                        className="text-[10px] font-black tracking-wider uppercase mt-1 px-1.5 py-0.5 rounded bg-black/25"
                        style={{ color: homeKit.jerseyAccent }}
                      >
                        {customPlayerName}
                      </span>
                    </div>
                  </div>

                  <div
                    className="w-32 h-16 rounded-b-2xl border-t-2 border-white/20 flex items-center justify-center relative overflow-hidden"
                    style={{ background: homeKit.shortsBase, borderColor: homeKit.jerseyTrims }}
                  >
                    <div className="w-full flex justify-between px-3 text-[10px] font-black" style={{ color: homeKit.textColor }}>
                      <span>#HOME</span>
                      <span>#{customJerseyNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Extérieur */}
                <div
                  className="rounded-3xl p-6 border border-white/15 flex flex-col items-center justify-between relative overflow-hidden transition-transform duration-300 hover:scale-[1.02]"
                  style={{
                    background: tokens.themeType === 'dark' ? '#0F172A' : '#FFFFFF',
                    boxShadow: tokens.shadow,
                  }}
                >
                  <div className="w-full flex justify-between items-center mb-4">
                    <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Extérieur (Away)
                    </span>
                    <span className="text-[10px] text-slate-400">Match Extérieur</span>
                  </div>

                  <div className="relative w-48 h-56 flex flex-col items-center justify-center my-2">
                    <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-2xl">
                      <path
                        d="M 50 10 C 65 30 135 30 150 10 L 190 45 L 165 75 L 155 60 L 155 220 L 45 220 L 45 60 L 35 75 L 10 45 Z"
                        fill={awayKit.jerseyBase}
                        stroke={awayKit.jerseyTrims}
                        strokeWidth="4"
                      />
                      <path d="M 60 18 C 80 40 120 40 140 18" fill="none" stroke={awayKit.jerseyTrims} strokeWidth="6" />
                      <path d="M 185 47 L 163 72" stroke={awayKit.jerseyAccent} strokeWidth="4" />
                      <path d="M 15 47 L 37 72" stroke={awayKit.jerseyAccent} strokeWidth="4" />
                      <line x1="52" y1="65" x2="52" y2="215" stroke={awayKit.jerseyTrims} strokeWidth="4" />
                      <line x1="148" y1="65" x2="148" y2="215" stroke={awayKit.jerseyTrims} strokeWidth="4" />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-4">
                      <span
                        className="text-[10px] font-black tracking-widest uppercase mb-1 drop-shadow"
                        style={{ color: awayKit.textColor }}
                      >
                        {selectedTeam?.name || 'TEAM'}
                      </span>
                      <span
                        className="text-4xl font-black tracking-tighter drop-shadow-md font-mono"
                        style={{ color: awayKit.jerseyTrims }}
                      >
                        {customJerseyNumber}
                      </span>
                      <span
                        className="text-[10px] font-black tracking-wider uppercase mt-1 px-1.5 py-0.5 rounded bg-black/10"
                        style={{ color: awayKit.jerseyAccent }}
                      >
                        {customPlayerName}
                      </span>
                    </div>
                  </div>

                  <div
                    className="w-32 h-16 rounded-b-2xl border-t-2 border-white/20 flex items-center justify-center relative overflow-hidden"
                    style={{ background: awayKit.shortsBase, borderColor: awayKit.jerseyTrims }}
                  >
                    <div className="w-full flex justify-between px-3 text-[10px] font-black" style={{ color: awayKit.textColor }}>
                      <span>#AWAY</span>
                      <span>#{customJerseyNumber}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VUE 2 : Carte Club */}
          {activeView === 'card' && (
            <div className="glass-panel rounded-3xl border border-white/10 p-6 space-y-6 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" /> Carte Club Pro & Roster Badge
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  ID: {selectedTeam?.slug || '—'}
                </span>
              </div>

              <div
                className="rounded-3xl p-8 border border-white/20 relative overflow-hidden shadow-2xl transition-all"
                style={{
                  background: tokens.surface,
                  color: tokens.textPrimary,
                  boxShadow: tokens.glow,
                }}
              >
                <div
                  className="absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none"
                  style={{ background: tokens.primary }}
                />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div
                      className="w-20 h-20 rounded-2xl p-1 flex items-center justify-center shadow-xl border-2"
                      style={{ background: tokens.background, borderColor: tokens.accent }}
                    >
                      {logoPreviewUrl ? (
                        <img src={logoPreviewUrl} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Flame className="w-10 h-10" style={{ color: tokens.primary }} />
                      )}
                    </div>

                    <div>
                      <div
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1"
                        style={{ background: `${tokens.primary}25`, color: tokens.secondary }}
                      >
                        <Trophy className="w-3 h-3" />
                        Division {selectedTeam?.category || '—'}
                      </div>
                      <h4 className="text-2xl font-black tracking-tight" style={{ color: tokens.textPrimary }}>
                        {selectedTeam?.name || 'Équipe non sélectionnée'}
                      </h4>
                      <p className="text-xs flex items-center gap-2 mt-1" style={{ color: tokens.textSecondary }}>
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        {selectedTeam?.city || '—'}, Togo
                        {selectedTeam?.foundedYear ? ` • Fondé en ${selectedTeam.foundedYear}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Contraste WCAG</p>
                      <p className="text-xl font-black font-mono text-emerald-400">
                        {tokens.contrastRatio || 5.4} : 1
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-2xl bg-white/5 p-3">
                    <p className="text-[10px] uppercase font-bold" style={{ color: tokens.textSecondary }}>
                      Bilan
                    </p>
                    <p className="text-lg font-black text-white">
                      {selectedTeam?.record || '—'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3">
                    <p className="text-[10px] uppercase font-bold" style={{ color: tokens.textSecondary }}>
                      Division
                    </p>
                    <p className="text-lg font-black text-white">
                      {selectedTeam?.division || selectedTeam?.category || '—'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3">
                    <p className="text-[10px] uppercase font-bold" style={{ color: tokens.textSecondary }}>
                      Coach
                    </p>
                    <p className="text-lg font-black text-white">
                      {selectedTeam?.coachName || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VUE 3 : Affiche Matchday */}
          {activeView === 'matchday' && (
            <div className="glass-panel rounded-3xl border border-white/10 p-6 space-y-6 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-400" /> Affiche Matchday Automatique
                </h3>
                <span className="text-xs text-slate-400">Génération aux couleurs de l'équipe</span>
              </div>

              <div
                className="rounded-3xl p-8 border border-white/20 relative overflow-hidden shadow-2xl min-h-[300px] flex flex-col justify-between"
                style={{ background: tokens.matchdayGradient || tokens.background, color: tokens.textPrimary }}
              >
                <div className="flex justify-between items-center">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
                    style={{ background: tokens.primary, color: tokens.textPrimary }}
                  >
                    MATCHDAY • LIGUE
                  </span>
                  <span className="text-xs font-bold" style={{ color: tokens.secondary }}>
                    Affiche générée automatiquement
                  </span>
                </div>

                <div className="my-6 grid grid-cols-3 items-center text-center">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border mb-2"
                      style={{ background: tokens.surface, borderColor: tokens.accent }}
                    >
                      {logoPreviewUrl ? (
                        <img src={logoPreviewUrl} alt="Logo" className="w-10 h-10 object-contain" />
                      ) : (
                        <Flame className="w-8 h-8" style={{ color: tokens.primary }} />
                      )}
                    </div>
                    <h5 className="text-sm font-black tracking-tight">
                      {selectedTeam?.name || 'Équipe'}
                    </h5>
                    <span className="text-[10px] text-slate-400">DOMICILE</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-black italic tracking-widest text-white/40 mb-1">VS</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300">
                      Lieu à définir
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/20 flex items-center justify-center shadow-lg mb-2 text-2xl">
                      🏀
                    </div>
                    <h5 className="text-sm font-black tracking-tight">Adversaire</h5>
                    <span className="text-[10px] text-slate-400">EXTÉRIEUR</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/10 text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" /> Diffusé en direct sur FIRE STONE Live
                  </span>
                  <button
                    type="button"
                    className="px-4 py-1.5 rounded-xl text-xs font-black shadow-md cursor-pointer"
                    style={{ background: tokens.gradient, color: tokens.textPrimary }}
                  >
                    Billetterie QR
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 text-center italic flex items-center justify-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Cette affiche utilise des données de démonstration. Les vrais matchs apparaîtront
                automatiquement ici une fois programmés.
              </p>
            </div>
          )}

          {/* VUE 4 : Guide UI */}
          {activeView === 'ui' && (
            <div className="glass-panel rounded-3xl border border-white/10 p-6 space-y-6 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" /> Système de Design & Tokens UI
                </h3>
                <span className="text-xs text-slate-400">Composants thématisés</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { name: 'Primary (Action)', color: tokens.primary },
                  { name: 'Secondary (Focus)', color: tokens.secondary },
                  { name: 'Accent (Glow)', color: tokens.accent },
                  { name: 'Background', color: tokens.background },
                  { name: 'Surface', color: tokens.surface },
                  { name: 'Border Tone', color: tokens.border },
                ].map((token) => (
                  <div key={token.name} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div
                      className="w-10 h-10 rounded-xl shadow-inner border border-white/20 flex-shrink-0"
                      style={{ background: token.color }}
                    />
                    <div className="truncate">
                      <p className="text-[10px] text-slate-400 font-bold">{token.name}</p>
                      <p className="text-xs font-mono font-black text-white">{token.color}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10">
                <p className="text-xs font-bold text-slate-300">Exemples de composants interactifs :</p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-xl font-black text-xs shadow-lg transition-transform hover:scale-105"
                    style={{ background: tokens.gradient, color: tokens.textPrimary }}
                  >
                    Bouton CTA Gradient
                  </button>

                  <button
                    type="button"
                    className="px-4 py-2.5 rounded-xl font-bold text-xs border transition-colors"
                    style={{ borderColor: tokens.border, background: tokens.surface, color: tokens.accent }}
                  >
                    Bouton Secondaire Glow
                  </button>

                  <span
                    className="px-3 py-1 rounded-full text-xs font-black border"
                    style={{
                      background: `${tokens.primary}20`,
                      borderColor: `${tokens.primary}60`,
                      color: tokens.secondary,
                    }}
                  >
                    Badge Victoire
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}