import React, { useState, useEffect, useMemo } from 'react';
import { useClub } from '../../context/ClubContext';
import { clubApi } from '../../services/clubApi';
import type { EventItem, AbsenceJustification } from '../../types';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Users,
  ChevronRight,
  ChevronLeft,
  X,
  Bell,
  AlertTriangle,
  Activity,
  Send,
  User,
  Plus,
  Filter,
  LayoutGrid,
  List,
  Flame,
  Dumbbell,
  Trophy,
  Presentation,
  Zap,
  Star,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type EventType = 'ENTRAÎNEMENT' | 'MATCH' | 'RÉUNION' | 'ACTIVITÉ';
type ViewMode = 'calendar' | 'list';

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_META: Record<EventType, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; accent: string }> = {
  'ENTRAÎNEMENT': {
    label: 'Entraînement',
    color: 'text-sky-300',
    bg: 'bg-sky-500/15',
    border: 'border-sky-500/30',
    icon: <Dumbbell className="w-3.5 h-3.5" />,
    accent: '#38BDF8',
  },
  'MATCH': {
    label: 'Match',
    color: 'text-red-300',
    bg: 'bg-red-500/15',
    border: 'border-red-500/30',
    icon: <Flame className="w-3.5 h-3.5" />,
    accent: '#EF4444',
  },
  'RÉUNION': {
    label: 'Réunion',
    color: 'text-violet-300',
    bg: 'bg-violet-500/15',
    border: 'border-violet-500/30',
    icon: <Presentation className="w-3.5 h-3.5" />,
    accent: '#A78BFA',
  },
  'ACTIVITÉ': {
    label: 'Activité',
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    icon: <Trophy className="w-3.5 h-3.5" />,
    accent: '#10B981',
  },
};

const ABSENCE_REASONS = [
  { id: 'BLESSURE', label: '🤕 Blessure / Douleur physique' },
  { id: 'MALADIE', label: '🤒 Maladie / Indisposition' },
  { id: 'TRAVAIL', label: '💼 Obligation professionnelle' },
  { id: 'FAMILLE', label: '👨‍👩‍👧 Obligation familiale' },
  { id: 'TRANSPORT', label: '🚗 Problème de transport' },
  { id: 'AUTRE', label: '📝 Autre raison' },
];

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// ── Mock data (shown when backend returns nothing) ────────────────────────────

