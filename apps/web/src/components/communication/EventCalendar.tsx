import React, { useState, useEffect } from 'react';
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
  X,
  Bell,
  AlertTriangle,
  Activity,
  Eye,
  Send,
  User
} from 'lucide-react';

const EVENT_TYPE_STYLES: Record<string, string> = {
  'ENTRAÎNEMENT': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'MATCH': 'bg-[#B91C1C]/30 text-red-300 border-[#B91C1C]/40',
  'RÉUNION': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'ACTIVITÉ': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const ABSENCE_REASONS = [
  { id: 'BLESSURE', label: '🤕 Blessure / Douleur physique' },
  { id: 'MALADIE', label: '🤒 Maladie / Indisposition' },
  { id: 'TRAVAIL', label: '💼 Obligation professionnelle' },
  { id: 'FAMILLE', label: '👨‍👩‍👧 Obligation familiale / Urgence' },
  { id: 'TRANSPORT', label: '🚗 Problème de transport' },
  { id: 'AUTRE', label: '📝 Autre raison' },
];

export const EventCalendar: React.FC = () => {
  const { activeClub } = useClub();
  const clubId = activeClub?.clubId || activeClub?.id;
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    if (!clubId || clubId === 'pending-club') return;
    let isMounted = true;
    clubApi.fetchClubEvents(clubId)
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
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
          })));
        }
      })
      .catch((err) => console.warn('Erreur chargement événements:', err));
    return () => {
      isMounted = false;
    };
  }, [clubId]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Absence justification form state
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [absenceReason, setAbsenceReason] = useState('BLESSURE');
  const [absenceDetails, setAbsenceDetails] = useState('');
  const [absenceSubmitted, setAbsenceSubmitted] = useState(false);

  // Coach notifications panel state
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // Count total unread absence justifications across all events
  const totalUnreadNotifs = events.reduce((acc, ev) => {
    return acc + (ev.absenceJustifications?.filter((j) => !j.isRead).length || 0);
  }, 0);

  const allJustifications: Array<AbsenceJustification & { eventTitle: string; eventDate: string }> =
    events.flatMap((ev) =>
      (ev.absenceJustifications || []).map((j) => ({
        ...j,
        eventTitle: ev.title,
        eventDate: ev.date,
      }))
    );

  const handleRsvpConfirm = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        const wasDeclined = e.userRsvp === 'DECLINED';
        return {
          ...e,
          userRsvp: 'CONFIRMED',
          confirmedCount: e.userRsvp === 'CONFIRMED' ? e.confirmedCount : e.confirmedCount + 1,
          declinedCount: wasDeclined ? e.declinedCount - 1 : e.declinedCount,
        };
      })
    );
    // Update selected event too
    setSelectedEvent((prev) => {
      if (!prev || prev.id !== eventId) return prev;
      const wasDeclined = prev.userRsvp === 'DECLINED';
      return {
        ...prev,
        userRsvp: 'CONFIRMED',
        confirmedCount: prev.userRsvp === 'CONFIRMED' ? prev.confirmedCount : prev.confirmedCount + 1,
        declinedCount: wasDeclined ? prev.declinedCount - 1 : prev.declinedCount,
      };
    });
  };

  const handleRsvpDecline = (_eventId: string) => {
    // Show the absence justification form
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

    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        const wasConfirmed = e.userRsvp === 'CONFIRMED';
        return {
          ...e,
          userRsvp: 'DECLINED',
          confirmedCount: wasConfirmed ? e.confirmedCount - 1 : e.confirmedCount,
          declinedCount: e.userRsvp === 'DECLINED' ? e.declinedCount : e.declinedCount + 1,
          absenceJustifications: [...(e.absenceJustifications || []), newJustif],
        };
      })
    );

    setSelectedEvent((prev) => {
      if (!prev || prev.id !== eventId) return prev;
      const wasConfirmed = prev.userRsvp === 'CONFIRMED';
      return {
        ...prev,
        userRsvp: 'DECLINED',
        confirmedCount: wasConfirmed ? prev.confirmedCount - 1 : prev.confirmedCount,
        declinedCount: prev.userRsvp === 'DECLINED' ? prev.declinedCount : prev.declinedCount + 1,
        absenceJustifications: [...(prev.absenceJustifications || []), newJustif],
      };
    });

    setAbsenceSubmitted(true);
    setTimeout(() => {
      setShowAbsenceForm(false);
      setAbsenceSubmitted(false);
    }, 2000);
  };

  const handleMarkNotifRead = (playerName: string, eventTitle: string) => {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.title !== eventTitle) return ev;
        return {
          ...ev,
          absenceJustifications: ev.absenceJustifications?.map((j) =>
            j.playerName === playerName ? { ...j, isRead: true } : j
          ),
        };
      })
    );
  };

  return (
    <div className="space-y-8 pb-12">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D97706]/20 text-[#D97706] text-xs font-bold uppercase tracking-wider mb-2 border border-[#D97706]/30">
            <CalendarIcon className="w-3.5 h-3.5 text-[#B91C1C]" /> Agenda & RSVP
          </div>
          <h2 className="text-3xl font-extrabold text-white">Planning Officiel du Club</h2>
          <p className="text-slate-400 text-sm">
            Entraînements, matchs et réunions. Cliquez sur un événement pour voir le programme complet.
          </p>
        </div>

        {/* Coach Notifications Bell */}
        <button
          onClick={() => setShowNotifPanel(true)}
          className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-all self-start md:self-auto"
        >
          <Bell className="w-4 h-4 text-[#D97706]" />
          <span>Justificatifs Absence</span>
          {totalUnreadNotifs > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#B91C1C] text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
              {totalUnreadNotifs}
            </span>
          )}
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        {events.map((event) => (
          <div
            key={event.id}
            onClick={() => setSelectedEvent(event)}
            className="group cursor-pointer glass-panel rounded-3xl border border-white/10 overflow-hidden hover:border-[#B91C1C]/50 hover:-translate-y-1 transition-all duration-300 bg-[#0A0C13] flex flex-col"
          >
            {/* Cover Image */}
            {event.coverImage && (
              <div className="relative h-40 overflow-hidden">
                <img
                  src={event.coverImage}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0A0C13] via-[#0A0C13]/40 to-transparent" />
                {/* Event type pill on top of image */}
                <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${EVENT_TYPE_STYLES[event.type] || ''}`}>
                  {event.type}
                </span>
                {/* Programme count badge */}
                {event.programme && (
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold border border-white/10">
                    {event.programme.length} activités
                  </span>
                )}
              </div>
            )}

            <div className="p-5 flex flex-col flex-1 space-y-3">
              {!event.coverImage && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border self-start ${EVENT_TYPE_STYLES[event.type] || ''}`}>
                  {event.type}
                </span>
              )}

              <h3 className="text-base font-extrabold text-white leading-snug group-hover:text-[#D97706] transition-colors">
                {event.title}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{event.description}</p>

              {/* Date / Time / Location */}
              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#B91C1C] shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
              </div>

              {/* Attendance & RSVP */}
              <div className="pt-3 border-t border-white/10 mt-auto space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Users className="w-3 h-3" /> {event.confirmedCount} Présents
                  </span>
                  <span className="text-red-400 font-semibold">{event.declinedCount} Absents</span>
                </div>

                <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleRsvpConfirm(event.id)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      event.userRsvp === 'CONFIRMED'
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Présent
                  </button>
                  <button
                    onClick={() => {
                      setSelectedEvent(event);
                      handleRsvpDecline(event.id);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      event.userRsvp === 'DECLINED'
                        ? 'bg-[#B91C1C] text-white shadow-md shadow-red-900/30'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Absent
                  </button>
                </div>

                {/* "See Programme" Hint */}
                <div className="flex items-center justify-end gap-1 text-[10px] text-[#D97706] font-bold pt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-3 h-3" />
                  <span>Voir le programme complet</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================== */}
      {/* EVENT DETAIL MODAL WITH PROGRAMME & RSVP MANAGEMENT            */}
      {/* ============================================================== */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#0D0F1A] rounded-3xl border border-white/15 max-w-2xl w-full max-h-[90vh] overflow-y-auto">

            {/* Modal Cover Image */}
            {selectedEvent.coverImage && (
              <div className="relative h-52 overflow-hidden rounded-t-3xl">
                <img
                  src={selectedEvent.coverImage}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0D0F1A] via-[#0D0F1A]/50 to-transparent" />
                <button
                  onClick={() => { setSelectedEvent(null); setShowAbsenceForm(false); }}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="p-6 space-y-6">
              {/* Close if no image header */}
              {!selectedEvent.coverImage && (
                <div className="flex justify-end">
                  <button
                    onClick={() => { setSelectedEvent(null); setShowAbsenceForm(false); }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Title & Type */}
              <div className="space-y-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${EVENT_TYPE_STYLES[selectedEvent.type]}`}>
                  {selectedEvent.type}
                </span>
                <h2 className="text-2xl font-black text-white leading-tight">{selectedEvent.title}</h2>
                <p className="text-sm text-slate-300 leading-relaxed">{selectedEvent.description}</p>
              </div>

              {/* Event Meta Info */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center space-y-1">
                  <CalendarIcon className="w-4 h-4 text-[#D97706] mx-auto" />
                  <div className="text-xs font-bold text-white">{selectedEvent.date}</div>
                  <div className="text-[10px] text-slate-400">Date</div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center space-y-1">
                  <Clock className="w-4 h-4 text-[#D97706] mx-auto" />
                  <div className="text-xs font-bold text-white">{selectedEvent.time}</div>
                  <div className="text-[10px] text-slate-400">Horaire</div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center space-y-1">
                  <MapPin className="w-4 h-4 text-[#B91C1C] mx-auto" />
                  <div className="text-xs font-bold text-white truncate">{selectedEvent.location.split('—')[0]}</div>
                  <div className="text-[10px] text-slate-400">Lieu</div>
                </div>
              </div>

              {/* PROGRAMME D'ACTIVITÉS (Rich Timeline) */}
              {selectedEvent.programme && selectedEvent.programme.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                    <Activity className="w-4 h-4 text-[#D97706]" />
                    Programme de la Séance
                    <span className="ml-auto text-xs text-slate-400 font-normal">{selectedEvent.programme.length} étapes</span>
                  </h3>

                  <div className="space-y-2">
                    {selectedEvent.programme.map((activity, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        {/* Timeline connector */}
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-8 h-8 rounded-xl bg-[#B91C1C]/20 border border-[#B91C1C]/30 flex items-center justify-center text-sm">
                            {activity.icon}
                          </div>
                          {idx < selectedEvent.programme!.length - 1 && (
                            <div className="w-0.5 h-4 bg-white/10 mt-1" />
                          )}
                        </div>

                        {/* Activity Details */}
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

              {/* RSVP SECTION */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#B91C1C]" /> Votre Réponse
                  <span className="ml-auto text-xs font-normal">
                    <span className="text-emerald-400 font-bold">{selectedEvent.confirmedCount} Présents</span>
                    {' · '}
                    <span className="text-red-400 font-bold">{selectedEvent.declinedCount} Absents</span>
                  </span>
                </h3>

                {/* Current RSVP Status */}
                {selectedEvent.userRsvp === 'CONFIRMED' && !showAbsenceForm && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Vous avez confirmé votre présence à cet événement.
                  </div>
                )}
                {selectedEvent.userRsvp === 'DECLINED' && !showAbsenceForm && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 font-bold flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Vous avez déclaré votre absence. Justificatif envoyé au Coach.
                  </div>
                )}

                {/* RSVP Buttons */}
                {!showAbsenceForm && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleRsvpConfirm(selectedEvent.id)}
                      className={`py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        selectedEvent.userRsvp === 'CONFIRMED'
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                          : 'bg-white/5 text-slate-200 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {selectedEvent.userRsvp === 'CONFIRMED' ? '✅ Présence Confirmée' : 'Confirmer ma Présence'}
                    </button>

                    <button
                      onClick={() => handleRsvpDecline(selectedEvent.id)}
                      className={`py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        selectedEvent.userRsvp === 'DECLINED'
                          ? 'bg-[#B91C1C] text-white shadow-lg shadow-red-900/40'
                          : 'bg-white/5 text-slate-200 hover:bg-[#B91C1C]/20 border border-white/10 hover:border-[#B91C1C]/40'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      {selectedEvent.userRsvp === 'DECLINED' ? '❌ Absence Déclarée' : 'Déclarer mon Absence'}
                    </button>
                  </div>
                )}

                {/* ABSENCE JUSTIFICATION FORM */}
                {showAbsenceForm && (
                  <div className="bg-[#0A0C15] rounded-2xl border border-[#B91C1C]/40 p-5 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-white">
                      <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                      <span>Justificatif d'Absence Obligatoire</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Votre justificatif sera transmis automatiquement au Coach <strong className="text-white">David Vance</strong> sous forme de notification.
                    </p>

                    {absenceSubmitted ? (
                      <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-bold text-center flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-6 h-6" />
                        Justificatif envoyé ! Le Coach en a été notifié. 🔔
                      </div>
                    ) : (
                      <>
                        {/* Reason Select */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-300">Motif de l'Absence :</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {ABSENCE_REASONS.map((r) => (
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
                        </div>

                        {/* Details Textarea */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-300">Explications supplémentaires :</label>
                          <textarea
                            value={absenceDetails}
                            onChange={(e) => setAbsenceDetails(e.target.value)}
                            placeholder="Détaillez brièvement la raison de votre absence (ex: Douleur genou gauche, rendez-vous médical le matin…)"
                            className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 min-h-[80px] resize-none focus:outline-none focus:border-[#B91C1C]"
                          />
                        </div>

                        {/* Form Actions */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAbsenceForm(false)}
                            className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            disabled={!absenceDetails.trim()}
                            onClick={() => handleSubmitAbsence(selectedEvent.id)}
                            className="flex-2 px-6 py-2 rounded-xl bg-linear-to-r from-[#B91C1C] to-[#881337] text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:opacity-90 transition-opacity"
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

      {/* ============================================================== */}
      {/* COACH NOTIFICATIONS PANEL (Absence Justifications Inbox)        */}
      {/* ============================================================== */}
      {showNotifPanel && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#0D0F1A] rounded-3xl border border-white/15 max-w-xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#D97706]/20 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-[#D97706]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">Justificatifs d'Absence</h3>
                    <p className="text-xs text-slate-400">Notifications reçues par le Coach</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotifPanel(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {allJustifications.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-slate-400 text-sm font-semibold">Aucun justificatif d'absence reçu.</p>
                  <p className="text-slate-500 text-xs">Tous les joueurs sont disponibles ! 🔥</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allJustifications.map((j, idx) => {
                    const reasonLabel = ABSENCE_REASONS.find((r) => r.id === j.reason)?.label || j.reason;
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

                        <div className="text-xs bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-1">
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
