import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Heart,
  Award,
  CheckCircle,
  ExternalLink,
  Sparkles,
  Building2,
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { apiUrl } from '../../services/api';
import { useClub } from '../../context/ClubContext';

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  tier: 'PLATINE' | 'OR' | 'ARGENT';
  description: string;
  website: string;
  contribution: string;
}

export const SponsorDonationPortal: React.FC = () => {
  const { activeClub } = useClub();
  const primaryColor = activeClub?.primaryColor || '#FF2A3B';

  const [activeTab, setActiveTab] = useState<'PACKS' | 'DONATION' | 'PARTNERSHIP' | 'SPONSORS'>('PACKS');
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);

  // État du don
  const [donationAmount, setDonationAmount] = useState<number>(25000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donationCause, setDonationCause] = useState<string>('ACADEMY');
  const [paymentProvider, setPaymentProvider] = useState<'TMONEY' | 'FLOOZ' | 'CARD'>('TMONEY');
  const [donorName, setDonorName] = useState<string>('');
  const [donorEmail, setDonorEmail] = useState<string>('');
  const [isDonationSubmitted, setIsDonationSubmitted] = useState<boolean>(false);
  const [donationProcessing, setDonationProcessing] = useState<boolean>(false);

  // État du formulaire partenariat B2B
  const [partnershipForm, setPartnershipForm] = useState({
    companyName: '',
    teamId: '',
    type: 'SPONSORING',
    title: 'Partenariat Officiel 2026-2027',
    message: '',
    budget: '2500000',
  });
  const [partnershipSubmitting, setPartnershipSubmitting] = useState(false);
  const [partnershipMessage, setPartnershipMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Charger les sponsors et équipes
    fetch(apiUrl('/sponsors'))
      .then(async (res) => {
        if (res.ok) {
          const remote = (await res.json()) as Array<{
            id: string;
            companyName: string;
            logoUrl?: string | null;
            description?: string | null;
            website?: string | null;
          }>;
          setSponsors(
            remote.map((s, idx) => ({
              id: s.id,
              name: s.companyName,
              logo: s.logoUrl || '🏢',
              tier: idx % 3 === 0 ? 'PLATINE' : idx % 3 === 1 ? 'OR' : 'ARGENT',
              description: s.description || 'Partenaire engagé pour le développement du basketball togolais.',
              website: s.website || '#',
              contribution: 'Sponsor Officiel de la Franchise',
            }))
          );
        }
      })
      .catch(() => undefined);

    fetch(apiUrl('/teams'))
      .then(async (res) => {
        if (res.ok) setTeams(await res.json());
      })
      .catch(() => undefined);
  }, []);

  const selectedDonation = customAmount ? parseFloat(customAmount) || 0 : donationAmount;

  const handleDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName || !donorEmail || selectedDonation <= 0) return;
    setDonationProcessing(true);
    setTimeout(() => {
      setDonationProcessing(false);
      setIsDonationSubmitted(true);
    }, 1200);
  };

  const handlePartnershipSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPartnershipSubmitting(true);
    setPartnershipMessage(null);

    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (!session?.token) {
      setPartnershipMessage({
        type: 'error',
        text: 'Veuillez vous connecter pour soumettre une proposition de partenariat.',
      });
      setPartnershipSubmitting(false);
      return;
    }

    try {
      const response = await fetch(apiUrl('/sponsorship-requests'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          ...partnershipForm,
          budget: partnershipForm.budget ? Number(partnershipForm.budget) : undefined,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setPartnershipMessage({
          type: 'success',
          text: `Votre dossier de partenariat pour « ${activeClub.name} » a été transmis à la direction du club. Vous recevrez une réponse sous 24h.`,
        });
        setPartnershipForm({
          companyName: '',
          teamId: '',
          type: 'SPONSORING',
          title: '',
          message: '',
          budget: '',
        });
      } else {
        setPartnershipMessage({
          type: 'error',
          text: data?.error || 'Échec de la transmission du dossier.',
        });
      }
    } catch {
      setPartnershipMessage({
        type: 'error',
        text: 'Erreur réseau lors de la soumission de la proposition.',
      });
    } finally {
      setPartnershipSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ── En-tête Principal dynamique avec l'identité du Club ── */}
      <header className="rounded-3xl border border-white/10 p-6 sm:p-8 overflow-hidden relative"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}30, #090A0F 80%)`,
        }}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-300">
              <ShieldCheck className="w-3.5 h-3.5" /> Espace Partenariats & Mécénat
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Devenez Partenaire de <span className="text-[#FFB800]">{activeClub.name}</span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Associez votre entreprise aux valeurs de performance, d'inclusion et d'impact social de {activeClub.name} à {activeClub.city || 'Lomé'}. Soutenez nos équipes professionnelles et notre académie de jeunes talents.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('PARTNERSHIP')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#FF2A3B] text-white text-xs font-black hover:brightness-110 transition-all shadow-lg cursor-pointer"
            >
              Déposer une offre B2B
            </button>
            <button
              onClick={() => setActiveTab('DONATION')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer border border-white/10"
            >
              Faire un don direct
            </button>
          </div>
        </div>
      </header>

      {/* ── Navigation par Onglets ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('PACKS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'PACKS'
              ? 'bg-[#FF2A3B] text-white'
              : 'bg-white/5 hover:bg-white/10 text-slate-300'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Packs Sponsoring
        </button>

        <button
          onClick={() => setActiveTab('PARTNERSHIP')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'PARTNERSHIP'
              ? 'bg-[#FF2A3B] text-white'
              : 'bg-white/5 hover:bg-white/10 text-slate-300'
          }`}
        >
          <Building2 className="w-4 h-4" /> Proposer un Partenariat B2B
        </button>

        <button
          onClick={() => setActiveTab('DONATION')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'DONATION'
              ? 'bg-[#FF2A3B] text-white'
              : 'bg-white/5 hover:bg-white/10 text-slate-300'
          }`}
        >
          <Heart className="w-4 h-4" /> Fonds de Soutien & Dons
        </button>

        <button
          onClick={() => setActiveTab('SPONSORS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'SPONSORS'
              ? 'bg-[#FF2A3B] text-white'
              : 'bg-white/5 hover:bg-white/10 text-slate-300'
          }`}
        >
          <Award className="w-4 h-4" /> Sponsors Officiels ({sponsors.length})
        </button>
      </div>

      {/* ── 1. ONGLET PACKS SPONSORING ── */}
      {activeTab === 'PACKS' && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-black text-white">Nos Offres de Sponsoring Officiel</h2>
            <p className="text-xs text-slate-400">
              Des opportunités de visibilité omnicanale : maillots, panneautique arène, activations digitales et hospitalités VIP.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pack Platine */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border-2 border-amber-500/40 relative flex flex-col justify-between space-y-6 shadow-xl shadow-amber-500/10 bg-gradient-to-b from-amber-500/10 to-transparent">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Majeur & Exclusif
                  </span>
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white">Pack Platine</h3>
                  <div className="mt-2 text-2xl sm:text-3xl font-black text-gradient-gold">
                    5 000 000 FCFA <span className="text-xs text-slate-400 font-normal">/ an</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">
                    Le statut de partenaire titre de la franchise {activeClub.name}.
                  </p>
                </div>

                <ul className="text-xs text-slate-300 space-y-2.5 pt-4 border-t border-white/10">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Logo principal face avant sur tous les maillots officiels & survêtements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Bannière géante centrale & branding terrain domicile ({activeClub.city})</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Espace VIP 10 sièges réservés à chaque match & cocktails dirigeants</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Diffusion de vos spots publicitaires sur notre Live Center & flux streaming</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setPartnershipForm((prev) => ({
                    ...prev,
                    title: `Candidature Pack Platine (${activeClub.name})`,
                    budget: '5000000',
                  }));
                  setActiveTab('PARTNERSHIP');
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs hover:brightness-110 transition-all cursor-pointer shadow-md"
              >
                Sélectionner le Pack Platine
              </button>
            </div>

            {/* Pack Or */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-white/10 text-slate-300 border border-white/10">
                    Visibilité Principale
                  </span>
                  <Award className="w-5 h-5 text-[#FFB800]" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white">Pack Or</h3>
                  <div className="mt-2 text-2xl sm:text-3xl font-black text-white">
                    2 500 000 FCFA <span className="text-xs text-slate-400 font-normal">/ an</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">
                    Idéal pour accroître votre notoriété auprès de la jeunesse sportive togolaise.
                  </p>
                </div>

                <ul className="text-xs text-slate-300 space-y-2.5 pt-4 border-t border-white/10">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Logo officiel sur le dos des maillots ou shorts de match</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Panneaux latéraux sur le bord du terrain lors des journées de championnat</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Mention sponsor sur toutes nos publications & stories officielles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>4 pass VIP pour la saison régulière</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setPartnershipForm((prev) => ({
                    ...prev,
                    title: `Candidature Pack Or (${activeClub.name})`,
                    budget: '2500000',
                  }));
                  setActiveTab('PARTNERSHIP');
                }}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Sélectionner le Pack Or
              </button>
            </div>

            {/* Pack Argent */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-slate-500/20 text-slate-400">
                    Soutien Régional
                  </span>
                  <ShieldCheck className="w-5 h-5 text-slate-400" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white">Pack Argent</h3>
                  <div className="mt-2 text-2xl sm:text-3xl font-black text-white">
                    1 000 000 FCFA <span className="text-xs text-slate-400 font-normal">/ an</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">
                    Accompagnez l'équipe première et bénéficiez de visibilité locale.
                  </p>
                </div>

                <ul className="text-xs text-slate-300 space-y-2.5 pt-4 border-t border-white/10">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Logo présent sur le site web et la fiche officielle du club</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Remise de trophée et nomination d'un Homme du Match sponsorisé</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>2 invitations pour chaque rencontre à domicile</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setPartnershipForm((prev) => ({
                    ...prev,
                    title: `Candidature Pack Argent (${activeClub.name})`,
                    budget: '1000000',
                  }));
                  setActiveTab('PARTNERSHIP');
                }}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Sélectionner le Pack Argent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. ONGLET PROPOSER UN PARTENARIAT B2B ── */}
      {activeTab === 'PARTNERSHIP' && (
        <div className="max-w-3xl mx-auto glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 space-y-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Dossier de Partenariat Professionnel</h3>
                <p className="text-xs text-slate-400">
                  Présentez votre entreprise et transmettez votre proposition à la direction de {activeClub.name}.
                </p>
              </div>
            </div>
          </div>

          {partnershipMessage && (
            <div
              className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 ${
                partnershipMessage.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-red-500/30 bg-red-500/10 text-red-300'
              }`}
            >
              {partnershipMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              )}
              <span>{partnershipMessage.text}</span>
            </div>
          )}

          <form onSubmit={handlePartnershipSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Raison sociale de l'entreprise
                </label>
                <input
                  required
                  placeholder="Ex : Groupe Togocom, TotalEnergies, Startup..."
                  value={partnershipForm.companyName}
                  onChange={(e) => setPartnershipForm({ ...partnershipForm, companyName: e.target.value })}
                  className="glass-input w-full rounded-xl p-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Équipe bénéficiaire
                </label>
                <select
                  required
                  value={partnershipForm.teamId}
                  onChange={(e) => setPartnershipForm({ ...partnershipForm, teamId: e.target.value })}
                  className="glass-input w-full rounded-xl p-3 text-xs bg-slate-900 text-white"
                >
                  <option value="">Sélectionner une équipe...</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Titre du projet de sponsoring
                </label>
                <input
                  required
                  placeholder="Ex : Sponsoring Maillot Saison 2026-2027"
                  value={partnershipForm.title}
                  onChange={(e) => setPartnershipForm({ ...partnershipForm, title: e.target.value })}
                  className="glass-input w-full rounded-xl p-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Budget indicatif (FCFA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  placeholder="2500000"
                  value={partnershipForm.budget}
                  onChange={(e) => setPartnershipForm({ ...partnershipForm, budget: e.target.value })}
                  className="glass-input w-full rounded-xl p-3 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Détail de votre offre & objectifs marketing
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Exposez les activations souhaitées, visibilité, présence événementielle ou dotation en équipement..."
                  value={partnershipForm.message}
                  onChange={(e) => setPartnershipForm({ ...partnershipForm, message: e.target.value })}
                  className="glass-input w-full rounded-xl p-3 text-xs"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={partnershipSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#FF2A3B] text-white font-black text-xs hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer shadow-lg"
              >
                {partnershipSubmitting ? 'Transmission en cours...' : 'Envoyer la proposition officielle'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── 3. ONGLET FONDS DE SOUTIEN & DONS ── */}
      {activeTab === 'DONATION' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Formulaire Don */}
          <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
                <Heart className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Faire un Don à {activeClub.name}</h3>
                <p className="text-xs text-slate-400">
                  Soutenez directement les athlètes, les jeunes de l'académie et nos infrastructures à {activeClub.city || 'Lomé'}.
                </p>
              </div>
            </div>

            {!isDonationSubmitted ? (
              <form onSubmit={handleDonationSubmit} className="space-y-5 text-xs">
                {/* Cause affectée */}
                <div>
                  <label className="block text-slate-300 font-bold mb-2">
                    Affectation de votre contribution
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { id: 'ACADEMY', label: '🎓 Équipements & Bourses Jeunes' },
                      { id: 'COURT', label: '🏀 Rénovation du Terrain & Paniers' },
                      { id: 'TRAVEL', label: '🚌 Déplacements & Matchs Extérieurs' },
                      { id: 'MEDICAL', label: '🩹 Soins & Suivi Médical des Joueurs' },
                    ].map((cause) => (
                      <button
                        key={cause.id}
                        type="button"
                        onClick={() => setDonationCause(cause.id)}
                        className={`p-3 rounded-xl text-left font-bold transition-all border ${
                          donationCause === cause.id
                            ? 'bg-[#FF2A3B]/20 text-white border-[#FF2A3B]'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {cause.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Montants Prédéfinis */}
                <div>
                  <label className="block text-slate-300 font-bold mb-2">Choisissez un montant</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[10000, 25000, 50000, 100000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setDonationAmount(amt);
                          setCustomAmount('');
                        }}
                        className={`py-3 rounded-xl font-black text-xs transition-all border ${
                          donationAmount === amt && !customAmount
                            ? 'bg-[#FF2A3B] text-white border-[#FF2A3B] shadow-lg'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {amt.toLocaleString('fr-TG')} FCFA
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Ou montant libre (FCFA)</label>
                  <input
                    type="number"
                    min="1000"
                    placeholder="Ex : 150000"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="glass-input w-full rounded-xl p-3 text-xs"
                  />
                </div>

                {/* Moyen de Paiement */}
                <div>
                  <label className="block text-slate-300 font-bold mb-2">Moyen de paiement</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentProvider('TMONEY')}
                      className={`p-3 rounded-xl flex flex-col items-center gap-1.5 border font-bold ${
                        paymentProvider === 'TMONEY'
                          ? 'border-yellow-500 bg-yellow-500/10 text-yellow-300'
                          : 'border-white/10 bg-white/5 text-slate-400'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>T-Money</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentProvider('FLOOZ')}
                      className={`p-3 rounded-xl flex flex-col items-center gap-1.5 border font-bold ${
                        paymentProvider === 'FLOOZ'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                          : 'border-white/10 bg-white/5 text-slate-400'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Moov Flooz</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentProvider('CARD')}
                      className={`p-3 rounded-xl flex flex-col items-center gap-1.5 border font-bold ${
                        paymentProvider === 'CARD'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-white/10 bg-white/5 text-slate-400'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Carte Bancaire</span>
                    </button>
                  </div>
                </div>

                {/* Coordonnées */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Nom / Donateur</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex : Koffi Mensah"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="glass-input w-full rounded-xl p-3 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Email pour le reçu</label>
                    <input
                      type="email"
                      required
                      placeholder="koffi@example.tg"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      className="glass-input w-full rounded-xl p-3 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={donationProcessing}
                  className="w-full py-3.5 rounded-xl bg-[#FF2A3B] text-white font-black text-xs hover:brightness-110 transition-all cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {donationProcessing
                    ? 'Traitement sécurisé en cours...'
                    : `Confirmer le soutien de ${selectedDonation.toLocaleString('fr-TG')} FCFA`}
                </button>
              </form>
            ) : (
              <div className="p-8 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-4">
                <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto" />
                <h4 className="text-2xl font-black text-white">Merci pour votre générosité !</h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Votre contribution de <strong>{selectedDonation.toLocaleString('fr-TG')} FCFA</strong> via{' '}
                  {paymentProvider} a été enregistrée avec succès pour <strong>{activeClub.name}</strong>.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setIsDonationSubmitted(false);
                      setCustomAmount('');
                    }}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs transition-colors cursor-pointer"
                  >
                    Effectuer une nouvelle contribution
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Impact Info */}
          <div className="lg:col-span-5 glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 space-y-6">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FFB800]" /> Transparence & Impact Direct
            </h3>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> 100% Réinvesti localement
                </div>
                <p className="text-[11px] text-slate-400">
                  Chaque franc collecté est alloué aux stages de formation des jeunes, aux ballons certifiés FIBA et à l'entretien de l'arène de {activeClub.name}.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8]" /> Reçu fiscal certifié
                </div>
                <p className="text-[11px] text-slate-400">
                  Un certificat de donation officiel vous est instantanément envoyé par e-mail pour justifier vos dépenses de mécénat ou sponsoring.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 text-center">
              <span className="text-[11px] text-slate-400">
                Une question sur le mécénat ? Contactez la direction :{' '}
                <strong className="text-white">+228 79 83 30 34</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. ONGLET SPONSORS OFFICIELS ── */}
      {activeTab === 'SPONSORS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-[#FFB800]" /> Entreprises & Marques Partenaires
              </h3>
              <p className="text-xs text-slate-400">
                Les organisations qui investissent activement dans le rayonnement de {activeClub.name}.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sponsors.map((sponsor) => (
              <div
                key={sponsor.id}
                className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 flex flex-col justify-between hover:border-white/20 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{sponsor.logo}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        sponsor.tier === 'PLATINE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : sponsor.tier === 'OR'
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                          : 'bg-slate-500/20 text-slate-300'
                      }`}
                    >
                      Partenaire {sponsor.tier}
                    </span>
                  </div>

                  <h4 className="text-xl font-bold text-white">{sponsor.name}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{sponsor.description}</p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[#FFB800] font-semibold">{sponsor.contribution}</span>
                  <a
                    href={sponsor.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    Visiter <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
