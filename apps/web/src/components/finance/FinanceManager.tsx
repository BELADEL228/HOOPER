import React, { useState, useEffect } from 'react';
import type { FinancialTransaction } from '../../types';
import { Wallet, TrendingUp, TrendingDown, FileText, Plus, CheckCircle, Clock, Download, Filter, Loader2 } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { clubApi } from '../../services/clubApi';

export const FinanceManager: React.FC = () => {
  const { activeClub } = useClub();
  const clubId = activeClub?.clubId || activeClub?.id;
  const token = (() => {
    try {
      return JSON.parse(localStorage.getItem('firestone-auth') || '{}').token || '';
    } catch {
      return '';
    }
  })();

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [newCategory, setNewCategory] = useState<FinancialTransaction['category']>('Cotisation');
  const [newOrg, setNewOrg] = useState('');

  useEffect(() => {
    if (!clubId || clubId === 'pending-club') return;
    let isMounted = true;
    setLoading(true);
    clubApi.fetchClubTransactions(clubId, token)
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setTransactions(data.map((item: any) => ({
            id: item.id,
            date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            description: item.description,
            category: item.category || 'Cotisation',
            amount: Number(item.amount) || 0,
            type: item.type || 'INCOME',
            userOrOrg: item.userOrOrg || (item.user ? item.user.name : 'Club'),
            status: item.status || 'PAYÉ',
            proofUrl: item.proofUrl,
          })));
        }
      })
      .catch((err) => console.warn('Erreur chargement transactions:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [clubId, token]);

  const totalIncome = transactions.filter((t) => t.type === 'INCOME' && t.status === 'PAYÉ').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'EXPENSE' && t.status === 'PAYÉ').reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter((t) => {
    if (filterCategory === 'ALL') return true;
    return t.category === filterCategory;
  });

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc || !newAmount) return;
    const numAmount = parseFloat(newAmount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    try {
      if (token && clubId && clubId !== 'pending-club') {
        const created = await clubApi.createClubTransaction(clubId, {
          description: newDesc,
          category: newCategory,
          amount: numAmount,
          type: newType,
          userOrOrg: newOrg || 'Club',
          status: 'PAYÉ',
        }, token);

        const item: FinancialTransaction = {
          id: created.id || `t_${Date.now()}`,
          date: created.date ? new Date(created.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          description: created.description,
          category: (created.category || newCategory) as any,
          amount: Number(created.amount) || numAmount,
          type: (created.type || newType) as any,
          userOrOrg: created.userOrOrg || newOrg || 'Club',
          status: (created.status || 'PAYÉ') as any,
        };
        setTransactions((prev) => [item, ...prev]);
      } else {
        const item: FinancialTransaction = {
          id: `t_${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          description: newDesc,
          category: newCategory,
          amount: numAmount,
          type: newType,
          userOrOrg: newOrg || 'Club',
          status: 'PAYÉ',
        };
        setTransactions((prev) => [item, ...prev]);
      }
      setShowAddModal(false);
      setNewDesc('');
      setNewAmount('');
      setNewOrg('');
    } catch (err) {
      console.error('Erreur enregistrement transaction:', err);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Wallet className="w-3.5 h-3.5" /> Espace Trésorerie & Comptabilité
          </div>
          <h2 className="text-3xl font-extrabold text-white">Gestion Financière du Club</h2>
          <p className="text-slate-400 text-sm">Suivi des cotisations des joueurs, dépenses de fonctionnement et reçus de sponsoring.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Transaction</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Solde Net Actuel</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">{netBalance.toLocaleString('fr-TG')} FCFA</div>
          <div className="text-xs text-emerald-400 font-medium">Compte bancaire {activeClub?.name || 'Club'}</div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Recettes</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">+{totalIncome.toLocaleString('fr-TG')} FCFA</div>
          <div className="text-xs text-slate-400">Sponsoring, cotisations, buvette</div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Dépenses</span>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-black text-red-400">-{totalExpense.toLocaleString('fr-TG')} FCFA</div>
          <div className="text-xs text-slate-400">Équipements, déplacements, arbitrages</div>
        </div>

      </div>

      {/* Main Ledger Table */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#FFB800]" /> Journal des Transactions
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          </h3>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="ALL" className="bg-[#090A0F]">Toutes les catégories</option>
              <option value="Cotisation" className="bg-[#090A0F]">Cotisations</option>
              <option value="Sponsoring" className="bg-[#090A0F]">Sponsoring</option>
              <option value="Équipement" className="bg-[#090A0F]">Équipements</option>
              <option value="Déplacement" className="bg-[#090A0F]">Déplacements</option>
              <option value="Événement" className="bg-[#090A0F]">Événements</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-white/10 text-slate-400 uppercase font-bold text-[10px]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-3 py-3">Catégorie</th>
                <th className="px-3 py-3">Entité / Joueur</th>
                <th className="px-3 py-3 text-right">Montant</th>
                <th className="px-3 py-3 text-center">Statut</th>
                <th className="px-3 py-3 text-center">Justificatif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    {loading ? 'Chargement des transactions...' : 'Aucune transaction enregistrée.'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-slate-400 font-mono">{t.date}</td>
                    <td className="px-4 py-3 font-bold text-white">{t.description}</td>
                    <td className="px-3 py-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[10px] font-semibold">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-300">{t.userOrOrg}</td>
                    <td className={`px-3 py-3 text-right font-black text-sm ${
                      t.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {t.type === 'INCOME' ? '+' : '-'}{t.amount.toLocaleString('fr-TG')} FCFA
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.status === 'PAYÉ' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {t.status === 'PAYÉ' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {t.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors" title="Télécharger le reçu">
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel rounded-3xl border border-white/20 max-w-md w-full p-6 space-y-5">
            <h3 className="text-xl font-bold text-white">Ajouter une Transaction</h3>
            
            <form onSubmit={handleAddTransaction} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Achat ballons d'entraînement"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Montant (FCFA)</label>
                  <input
                    type="number"
                    required
                    placeholder="25000"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as 'INCOME' | 'EXPENSE')}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input bg-[#090A0F]"
                  >
                    <option value="INCOME">Recette (+)</option>
                    <option value="EXPENSE">Dépense (-)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Catégorie</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input bg-[#090A0F]"
                  >
                    <option value="Cotisation">Cotisation</option>
                    <option value="Sponsoring">Sponsoring</option>
                    <option value="Équipement">Équipement</option>
                    <option value="Déplacement">Déplacement</option>
                    <option value="Événement">Événement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Organisme / Joueur</label>
                  <input
                    type="text"
                    placeholder="Ex: Decathlon"
                    value={newOrg}
                    onChange={(e) => setNewOrg(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-slate-300 font-bold hover:bg-white/15 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#FF2A3B] text-white font-bold hover:bg-red-600 shadow-md cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
