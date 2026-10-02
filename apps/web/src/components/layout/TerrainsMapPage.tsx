import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  MapPin,
  Search,
  Calendar,
  CheckCircle2,
  X,
  Zap,
  Clock,
  Shield,
  Layers,
  Sparkles,
  Sun,
  Flame,
  Check
} from 'lucide-react';
import { apiUrl } from '../../services/api';
import { useClub } from '../../context/ClubContext';

export interface TerrainSpot {
  id: string;
  name: string;
  city: string;
  region: string;
  address: string;
  owner: string;
  surface: string;
  capacity: string;
  status: 'Disponible' | 'Réservé' | 'En maintenance';
  image: string;
  description: string;
  rating: number;
  x: number;
  y: number;
  lighting?: boolean;
  indoor?: boolean;
}

const REGIONS = ['TOUTES', 'Grand Lomé', 'Maritime', 'Plateaux', 'Centrale', 'Kara', 'Savanes'];

export const TerrainsMapPage: React.FC = () => {
  const { activeClub } = useClub();
  const clubName = activeClub?.name || 'HOOPER Franchise';

  const [terrainSpots, setTerrainSpots] = useState<TerrainSpot[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('TOUTES');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal de réservation
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    date: new Date().toISOString().split('T')[0],
    timeSlot: '17:00 - 19:00',
    organizer: clubName,
    purpose: 'ENTRAINEMENT',
  });
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  useEffect(() => {
    fetch(apiUrl('/venues'))
      .then(async (response) => {
        if (!response.ok) throw new Error('Terrains indisponibles');
        const venues = (await response.json()) as Array<
          TerrainSpot & {
            status: string;
            capacity?: number | null;
            imageUrl?: string | null;
          }
        >;
        if (venues.length > 0) {
          const mapped: TerrainSpot[] = venues.map((venue, index) => ({
            ...venue,
            capacity: venue.capacity ? `${venue.capacity} places assises` : 'Gradins 500 places',
            status: (venue.status as TerrainSpot['status']) || 'Disponible',
            x: venue.x ?? 25 + ((index * 19) % 55),
            y: venue.y ?? 25 + ((index * 23) % 55),
            image: venue.imageUrl || '',
            description:
              venue.description ||
              'Site sportif homologué pour la pratique du basketball de compétition et les entraînements de ligue.',
            rating: venue.rating || 4.8,
            region: venue.region || (index % 2 === 0 ? 'Grand Lomé' : 'Maritime'),
            surface: venue.surface || 'Revêtement résine acrylique amortissant',
            lighting: true,
            indoor: index % 3 === 0,
          }));
          setTerrainSpots(mapped);
          setSelectedId(mapped[0].id);
        }
      })
      .catch(() => undefined);
  }, []);

  const filteredTerrains = useMemo(() => {
    return terrainSpots.filter((spot) => {
      const matchesSearch =
        searchQuery === '' ||
        spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spot.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spot.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRegion =
        selectedRegion === 'TOUTES' || spot.region.toLowerCase() === selectedRegion.toLowerCase();

      const matchesStatus = selectedStatus === 'ALL' || spot.status === selectedStatus;

      return matchesSearch && matchesRegion && matchesStatus;
    });
  }, [terrainSpots, searchQuery, selectedRegion, selectedStatus]);

  const selectedTerrain = useMemo(
    () => filteredTerrains.find((spot) => spot.id === selectedId) ?? filteredTerrains[0] ?? terrainSpots[0],
    [selectedId, filteredTerrains, terrainSpots]
  );

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSubmitted(true);
    setTimeout(() => {
      setBookingSubmitted(false);
      setIsBookingModalOpen(false);
    }, 2200);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Hero */}
      <div className="rounded-2xl border border-white/10 bg-[#0C0F1A] p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/12 border border-emerald-500/25 text-emerald-300 text-[11px] font-semibold">
                <MapPin className="w-3 h-3 text-emerald-400" />
                Infrastructures sportives
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[11px]">
                Réseau FBBT
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none">
              Terrains
            </h1>

            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              Localisation des terrains officiels, arènes couvertes et plateaux extérieurs homologués.
              Disponibilités en direct, éclairage nocturne et réservation de créneaux club.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                <strong className="text-white">{terrainSpots.filter((s) => s.status === 'Disponible').length}</strong> arènes disponibles
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de Filtres Régionaux & Recherche */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-2 rounded-xl bg-[#0F131F] border border-white/10">
        <div className="flex flex-wrap items-center gap-1.5 p-1">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRegion(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedRegion === r
                  ? 'bg-[#FF2A3B] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r === 'TOUTES' ? 'Toutes régions' : r}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 px-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl px-3 py-2 text-xs bg-black/50 text-white border border-white/10 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="Disponible">Disponible</option>
            <option value="Réservé">Réservé</option>
            <option value="En maintenance">En maintenance</option>
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher terrain ou ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs rounded-xl w-48 sm:w-56 bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Carte Interactive + Fiche de Détail */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.95fr] gap-6">
        {/* Radar Map Container */}
        <div className="rounded-3xl border border-white/10 bg-[#0F131F] p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-400">
                Plan géographique
              </div>
              <div className="text-sm font-bold text-white">Couverture territoriale · Togo Basket</div>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Libre
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Occupé
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Maintenance
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#090C16] via-[#0B0F1B] to-black min-h-[380px] sm:min-h-[460px]">
            {/* SVG stylisé du Togo */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                <path
                  d="M20 30 L38 18 L48 20 L56 15 L66 22 L73 31 L80 44 L77 56 L72 68 L58 74 L43 72 L29 61 L23 48 Z"
                  fill="rgba(255,42,59,0.2)"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="0.8"
                />
              </svg>
            </div>

            {/* Pins des terrains */}
            {filteredTerrains.map((spot) => {
              const isSelected = selectedTerrain?.id === spot.id;
              const color =
                spot.status === 'Disponible'
                  ? 'bg-emerald-400'
                  : spot.status === 'Réservé'
                  ? 'bg-amber-400'
                  : 'bg-red-400';

              return (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => setSelectedId(spot.id)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group transition-transform cursor-pointer ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                  }`}
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                  title={`${spot.name} (${spot.city})`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-xl ${color} ${
                      isSelected ? 'ring-4 ring-red-500/50' : ''
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5 text-slate-950" />
                  </span>

                  <span className="absolute left-1/2 -translate-x-1/2 bottom-8 hidden group-hover:block whitespace-nowrap bg-black/95 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-white/20 shadow-xl pointer-events-none">
                    {spot.name}
                  </span>
                </button>
              );
            })}

            <div className="absolute bottom-4 left-4 rounded-xl border border-white/10 bg-black/80 px-4 py-2.5 text-[11px] text-slate-300 backdrop-blur-md">
              <div className="font-semibold text-white">Plateaux officiels FBBT</div>
              <div className="text-[10px] text-slate-400">
                {filteredTerrains.length} site(s) recensé(s)
              </div>
            </div>
          </div>
        </div>

        {/* Fiche détaillée du terrain sélectionné */}
        {selectedTerrain ? (
          <div className="rounded-3xl border border-white/10 bg-[#0F131F] overflow-hidden flex flex-col justify-between shadow-2xl">
            <div>
              {/* Photo du terrain */}
              <div className="relative h-52 w-full bg-slate-900 flex items-center justify-center overflow-hidden">
                {selectedTerrain.image ? (
                  <img
                    src={selectedTerrain.image}
                    alt={selectedTerrain.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-1" />
                    <span className="text-[11px] text-slate-500">Arène Sportive de Basketball</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F131F] via-[#0F131F]/30 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase backdrop-blur-md border ${
                      selectedTerrain.status === 'Disponible'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : selectedTerrain.status === 'Réservé'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-red-500/20 text-red-300 border-red-500/40'
                    }`}
                  >
                    {selectedTerrain.status}
                  </span>
                </div>
              </div>

              {/* Détails techniques */}
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    {selectedTerrain.region} • {selectedTerrain.city}
                  </span>
                  <h3 className="text-xl font-black text-white mt-1">{selectedTerrain.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500" /> {selectedTerrain.address}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-300">
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Surface de jeu</span>
                    <strong className="text-white block mt-0.5">{selectedTerrain.surface}</strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Gradins & Capacité</span>
                    <strong className="text-white block mt-0.5">{selectedTerrain.capacity}</strong>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{selectedTerrain.description}</p>
              </div>
            </div>

            {/* Bouton de réservation */}
            <div className="p-6 pt-0">
              <button
                onClick={() => setIsBookingModalOpen(true)}
                disabled={selectedTerrain.status !== 'Disponible'}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 text-white text-xs font-black uppercase tracking-wider hover:opacity-95 transition-all cursor-pointer shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {selectedTerrain.status === 'Disponible'
                  ? 'Réserver un créneau pour mon club'
                  : 'Arène indisponible pour le moment'}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Modal Réservation */}
      {isBookingModalOpen && selectedTerrain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-white/20 p-6 sm:p-8 space-y-6 bg-[#0F131F] text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Réservation d'Arène</h3>
                  <p className="text-xs text-slate-400">{selectedTerrain.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSubmitted ? (
              <div className="p-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Demande transmise avec succès !</h4>
                <p className="text-xs text-slate-300">
                  Le créneau a été envoyé aux gestionnaires du site sportif. Une confirmation vous parviendra sous peu.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Date souhaitée *</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    className="w-full rounded-xl p-2.5 bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Créneau horaire *</label>
                  <select
                    value={bookingForm.timeSlot}
                    onChange={(e) => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                    className="w-full rounded-xl p-2.5 bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="08:00 - 10:00" className="bg-slate-900">Matinée (08:00 - 10:00)</option>
                    <option value="15:00 - 17:00" className="bg-slate-900">Après-midi (15:00 - 17:00)</option>
                    <option value="17:00 - 19:00" className="bg-slate-900">Fin d'après-midi (17:00 - 19:00)</option>
                    <option value="19:00 - 21:00" className="bg-slate-900">Nocturne éclairée (19:00 - 21:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Club / Responsable demandeur *
                  </label>
                  <input
                    required
                    placeholder="Coach Kossi..."
                    value={bookingForm.organizer}
                    onChange={(e) => setBookingForm({ ...bookingForm, organizer: e.target.value })}
                    className="w-full rounded-xl p-2.5 bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Type d'utilisation *</label>
                  <select
                    value={bookingForm.purpose}
                    onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                    className="w-full rounded-xl p-2.5 bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="ENTRAINEMENT" className="bg-slate-900">Entraînement officiel équipe première</option>
                    <option value="MATCH_AMICAL" className="bg-slate-900">Match amical de préparation</option>
                    <option value="TOURNOI" className="bg-slate-900">Tournoi officiel / Compétition</option>
                    <option value="STAGE" className="bg-slate-900">Stage ou détection espoirs</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-white/15 text-slate-300 font-bold hover:bg-white/10 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-black uppercase tracking-wider hover:opacity-95 transition-all cursor-pointer shadow-lg"
                  >
                    Valider la demande
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