const MOCK_EVENTS: EventItem[] = [
  {
    id: 'e1',
    title: 'Entraînement Physique Intensif',
    type: 'ENTRAÎNEMENT',
    date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })(),
    time: '18:30',
    location: 'Gymnase Municipal — Lomé',
    description: 'Séance axée sur la condition physique, travail défensif et tirs en rupture. Présence obligatoire pour tous les joueurs inscrits.',
    confirmedCount: 11,
    declinedCount: 2,
    userRsvp: 'PENDING',
    programme: [
      { time: '18:30', label: 'Échauffement général', duration: '15 min', icon: '🔥', coach: 'Coach David' },
      { time: '18:45', label: 'Travail défensif 1v1', duration: '25 min', icon: '🛡️', coach: 'Coach David' },
      { time: '19:10', label: 'Tirs en rupture', duration: '20 min', icon: '🎯', coach: 'Asst. Marc' },
      { time: '19:30', label: 'Jeu complet 5v5', duration: '30 min', icon: '🏀', coach: 'Coach David' },
      { time: '20:00', label: 'Récupération & étirements', duration: '15 min', icon: '🧘', coach: 'Kiné Amara' },
    ],
  },
  {
    id: 'e2',
    title: 'Match Championnat — HOOPERS vs SHARKS',
    type: 'MATCH',
    date: (() => { const d = new Date(); d.setDate(d.getDate() + 4); return d.toISOString().split('T')[0]; })(),
    time: '15:00',
    location: 'Palais des Sports — Lomé',
    description: 'Confrontation décisive pour le haut du classement. Tenue de match obligatoire. Bus de l\'équipe à 13h30 depuis le gymnase.',
    confirmedCount: 14,
    declinedCount: 1,
    userRsvp: 'PENDING',
  },
  {
    id: 'e3',
    title: 'Réunion Tactique Pré-Tournoi',
    type: 'RÉUNION',
    date: (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]; })(),
    time: '19:00',
    location: 'Salle de Conférence — Siège Club',
    description: 'Présentation du plan de jeu pour le tournoi régional. Analyse vidéo des adversaires et briefing logistique complet.',
    confirmedCount: 9,
    declinedCount: 0,
    userRsvp: 'PENDING',
  },
  {
    id: 'e4',
    title: 'Sortie Team Building — Plage de Lomé',
    type: 'ACTIVITÉ',
    date: (() => { const d = new Date(); d.setDate(d.getDate() + 10); return d.toISOString().split('T')[0]; })(),
    time: '10:00',
    location: 'Plage de Lomé — Point de RDV principal',
    description: 'Activité de cohésion d\'équipe : beach volleyball, BBQ et jeux collectifs. Familles bienvenues. Tenue décontractée.',
    confirmedCount: 16,
    declinedCount: 3,
    userRsvp: 'CONFIRMED',
  },
  {
    id: 'e5',
    title: 'Entraînement Techniques Individuelles',
    type: 'ENTRAÎNEMENT',
    date: (() => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().split('T')[0]; })(),
    time: '17:00',
    location: 'Gymnase Municipal — Terrain B',
    description: 'Focus sur le dribble, la finition en layup et les passes décisives. Séance par groupes de positions.',
    confirmedCount: 8,
    declinedCount: 1,
    userRsvp: 'PENDING',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  // Convert Sunday=0 to Monday=0 system
  return (day + 6) % 7;
}
function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}
function isToday(dateStr: string) {
  return dateStr === new Date().toISOString().split('T')[0];
}
function isPast(dateStr: string) {
  return dateStr < new Date().toISOString().split('T')[0];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TypePill({ type, small }: { type: string; small?: boolean }) {
  const meta = TYPE_META[type as EventType] ?? TYPE_META['ACTIVITÉ'];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${meta.bg} ${meta.color} ${meta.border} ${small ? '' : 'text-xs'}`}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

function AttendanceBar({ confirmed, declined }: { confirmed: number; declined: number }) {
  const total = confirmed + declined;
  if (total === 0) return null;
  const pct = Math.round((confirmed / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-bold">
        <span className="text-emerald-400">{confirmed} Présents</span>
        <span className="text-red-400">{declined} Absents</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export const EventCalendar: React.FC = () => {
  const { activeClub } = useClub();
  const clubId = activeClub?.clubId || activeClub?.id;

  // ── Data ──
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubId || clubId === 'pending-club') {
      setEvents(MOCK_EVENTS);
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    clubApi.fetchClubEvents(clubId)
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data.map((item: any) => ({
            id: item.id,
            title: item.title,
            type: item.type || 'ENTRAÎNEMENT',
            date: item.eventDate ? new Date(item.eventDate).toISOString().split('T')[0] : (item.date || new Date().toISOString().split('T')[0]),
            time: item.time || '18:00',
            location: item.location || 'Terrain du club',
            description: item.description || '',
            confirmedCount: item.confirmedCount || 0,
            declinedCount: item.declinedCount || 0,
            userRsvp: 'PENDING',
            programme: item.programme || undefined,
          })));
        } else {
          setEvents(MOCK_EVENTS);
        }
      })
      .catch(() => { if (mounted) setEvents(MOCK_EVENTS); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [clubId]);

  // ── UI State ──
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // Calendar nav
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calSelectedDate, setCalSelectedDate] = useState<string | null>(null);

  // Absence form
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [absenceReason, setAbsenceReason] = useState('BLESSURE');
  const [absenceDetails, setAbsenceDetails] = useState('');
  const [absenceSubmitted, setAbsenceSubmitted] = useState(false);

  // ── Derived ──
  const filters: { key: string; label: string }[] = [
    { key: 'ALL', label: 'Tous' },
    { key: 'ENTRAÎNEMENT', label: 'Entraînements' },
    { key: 'MATCH', label: 'Matchs' },
    { key: 'RÉUNION', label: 'Réunions' },
    { key: 'ACTIVITÉ', label: 'Activités' },
  ];

  const filteredEvents = useMemo(() =>
    events
      .filter(e => activeFilter === 'ALL' || e.type === activeFilter)
      .sort((a, b) => a.date.localeCompare(b.date)),
    [events, activeFilter]);

  const upcomingCount = events.filter(e => !isPast(e.date)).length;
  const totalUnreadNotifs = events.reduce((acc, ev) =>
    acc + (ev.absenceJustifications?.filter(j => !j.isRead).length || 0), 0);

  const allJustifications: Array<AbsenceJustification & { eventTitle: string; eventDate: string }> =
    events.flatMap(ev => (ev.absenceJustifications || []).map(j => ({ ...j, eventTitle: ev.title, eventDate: ev.date })));

  // Calendar helpers
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const eventsOnDay = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };
  const calDayEvents = calSelectedDate
    ? filteredEvents.filter(e => e.date === calSelectedDate)
    : filteredEvents.filter(e => {
      const [y, m] = e.date.split('-').map(Number);
      return y === calYear && m === calMonth + 1;
    });

  // ── RSVP handlers ──
  const handleRsvpConfirm = (eventId: string) => {
    const update = (e: EventItem): EventItem => {
      if (e.id !== eventId) return e;
      return {
        ...e,
        userRsvp: 'CONFIRMED',
        confirmedCount: e.userRsvp === 'CONFIRMED' ? e.confirmedCount : e.confirmedCount + 1,
        declinedCount: e.userRsvp === 'DECLINED' ? e.declinedCount - 1 : e.declinedCount,
      };
    };
    setEvents(prev => prev.map(update));
    setSelectedEvent(prev => prev && prev.id === eventId ? update(prev) : prev);
  };

  const handleRsvpDecline = (eventId: string) => {
    setSelectedEvent(events.find(e => e.id === eventId) || null);
    setAbsenceSubmitted(false);
    setAbsenceReason('BLESSURE');
    setAbsenceDetails('');
    setShowAbsenceForm(true);
  };

  const handleSubmitAbsence = (eventId: string) => {
    if (!absenceDetails.trim()) return;
    const newJustif: AbsenceJustification = {
      playerId: 'current_player',
      playerName: 'Moi (Joueur Connecté)',
      reason: absenceReason,
      details: absenceDetails,
      submittedAt: new Date().toISOString(),
      isRead: false,
    };
    const update = (e: EventItem): EventItem => {
      if (e.id !== eventId) return e;
      return {
        ...e,
        userRsvp: 'DECLINED',
        confirmedCount: e.userRsvp === 'CONFIRMED' ? e.confirmedCount - 1 : e.confirmedCount,
        declinedCount: e.userRsvp === 'DECLINED' ? e.declinedCount : e.declinedCount + 1,
        absenceJustifications: [...(e.absenceJustifications || []), newJustif],
      };
    };
    setEvents(prev => prev.map(update));
    setSelectedEvent(prev => prev && prev.id === eventId ? update(prev) : prev);
    setAbsenceSubmitted(true);
    setTimeout(() => { setShowAbsenceForm(false); setAbsenceSubmitted(false); }, 2500);
  };

  const handleMarkNotifRead = (playerName: string, eventTitle: string) => {
    setEvents(prev => prev.map(ev => {
      if (ev.title !== eventTitle) return ev;
      return { ...ev, absenceJustifications: ev.absenceJustifications?.map(j => j.playerName === playerName ? { ...j, isRead: true } : j) };
    }));
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-16">

      {/* ── Header ── */}
      <div className="rounded-2xl bg-[#0C0F1A] border border-white/10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D97706]/15 border border-[#D97706]/30 text-[#D97706] text-xs font-semibold">
              <CalendarIcon className="w-3.5 h-3.5" />
              Planning officiel
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-none tracking-tight">Agenda & RSVP</h1>
            <p className="text-slate-400 text-sm max-w-lg">
              Entraînements, matchs et réunions. Confirmez votre présence directement depuis l'agenda.
            </p>
          </div>

          {/* Stats chips */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
              <Zap className="w-4 h-4 text-[#D97706]" />
              <div>
                <div className="text-sm font-black text-white">{upcomingCount}</div>
                <div className="text-[10px] text-slate-400">À venir</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
              <Users className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-sm font-black text-white">{events.reduce((a, e) => a + e.confirmedCount, 0)}</div>
                <div className="text-[10px] text-slate-400">Confirmations</div>
              </div>
            </div>
            <button
              onClick={() => setShowNotifPanel(true)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D97706]/15 border border-[#D97706]/30 text-[#D97706] font-bold text-xs transition-all hover:bg-[#D97706]/25"
            >
              <Bell className="w-4 h-4" />
              Justificatifs
              {totalUnreadNotifs > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#B91C1C] text-white text-[10px] font-black flex items-center justify-center">
                  {totalUnreadNotifs}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Filters & View Toggle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                activeFilter === f.key
                  ? 'bg-[#D97706] text-white border-[#D97706] shadow-lg shadow-amber-900/30'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <List className="w-3.5 h-3.5" /> Liste
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'calendar' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Calendrier
          </button>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
          <div className="w-5 h-5 rounded-full border-2 border-[#D97706] border-t-transparent animate-spin" />
          <span className="text-sm">Chargement du planning…</span>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          VIEW : CALENDAR
      ════════════════════════════════════════════════════════════ */}
      {!loading && viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar grid */}
          <div className="lg:col-span-2 rounded-2xl bg-[#0D0F1A] border border-white/10 overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <button
                onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="font-black text-white text-lg">
                {MONTHS_FR[calMonth]} {calYear}
              </h3>
              <button
                onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Days header */}
            <div className="grid grid-cols-7 border-b border-white/5">
              {DAYS_FR.map(d => (
                <div key={d} className="py-2 text-center text-[10px] font-bold text-slate-500 uppercase">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`pad-${i}`} className="aspect-square border-b border-r border-white/5" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEvts = eventsOnDay(day);
                const todayFlag = isToday(dateStr);
                const pastFlag = isPast(dateStr);
                const selected = calSelectedDate === dateStr;

                return (
                  <div
                    key={day}
                    onClick={() => setCalSelectedDate(selected ? null : dateStr)}
                    className={`relative min-h-[64px] p-1.5 border-b border-r border-white/5 cursor-pointer transition-all ${
                      selected ? 'bg-[#D97706]/15' : 'hover:bg-white/5'
                    } ${pastFlag ? 'opacity-50' : ''}`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mx-auto mb-1 ${
                      todayFlag
                        ? 'bg-[#D97706] text-white'
                        : selected
                        ? 'bg-white/20 text-white'
                        : 'text-slate-400'
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvts.slice(0, 2).map(ev => {
                        const meta = TYPE_META[ev.type as EventType] ?? TYPE_META['ACTIVITÉ'];
                        return (
                          <div
                            key={ev.id}
                            className="text-[8px] font-bold px-1 py-0.5 rounded truncate leading-tight"
                            style={{ backgroundColor: `${meta.accent}25`, color: meta.accent }}
                          >
                            {ev.title}
                          </div>
                        );
                      })}
                      {dayEvts.length > 2 && (
                        <div className="text-[8px] text-slate-500 text-center font-bold">+{dayEvts.length - 2}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day events sidebar */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-[#D97706]" />
              <h3 className="font-black text-white text-sm">
                {calSelectedDate
                  ? formatDateLabel(calSelectedDate)
                  : `${MONTHS_FR[calMonth]} ${calYear}`}
              </h3>
              {calSelectedDate && (
                <button onClick={() => setCalSelectedDate(null)} className="ml-auto text-slate-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {calDayEvents.length === 0 ? (
              <div className="py-8 text-center rounded-2xl bg-white/5 border border-white/10">
                <CalendarIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-xs font-semibold">Aucun événement</p>
              </div>
            ) : (
              <div className="space-y-3">
                {calDayEvents.map(ev => (
                  <button
                    key={ev.id}
                    onClick={() => { setSelectedEvent(ev); setShowAbsenceForm(false); }}
                    className="w-full text-left p-4 rounded-2xl bg-[#0D0F1A] border border-white/10 hover:border-[#D97706]/40 transition-all space-y-2"
                  >
                    <TypePill type={ev.type} small />
                    <div className="font-extrabold text-white text-sm leading-snug">{ev.title}</div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ev.time}</span>
                      <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" />{ev.location.split('—')[0]}</span>
                    </div>
                    <AttendanceBar confirmed={ev.confirmedCount} declined={ev.declinedCount} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          VIEW : LIST
      ════════════════════════════════════════════════════════════ */}
      {!loading && viewMode === 'list' && (
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-white/5 border border-white/10">
              <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-bold">Aucun événement correspondant</p>
              <p className="text-slate-600 text-sm mt-1">Essayez un autre filtre</p>
            </div>
          ) : (
            filteredEvents.map((event) => {
              const meta = TYPE_META[event.type as EventType] ?? TYPE_META['ACTIVITÉ'];
              const past = isPast(event.date);
              const total = event.confirmedCount + event.declinedCount;
              const pct = total > 0 ? Math.round((event.confirmedCount / total) * 100) : 0;

              return (
                <div
                  key={event.id}
                  onClick={() => { setSelectedEvent(event); setShowAbsenceForm(false); }}
                  className={`group cursor-pointer rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${
                    past ? 'opacity-60' : 'hover:border-white/25 hover:shadow-xl hover:shadow-black/30'
                  } bg-[#0D0F1A] border-white/10`}
                >
                  {/* Colored left accent */}
                  <div className="flex">
                    <div className="w-1 shrink-0" style={{ backgroundColor: meta.accent }} />

                    <div className="flex-1 p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Icon */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl"
                          style={{ backgroundColor: `${meta.accent}20`, border: `1px solid ${meta.accent}40` }}
                        >
                          {meta.icon && <span style={{ color: meta.accent }}>{React.cloneElement(meta.icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}</span>}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <TypePill type={event.type} small />
                            {isToday(event.date) && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#D97706]/20 text-[#D97706] border border-[#D97706]/30 animate-pulse">
                                AUJOURD'HUI
                              </span>
                            )}
                            {past && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-500 border border-white/10">Passé</span>}
                          </div>
                          <h3 className="text-base font-extrabold text-white leading-snug group-hover:text-[#D97706] transition-colors mb-1">
                            {event.title}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{event.description}</p>
                        </div>

                        {/* Meta info */}
                        <div className="shrink-0 text-right space-y-1 min-w-[120px]">
                          <div className="text-xs font-bold text-white">{formatDateLabel(event.date)}</div>
                          <div className="flex items-center gap-1 text-xs text-slate-400 justify-end">
                            <Clock className="w-3 h-3" /> {event.time}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-400 justify-end">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[100px]">{event.location.split('—')[0]}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom bar */}
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-4">
                        {/* Attendance */}
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-emerald-400">{event.confirmedCount} Présents</span>
                            <span className="text-slate-500">{pct}%</span>
                            <span className="text-red-400">{event.declinedCount} Absents</span>
                          </div>
                          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {/* RSVP quick buttons */}
                        {!past && (
                          <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleRsvpConfirm(event.id)}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                event.userRsvp === 'CONFIRMED'
                                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-900/30'
                                  : 'bg-white/5 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-white/10'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {event.userRsvp === 'CONFIRMED' ? 'Confirmé' : 'Présent'}
                            </button>
                            <button
                              onClick={() => handleRsvpDecline(event.id)}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                event.userRsvp === 'DECLINED'
                                  ? 'bg-[#B91C1C] text-white shadow-md shadow-red-900/30'
                                  : 'bg-white/5 text-slate-400 hover:bg-red-500/20 hover:text-red-300 border border-white/10'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Absent
                            </button>
                          </div>
                        )}

                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-[#D97706] transition-colors shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODAL — EVENT DETAIL
      ════════════════════════════════════════════════════════════ */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => { setSelectedEvent(null); setShowAbsenceForm(false); }}
        >
          <div
            className="bg-[#0D0F1A] rounded-3xl border border-white/15 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Top accent */}
            <div
              className="h-1.5 w-full rounded-t-3xl"
              style={{ background: `linear-gradient(to right, ${TYPE_META[selectedEvent.type as EventType]?.accent ?? '#D97706'}, transparent)` }}
            />

            <div className="p-6 md:p-8 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <TypePill type={selectedEvent.type} />
                  <h2 className="text-2xl font-black text-white leading-tight">{selectedEvent.title}</h2>
                  <p className="text-sm text-slate-300 leading-relaxed">{selectedEvent.description}</p>
                </div>
                <button
                  onClick={() => { setSelectedEvent(null); setShowAbsenceForm(false); }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Event meta */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <CalendarIcon className="w-4 h-4 text-[#D97706]" />, value: formatDateLabel(selectedEvent.date), label: 'Date' },
                  { icon: <Clock className="w-4 h-4 text-[#D97706]" />, value: selectedEvent.time, label: 'Horaire' },
                  { icon: <MapPin className="w-4 h-4 text-[#B91C1C]" />, value: selectedEvent.location.split('—')[0], label: 'Lieu' },
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center space-y-1.5">
                    <div className="flex justify-center">{item.icon}</div>
                    <div className="text-xs font-bold text-white leading-tight">{item.value}</div>
                    <div className="text-[10px] text-slate-500">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Programme */}
              {selectedEvent.programme && selectedEvent.programme.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2 pb-2 border-b border-white/10">
                    <Activity className="w-4 h-4 text-[#D97706]" />
                    Programme de la Séance
                    <span className="ml-auto text-xs font-normal text-slate-500">{selectedEvent.programme.length} étapes</span>
                  </h3>
                  <div className="space-y-2">
                    {selectedEvent.programme.map((activity, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-9 h-9 rounded-xl bg-[#B91C1C]/15 border border-[#B91C1C]/25 flex items-center justify-center text-sm">
                            {activity.icon}
                          </div>
                          {idx < selectedEvent.programme!.length - 1 && (
                            <div className="w-px h-4 bg-white/10 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-xs font-extrabold text-white">{activity.label}</span>
                            <span className="text-[10px] text-[#D97706] font-bold shrink-0 bg-[#D97706]/10 px-2 py-0.5 rounded-full border border-[#D97706]/20">
                              {activity.duration}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-mono">{activity.time}</span>
                            {activity.coach && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <User className="w-2.5 h-2.5" /> {activity.coach}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attendance summary */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-sm font-extrabold text-white">
                  <span className="flex items-center gap-2"><Users className="w-4 h-4 text-[#B91C1C]" /> Présences</span>
                  <span className="text-slate-500 text-xs font-normal">{selectedEvent.confirmedCount + selectedEvent.declinedCount} réponses</span>
                </div>
                <AttendanceBar confirmed={selectedEvent.confirmedCount} declined={selectedEvent.declinedCount} />
              </div>

              {/* RSVP */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-white">Votre Réponse</h3>

                {selectedEvent.userRsvp === 'CONFIRMED' && !showAbsenceForm && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Présence confirmée ✅
                  </div>
                )}
                {selectedEvent.userRsvp === 'DECLINED' && !showAbsenceForm && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 font-bold flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Absence déclarée — Justificatif envoyé au Coach
                  </div>
                )}

                {!showAbsenceForm && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleRsvpConfirm(selectedEvent.id)}
                      className={`py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                        selectedEvent.userRsvp === 'CONFIRMED'
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                          : 'bg-white/5 text-slate-200 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {selectedEvent.userRsvp === 'CONFIRMED' ? '✅ Présence Confirmée' : 'Je serai Présent'}
                    </button>
                    <button
                      onClick={() => handleRsvpDecline(selectedEvent.id)}
                      className={`py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                        selectedEvent.userRsvp === 'DECLINED'
                          ? 'bg-[#B91C1C] text-white shadow-lg shadow-red-900/30'
                          : 'bg-white/5 text-slate-200 hover:bg-[#B91C1C]/20 border border-white/10 hover:border-[#B91C1C]/40'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      {selectedEvent.userRsvp === 'DECLINED' ? '❌ Absence Déclarée' : 'Déclarer Absence'}
                    </button>
                  </div>
                )}

                {/* Absence form */}
                {showAbsenceForm && (
                  <div className="bg-[#0A0C15] rounded-2xl border border-[#B91C1C]/40 p-5 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-white">
                      <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                      Justificatif d'Absence Obligatoire
                    </div>
                    {absenceSubmitted ? (
                      <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-bold text-center flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-7 h-7" />
                        Justificatif envoyé ! Le Coach en a été notifié. 🔔
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {ABSENCE_REASONS.map(r => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => setAbsenceReason(r.id)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border ${
                                absenceReason === r.id
                                  ? 'bg-[#B91C1C]/30 border-[#B91C1C] text-white'
                                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                              }`}
                            >
                              {r.label}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={absenceDetails}
                          onChange={e => setAbsenceDetails(e.target.value)}
                          placeholder="Détaillez brièvement la raison de votre absence…"
                          className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 min-h-[80px] resize-none focus:outline-none focus:border-[#B91C1C]/60 transition-colors"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAbsenceForm(false)}
                            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            disabled={!absenceDetails.trim()}
                            onClick={() => handleSubmitAbsence(selectedEvent.id)}
                            className="flex-[2] px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B91C1C] to-[#881337] text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Envoyer au Coach
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODAL — COACH NOTIFICATIONS INBOX
      ════════════════════════════════════════════════════════════ */}
      {showNotifPanel && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setShowNotifPanel(false)}
        >
          <div
            className="bg-[#0D0F1A] rounded-3xl border border-white/15 max-w-xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D97706]/20 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-[#D97706]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white">Justificatifs d'Absence</h3>
                    <p className="text-xs text-slate-400">Vue Coach — Notifications reçues</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotifPanel(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {allJustifications.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-slate-400 text-sm font-semibold">Aucun justificatif d'absence reçu.</p>
                  <p className="text-slate-500 text-xs">Tous les joueurs sont disponibles ! 🔥</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allJustifications.map((j, idx) => {
                    const reasonLabel = ABSENCE_REASONS.find(r => r.id === j.reason)?.label || j.reason;
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border space-y-2 transition-all ${
                          j.isRead
                            ? 'bg-white/3 border-white/5 opacity-60'
                            : 'bg-[#B91C1C]/10 border-[#B91C1C]/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-extrabold text-white text-sm flex items-center gap-2">
                              {j.playerName}
                              {!j.isRead && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#B91C1C] text-white text-[9px] font-black">NOUVEAU</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              📅 {j.eventTitle} — {j.eventDate}
                            </div>
                          </div>
                          {!j.isRead && (
                            <button
                              onClick={() => handleMarkNotifRead(j.playerName, j.eventTitle)}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 font-bold transition-colors shrink-0"
                            >
                              Lu ✓
                            </button>
                          )}
                        </div>
                        <div className="text-xs bg-black/40 p-3 rounded-xl border border-white/5 space-y-1">
                          <div className="font-bold text-[#D97706]">{reasonLabel}</div>
                          <p className="text-slate-300 leading-relaxed">{j.details}</p>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Soumis le : {new Date(j.submittedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
