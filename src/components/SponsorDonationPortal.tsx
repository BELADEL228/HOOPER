import React, { useState } from 'react';
import { mockSponsors } from '../data/mockData';
import { ShieldCheck, Heart, Award, CheckCircle, ExternalLink, Sparkles } from 'lucide-react';

export const SponsorDonationPortal: React.FC = () => {
  const [donationAmount, setDonationAmount] = useState<number>(50000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [donorEmail, setDonorEmail] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const selectedDonation = customAmount ? parseFloat(customAmount) : donationAmount;

  const handleDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName || !donorEmail || selectedDonation <= 0) return;
    setIsSubmitted(true);
  };

  return (
    <div className="space-y-12 pb-12">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5" /> Partenariats & Soutien
        </div>
        <h2 className="text-3xl font-extrabold text-white">Devenez Partenaire de FIRE STONE</h2>
        <p className="text-slate-400 text-sm">Soutenez le club de Lomé, la jeunesse togolaise et le développement du basket au quartier d'Adétikopé.</p>
      </div>

      {/* Existing Official Sponsors Wall */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-[#FFB800]" /> Nos Sponsors Officiels 2026-2027
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockSponsors.map((sponsor) => (
            <div key={sponsor.id} className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{sponsor.logo}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    sponsor.tier === 'PLATINE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-500/20 text-slate-300'
                  }`}>
                    Partenaire {sponsor.tier}
                  </span>
                </div>
                <h4 className="text-xl font-bold text-white">{sponsor.name}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{sponsor.description}</p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-[#FFB800] font-semibold">{sponsor.contribution}</span>
                <a href={sponsor.website} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white flex items-center gap-1">
                  Site web <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Donation & Sponsoring Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form: Donation */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
              <Heart className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Faire un Don au Club</h3>
              <p className="text-xs text-slate-400">Soutien direct au développement du basket à Lomé et dans le quartier d'Adétikopé.</p>
            </div>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleDonationSubmit} className="space-y-5 text-xs">
              
              {/* Predefined Amounts */}
              <div>
                <label className="block text-slate-300 font-medium mb-2">Choisissez un montant</label>
                <div className="grid grid-cols-4 gap-3">
                  {[50000, 100000, 250000, 500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setDonationAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`py-3 rounded-xl font-black text-sm transition-all border ${
                        donationAmount === amt && !customAmount
                          ? 'bg-[#FF2A3B] text-white border-[#FF2A3B] shadow-lg shadow-red-500/20'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {amt.toLocaleString('fr-TG')} FCFA
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Ou montant libre (FCFA)</label>
                <input
                  type="number"
                  placeholder="Ex: 750000"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nom / Entreprise</label>
                  <input
                    type="text"
                    required
                    placeholder="Jean Dupont"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Adresse Email</label>
                  <input
                    type="email"
                    required
                    placeholder="jean.dupont@example.com"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl space-y-1">
                <div className="flex items-center justify-between font-bold text-white text-xs">
                  <span>Impact réel du soutien :</span>
                  <span className="text-emerald-400 font-black text-base">{selectedDonation.toLocaleString('fr-TG')} FCFA</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Votre contribution aide directement le club à financer les entraînements, le transport, le terrain et les activités académiques à Lomé.
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#E60023] text-white font-black text-sm shadow-lg shadow-red-500/30 hover:scale-[1.01] transition-all"
              >
                Confirmer le soutien de {selectedDonation.toLocaleString('fr-TG')} FCFA
              </button>
            </form>
          ) : (
            <div className="bg-emerald-500/20 border border-emerald-500/40 p-6 rounded-2xl text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
              <h4 className="text-xl font-bold text-white">Merci pour votre soutien !</h4>
              <p className="text-xs text-slate-300">
                Un e-mail de confirmation pour **{donorName}** ({selectedDonation.toLocaleString('fr-TG')} FCFA) vient d'être généré.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600"
              >
                Effectuer un autre don
              </button>
            </div>
          )}
        </div>

        {/* Right Info: Sponsoring Packages */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-white/15 space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#FFB800] uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Offres de Sponsoring Entreprise
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-amber-500/30 space-y-2">
              <div className="flex justify-between items-center font-bold text-white text-sm">
                <span>Pack Platine</span>
                <span className="text-gradient-gold font-black">5 000 000 FCFA / an</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                <li>Logo principal sur maillot & survêtements</li>
                <li>Bannière géante au terrain du Lycée d'Adétikopé</li>
                <li>Accès VIP 10 places réservées chaque match</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-slate-500/30 space-y-2">
              <div className="flex justify-between items-center font-bold text-white text-sm">
                <span>Pack Or</span>
                <span className="text-amber-400 font-black">2 500 000 FCFA / an</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                <li>Logo sur short & site web officiel</li>
                <li>Mentions réseaux sociaux & interviews</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
