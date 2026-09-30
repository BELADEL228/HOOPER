import React, { useState, useEffect, useMemo } from 'react';
import type { FinancialTransaction } from '../../types';
import {
  Wallet, TrendingUp, TrendingDown, FileText, Plus, CheckCircle,
  Clock, Download, Filter, Loader2, AlertTriangle, BarChart3,
  PieChart, ArrowUpRight, ArrowDownRight, X, Calendar, Target,
  Sparkles, Building2, Users, ShoppingBag, Car, PartyPopper, Coffee,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { clubApi } from '../../services/clubApi';

// ─── constants ───────────────────────────────────────────────────────────────

const CATEGORIES: FinancialTransaction['category'][] = [
  'Cotisation','Sponsoring','Équipement','Déplacement','Événement','Buvette',
];

const CATEGORY_META: Record<FinancialTransaction['category'],{icon: React.ReactNode; color: string; bg: string}> = {
  Cotisation:  { icon: <Users      className="w-3.5 h-3.5" />, color:'text-sky-400',    bg:'bg-sky-500/15 border-sky-500/25' },
  Sponsoring:  { icon: <Building2  className="w-3.5 h-3.5" />, color:'text-violet-400', bg:'bg-violet-500/15 border-violet-500/25' },
  Équipement:  { icon: <ShoppingBag className="w-3.5 h-3.5" />, color:'text-orange-400',bg:'bg-orange-500/15 border-orange-500/25' },
  Déplacement: { icon: <Car        className="w-3.5 h-3.5" />, color:'text-amber-400',  bg:'bg-amber-500/15 border-amber-500/25' },
  Événement:   { icon: <PartyPopper className="w-3.5 h-3.5" />, color:'text-pink-400',  bg:'bg-pink-500/15 border-pink-500/25' },
  Buvette:     { icon: <Coffee     className="w-3.5 h-3.5" />, color:'text-emerald-400',bg:'bg-emerald-500/15 border-emerald-500/25' },
};

const STATUS_META: Record<FinancialTransaction['status'],{label:string;color:string;icon:React.ReactNode}> = {
  'PAYÉ':       { label:'Payé',       color:'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon:<CheckCircle    className="w-3 h-3"/> },
  'EN ATTENTE': { label:'En attente', color:'bg-amber-500/20   text-amber-400   border-amber-500/30',   icon:<Clock         className="w-3 h-3"/> },
  'RETARD':     { label:'En retard',  color:'bg-red-500/20     text-red-400     border-red-500/30',     icon:<AlertTriangle className="w-3 h-3"/> },
};

const DONUT_COLORS: Record<FinancialTransaction['category'],string> = {
  Cotisation:'#38BDF8', Sponsoring:'#A78BFA', Équipement:'#FB923C',
  Déplacement:'#FBBF24', Événement:'#F472B6', Buvette:'#34D399',
};

function fmt(n:number){ return n.toLocaleString('fr-TG'); }

// ─── sub-components ──────────────────────────────────────────────────────────

function MiniBarChart({ data }: { data:{label:string;income:number;expense:number}[] }) {
  const maxVal = Math.max(...data.map(d=>Math.max(d.income,d.expense)),1);
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map(d=>(
        <div key={d.label} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="w-full flex items-end gap-0.5" style={{height:'72px'}}>
            <div className="flex-1 rounded-t-sm bg-emerald-500/70 transition-all duration-700"
              style={{height:`${(d.income/maxVal)*100}%`}} title={`Recettes: ${fmt(d.income)} FCFA`}/>
            <div className="flex-1 rounded-t-sm bg-red-500/60 transition-all duration-700"
              style={{height:`${(d.expense/maxVal)*100}%`}} title={`Dépenses: ${fmt(d.expense)} FCFA`}/>
          </div>
          <span className="text-[9px] text-slate-500 whitespace-nowrap">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments }: { segments:{value:number;color:string;label:string}[] }) {
  const total = segments.reduce((s,seg)=>s+seg.value,0)||1;
  const r=36,cx=44,cy=44,circ=2*Math.PI*r;
  let acc=0;
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14"/>
      {segments.filter(s=>s.value>0).map((seg,i)=>{
        const portion=seg.value/total;
        const dash=portion*circ;
        const offset=-acc*circ;
        acc+=portion;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth="14"
            strokeDasharray={`${dash} ${circ-dash}`}
            strokeDashoffset={offset} strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`} opacity="0.85">
            <title>{seg.label}: {fmt(seg.value)} FCFA</title>
          </circle>
        );
      })}
    </svg>
  );
}

// ─── main ────────────────────────────────────────────────────────────────────

export const FinanceManager: React.FC = () => {
  const { activeClub } = useClub();
  const clubId = activeClub?.clubId || activeClub?.id;
  const token = (()=>{
    try{ return JSON.parse(localStorage.getItem('firestone-auth')||'{}').token||''; } catch{ return ''; }
  })();

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterType,     setFilterType]     = useState<string>('ALL');
  const [showAddModal,   setShowAddModal]   = useState(false);
  const [activeView,     setActiveView]     = useState<'table'|'charts'>('table');

  const [newDesc,     setNewDesc]     = useState('');
  const [newAmount,   setNewAmount]   = useState('');
  const [newType,     setNewType]     = useState<'INCOME'|'EXPENSE'>('INCOME');
  const [newCategory, setNewCategory] = useState<FinancialTransaction['category']>('Cotisation');
  const [newOrg,      setNewOrg]      = useState('');
  const [newStatus,   setNewStatus]   = useState<FinancialTransaction['status']>('PAYÉ');

  useEffect(()=>{
    if (!clubId||clubId==='pending-club') return;
    let mounted=true;
    setLoading(true);
    clubApi.fetchClubTransactions(clubId,token)
      .then(data=>{
        if (mounted&&Array.isArray(data)&&data.length>0) {
          setTransactions(data.map((item:any)=>({
            id: item.id,
            date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            description: item.description,
            category: item.category||'Cotisation',
            amount: Number(item.amount)||0,
            type: item.type||'INCOME',
            userOrOrg: item.userOrOrg||(item.user?item.user.name:'Club'),
            status: item.status||'PAYÉ',
            proofUrl: item.proofUrl,
          })));
        }
      })
      .catch(err=>console.warn('Erreur chargement transactions:',err))
      .finally(()=>{ if (mounted) setLoading(false); });
    return ()=>{ mounted=false; };
  },[clubId,token]);

  const paid        = transactions.filter(t=>t.status==='PAYÉ');
  const totalIncome = paid.filter(t=>t.type==='INCOME').reduce((s,t)=>s+t.amount,0);
  const totalExpense= paid.filter(t=>t.type==='EXPENSE').reduce((s,t)=>s+t.amount,0);
  const netBalance  = totalIncome-totalExpense;
  const pendingAmt  = transactions.filter(t=>t.status==='EN ATTENTE').reduce((s,t)=>s+t.amount,0);

  const catBreakdown = useMemo(()=>CATEGORIES.map(cat=>({
    cat,
    income: transactions.filter(t=>t.category===cat&&t.type==='INCOME').reduce((s,t)=>s+t.amount,0),
    expense:transactions.filter(t=>t.category===cat&&t.type==='EXPENSE').reduce((s,t)=>s+t.amount,0),
    total:  0,
  })).map(c=>({...c,total:c.income+c.expense})).filter(c=>c.total>0),[transactions]);

  const monthlyTrend = useMemo(()=>{
    const now=new Date();
    return Array.from({length:6},(_,i)=>{
      const d=new Date(now.getFullYear(),now.getMonth()-(5-i),1);
      const label=d.toLocaleDateString('fr-FR',{month:'short'});
      const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const rel=transactions.filter(t=>t.date.startsWith(key));
      return {label,
        income: rel.filter(t=>t.type==='INCOME').reduce((s,t)=>s+t.amount,0),
        expense:rel.filter(t=>t.type==='EXPENSE').reduce((s,t)=>s+t.amount,0),
      };
    });
  },[transactions]);

  const filteredTx = useMemo(()=>transactions.filter(t=>{
    const catOk  = filterCategory==='ALL'||t.category===filterCategory;
    const typeOk = filterType==='ALL'||t.type===filterType;
    return catOk&&typeOk;
  }),[transactions,filterCategory,filterType]);

  const incomeSegs  = CATEGORIES.map(cat=>({label:cat,value:transactions.filter(t=>t.category===cat&&t.type==='INCOME').reduce((s,t)=>s+t.amount,0),color:DONUT_COLORS[cat]})).filter(s=>s.value>0);
  const expenseSegs = CATEGORIES.map(cat=>({label:cat,value:transactions.filter(t=>t.category===cat&&t.type==='EXPENSE').reduce((s,t)=>s+t.amount,0),color:DONUT_COLORS[cat]})).filter(s=>s.value>0);

  const handleAdd = async(e:React.FormEvent)=>{
    e.preventDefault();
    if (!newDesc||!newAmount) return;
    const num=parseFloat(newAmount);
    if (isNaN(num)||num<=0) return;
    try {
      if (token&&clubId&&clubId!=='pending-club') {
        const created=await clubApi.createClubTransaction(clubId,{
          description:newDesc,category:newCategory,amount:num,type:newType,userOrOrg:newOrg||'Club',status:newStatus,
        },token);
        const item:FinancialTransaction={
          id:created.id||`t_${Date.now()}`,
          date:created.date?new Date(created.date).toISOString().split('T')[0]:new Date().toISOString().split('T')[0],
          description:created.description,category:(created.category||newCategory) as any,
          amount:Number(created.amount)||num,type:(created.type||newType) as any,
          userOrOrg:created.userOrOrg||newOrg||'Club',status:(created.status||newStatus) as any,
        };
        setTransactions(prev=>[item,...prev]);
      } else {
        const item:FinancialTransaction={
          id:`t_${Date.now()}`,date:new Date().toISOString().split('T')[0],
          description:newDesc,category:newCategory,amount:num,type:newType,
          userOrOrg:newOrg||'Club',status:newStatus,
        };
        setTransactions(prev=>[item,...prev]);
      }
      setShowAddModal(false);
      setNewDesc('');setNewAmount('');setNewOrg('');
    } catch(err){ console.error('Erreur enregistrement transaction:',err); }
  };

  return (
    <div className="space-y-8 pb-12">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-500/25">
            <Wallet className="w-3.5 h-3.5"/> Trésorerie &amp; Comptabilité
          </div>
          <h2 className="text-3xl font-extrabold text-white">Gestion Financière</h2>
          <p className="text-slate-400 text-sm mt-1">Suivi des cotisations, dépenses et sponsorings de <span className="text-white font-semibold">{activeClub?.name||'votre club'}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-white/10 overflow-hidden text-xs font-bold">
            <button onClick={()=>setActiveView('table')}
              className={`flex items-center gap-1.5 px-3 py-2 transition-colors cursor-pointer ${activeView==='table'?'bg-white/10 text-white':'text-slate-400 hover:text-white'}`}>
              <FileText className="w-3.5 h-3.5"/> Journal
            </button>
            <button onClick={()=>setActiveView('charts')}
              className={`flex items-center gap-1.5 px-3 py-2 transition-colors cursor-pointer ${activeView==='charts'?'bg-white/10 text-white':'text-slate-400 hover:text-white'}`}>
              <BarChart3 className="w-3.5 h-3.5"/> Graphiques
            </button>
          </div>
          <button onClick={()=>setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all cursor-pointer">
            <Plus className="w-4 h-4"/> Nouvelle Transaction
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {label:'Solde Net',value:netBalance,fmt:`${netBalance>=0?'+':''}${fmt(netBalance)}`,icon:<Wallet className="w-4 h-4"/>,iconBg:netBalance>=0?'bg-emerald-500/15':'bg-red-500/15',iconColor:netBalance>=0?'text-emerald-400':'text-red-400',sub:'FCFA — Compte club',extra:netBalance!==0?<div className={`mt-2 flex items-center gap-1 text-[10px] font-bold ${netBalance>=0?'text-emerald-400':'text-red-400'}`}>{netBalance>=0?<ArrowUpRight className="w-3 h-3"/>:<ArrowDownRight className="w-3 h-3"/>}{netBalance>=0?'Solde positif':'Solde négatif'}</div>:null,textColor:netBalance>=0?'text-white':'text-red-400'},
          {label:'Total Recettes',value:totalIncome,fmt:`+${fmt(totalIncome)}`,icon:<TrendingUp className="w-4 h-4"/>,iconBg:'bg-emerald-500/15',iconColor:'text-emerald-400',sub:'FCFA — Encaissements',extra:<div className="mt-2 text-[10px] text-slate-400">{transactions.filter(t=>t.type==='INCOME').length} transaction(s)</div>,textColor:'text-emerald-400'},
          {label:'Total Dépenses',value:totalExpense,fmt:`-${fmt(totalExpense)}`,icon:<TrendingDown className="w-4 h-4"/>,iconBg:'bg-red-500/15',iconColor:'text-red-400',sub:'FCFA — Décaissements',extra:<div className="mt-2 text-[10px] text-slate-400">{transactions.filter(t=>t.type==='EXPENSE').length} transaction(s)</div>,textColor:'text-red-400'},
          {label:'En Attente',value:pendingAmt,fmt:fmt(pendingAmt),icon:<Clock className="w-4 h-4"/>,iconBg:'bg-amber-500/15',iconColor:'text-amber-400',sub:'FCFA — À encaisser',extra:<div className="mt-2 text-[10px] text-amber-400/70 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/>{transactions.filter(t=>t.status==='EN ATTENTE').length} paiement(s)</div>,textColor:'text-amber-400'},
        ].map((kpi,i)=>(
          <div key={i} className="glass-panel p-5 rounded-3xl border border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span className="font-semibold">{kpi.label}</span>
              <div className={`p-1.5 rounded-lg ${kpi.iconBg}`}><span className={kpi.iconColor}>{kpi.icon}</span></div>
            </div>
            <div className={`text-2xl font-black ${kpi.textColor}`}>{kpi.fmt}</div>
            <div className="text-[10px] text-slate-500 mt-1">{kpi.sub}</div>
            {kpi.extra}
          </div>
        ))}
      </div>

      {/* Charts View */}
      {activeView==='charts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#FFB800]"/> Tendance Mensuelle</h3>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500/70 inline-block"/>Recettes</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/60 inline-block"/>Dépenses</span>
                </div>
              </div>
              {monthlyTrend.every(m=>m.income===0&&m.expense===0)
                ? <div className="h-20 flex items-center justify-center text-slate-500 text-xs">Aucune donnée mensuelle</div>
                : <MiniBarChart data={monthlyTrend}/>}
            </div>
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2"><Target className="w-4 h-4 text-[#FFB800]"/> Santé Budget</h3>
              {totalIncome>0 ? (
                <>
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                      <span>Taux de dépenses</span>
                      <span className={totalExpense/totalIncome>0.8?'text-red-400':'text-emerald-400'}>
                        {Math.round((totalExpense/totalIncome)*100)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${totalExpense/totalIncome>0.8?'bg-red-500':totalExpense/totalIncome>0.6?'bg-amber-500':'bg-emerald-500'}`}
                        style={{width:`${Math.min(100,(totalExpense/totalIncome)*100)}%`}}/>
                    </div>
                  </div>
                  <div className={`rounded-2xl p-3 text-xs border ${netBalance>=0?'bg-emerald-500/10 border-emerald-500/20 text-emerald-300':'bg-red-500/10 border-red-500/20 text-red-300'}`}>
                    <div className="font-bold mb-1 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5"/>{netBalance>=0?'Budget sain':'Attention au budget'}</div>
                    <p className="text-[10px] opacity-80">{netBalance>=0?`Excédent de ${fmt(netBalance)} FCFA.`:`Déficit de ${fmt(Math.abs(netBalance))} FCFA.`}</p>
                  </div>
                </>
              ) : <div className="text-xs text-slate-500 text-center py-4">Ajoutez des transactions pour voir la santé du budget</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[{title:'Recettes par Catégorie',segs:incomeSegs,iconColor:'text-emerald-400',noData:'Aucune recette enregistrée'},{title:'Dépenses par Catégorie',segs:expenseSegs,iconColor:'text-red-400',noData:'Aucune dépense enregistrée'}].map(({title,segs,iconColor,noData})=>(
              <div key={title} className="glass-panel p-6 rounded-3xl border border-white/10">
                <h3 className={`font-bold text-white flex items-center gap-2 mb-5`}><PieChart className={`w-4 h-4 ${iconColor}`}/> {title}</h3>
                {segs.length===0
                  ? <p className="text-xs text-slate-500 text-center py-6">{noData}</p>
                  : <div className="flex items-center gap-6">
                      <DonutChart segments={segs}/>
                      <div className="flex-1 space-y-2">
                        {segs.map(seg=>{
                          const pct=Math.round((seg.value/segs.reduce((s,x)=>s+x.value,0))*100);
                          return (
                            <div key={seg.label} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full shrink-0" style={{background:seg.color}}/><span className="text-slate-300">{seg.label}</span></div>
                              <div className="flex items-center gap-2"><span className="text-slate-400">{pct}%</span><span className="text-white font-bold">{fmt(seg.value)}</span></div>
                            </div>
                          );
                        })}
                      </div>
                    </div>}
              </div>
            ))}
          </div>

          {catBreakdown.length>0 && (
            <div className="glass-panel p-6 rounded-3xl border border-white/10">
              <h3 className="font-bold text-white flex items-center gap-2 mb-5"><Target className="w-4 h-4 text-[#FFB800]"/> Détail par Catégorie</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {catBreakdown.map(({cat,income,expense})=>{
                  const meta=CATEGORY_META[cat];
                  const net=income-expense;
                  return (
                    <div key={cat} className={`flex items-start gap-3 p-4 rounded-2xl border ${meta.bg}`}>
                      <div className={`p-2 rounded-xl bg-black/20 ${meta.color} shrink-0`}>{meta.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">{cat}</p>
                        <div className="flex justify-between text-[10px] mt-1">
                          <span className="text-emerald-400">+{fmt(income)}</span>
                          <span className="text-red-400">-{fmt(expense)}</span>
                        </div>
                        <div className={`text-xs font-bold mt-1 ${net>=0?'text-emerald-400':'text-red-400'}`}>Net: {net>=0?'+':''}{fmt(net)} FCFA</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {activeView==='table' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#FFB800]"/> Journal des Transactions
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400"/>}
              <span className="ml-1 text-xs text-slate-500 font-normal">({filteredTx.length})</span>
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-slate-400"/>
              <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer">
                <option value="ALL" className="bg-[#090A0F]">Toutes catégories</option>
                {CATEGORIES.map(c=><option key={c} value={c} className="bg-[#090A0F]">{c}</option>)}
              </select>
              <select value={filterType} onChange={e=>setFilterType(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer">
                <option value="ALL"     className="bg-[#090A0F]">Recettes + Dépenses</option>
                <option value="INCOME"  className="bg-[#090A0F]">Recettes</option>
                <option value="EXPENSE" className="bg-[#090A0F]">Dépenses</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-3 py-3">Catégorie</th>
                  <th className="px-3 py-3">Entité</th>
                  <th className="px-3 py-3 text-right">Montant</th>
                  <th className="px-3 py-3 text-center">Statut</th>
                  <th className="px-3 py-3 text-center">Reçu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTx.length===0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    {loading
                      ? <div className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Chargement...</div>
                      : <div className="space-y-2"><Wallet className="w-8 h-8 mx-auto text-slate-600"/><p>Aucune transaction trouvée.</p><button onClick={()=>setShowAddModal(true)} className="text-emerald-400 hover:text-emerald-300 underline text-[10px] cursor-pointer">Ajouter une première transaction</button></div>}
                  </td></tr>
                ) : filteredTx.map(t=>{
                  const meta=CATEGORY_META[t.category];
                  const sMeta=STATUS_META[t.status];
                  return (
                    <tr key={t.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-mono whitespace-nowrap"><div className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-slate-600"/>{t.date}</div></td>
                      <td className="px-4 py-3 font-semibold text-white max-w-[200px] truncate" title={t.description}>{t.description}</td>
                      <td className="px-3 py-3"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${meta.bg} ${meta.color}`}>{meta.icon}{t.category}</span></td>
                      <td className="px-3 py-3 text-slate-300">{t.userOrOrg}</td>
                      <td className={`px-3 py-3 text-right font-black text-sm ${t.type==='INCOME'?'text-emerald-400':'text-red-400'}`}>
                        {t.type==='INCOME'
                          ? <span className="flex items-center justify-end gap-0.5"><ArrowUpRight className="w-3 h-3"/>+{fmt(t.amount)} FCFA</span>
                          : <span className="flex items-center justify-end gap-0.5"><ArrowDownRight className="w-3 h-3"/>-{fmt(t.amount)} FCFA</span>}
                      </td>
                      <td className="px-3 py-3 text-center"><span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${sMeta.color}`}>{sMeta.icon}{sMeta.label}</span></td>
                      <td className="px-3 py-3 text-center">
                        {t.proofUrl
                          ? <a href={t.proofUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors inline-block" title="Voir le justificatif"><Download className="w-4 h-4"/></a>
                          : <span className="p-1.5 rounded-lg bg-white/5 text-slate-600 inline-block" title="Pas de justificatif"><Download className="w-4 h-4"/></span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredTx.length>0 && (
            <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-slate-400">
              <span>{filteredTx.length} transaction(s)</span>
              <div className="flex items-center gap-4">
                <span className="text-emerald-400 font-bold">Recettes: +{fmt(filteredTx.filter(t=>t.type==='INCOME').reduce((s,t)=>s+t.amount,0))} FCFA</span>
                <span className="text-red-400 font-bold">Dépenses: -{fmt(filteredTx.filter(t=>t.type==='EXPENSE').reduce((s,t)=>s+t.amount,0))} FCFA</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel rounded-3xl border border-white/15 max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-400"/> Nouvelle Transaction</h3>
              <button onClick={()=>setShowAddModal(false)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"><X className="w-4 h-4"/></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Description *</label>
                <input type="text" required placeholder="Ex: Achat ballons d'entraînement"
                  value={newDesc} onChange={e=>setNewDesc(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl glass-input"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Montant (FCFA) *</label>
                  <input type="number" required min="1" placeholder="25000"
                    value={newAmount} onChange={e=>setNewAmount(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl glass-input"/>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Type</label>
                  <select value={newType} onChange={e=>setNewType(e.target.value as any)} className="w-full px-3.5 py-2.5 rounded-xl glass-input bg-[#090A0F] cursor-pointer">
                    <option value="INCOME">Recette (+)</option>
                    <option value="EXPENSE">Dépense (-)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Catégorie</label>
                  <select value={newCategory} onChange={e=>setNewCategory(e.target.value as any)} className="w-full px-3.5 py-2.5 rounded-xl glass-input bg-[#090A0F] cursor-pointer">
                    {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Statut</label>
                  <select value={newStatus} onChange={e=>setNewStatus(e.target.value as any)} className="w-full px-3.5 py-2.5 rounded-xl glass-input bg-[#090A0F] cursor-pointer">
                    <option value="PAYÉ">Payé</option>
                    <option value="EN ATTENTE">En attente</option>
                    <option value="RETARD">En retard</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Organisme / Joueur</label>
                <input type="text" placeholder="Ex: Decathlon, Jean Dupont..."
                  value={newOrg} onChange={e=>setNewOrg(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl glass-input"/>
              </div>
              {newAmount&&parseFloat(newAmount)>0&&(
                <div className={`rounded-xl p-3 border text-xs font-bold ${newType==='INCOME'?'bg-emerald-500/10 border-emerald-500/20 text-emerald-300':'bg-red-500/10 border-red-500/20 text-red-300'}`}>
                  {newType==='INCOME'?<ArrowUpRight className="w-3.5 h-3.5 inline mr-1"/>:<ArrowDownRight className="w-3.5 h-3.5 inline mr-1"/>}
                  {newType==='INCOME'?'Recette':'Dépense'} de {fmt(parseFloat(newAmount)||0)} FCFA — {newCategory}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-slate-300 font-bold hover:bg-white/15 transition-colors cursor-pointer">Annuler</button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold hover:brightness-110 shadow-md transition-all cursor-pointer">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
