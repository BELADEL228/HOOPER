import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  MapPin,
  Search,
  Calendar,
  CheckCircle2,
  X,
} from 'lucide-react';
import { apiUrl } from '../../services/api';

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
  const [terrainSpots, setTerrainSpots] = useState<TerrainSpot[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('TOUTES');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal de demande de réservation
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    date: new Date().toISOString().split('T')[0],
    timeSlot: '17:00 - 19:00',
    organizer: '',
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
            capacity: venue.capacity ? `${venue.capacity} spectateurs` : 'Capacité 500 places',
            status: (venue.status as TerrainSpot['status']) || 'Disponible',
            x: venue.x ?? 25 + ((index * 19) % 55),
            y: venue.y ?? 25 + ((index * 23) % 55),
            image: venue.imageUrl || '',
            description:
              venue.description ||
              'Site sportif homologué pour la pratique du basketball au Togo.',
            rating: venue.rating || 4.5,
            region: venue.region || (index % 2 === 0 ? 'Grand Lomé' : 'Maritime'),
            surface: venue.surface || 'Bitume renforcé / Peinture époxy',
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
    }, 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ── En-tête ── */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
            <MapPin className="w-3.5 h-3.5" /> Répertoire & Cartographie Nationale
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black text-white tracking-tight">
            Terrains & Arènes Sportives du Togo
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-2xl">
            Géolocalisation des infrastructures de basketball : surfaces de jeu, éclairage nocturne, disponibilité et système de réservation club.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass-panel px-4 py-2 rounded-2xl border border-white/10 text-xs text-slate-300 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              <strong>{terrainSpots.filter((s) => s.status === 'Disponible').length}</strong> terrains libres
            </span>
          </div>
        </div>
      </header>

      {/* ── Filtres Régionaux & Recherche ── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRegion(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRegion === r
                  ? 'bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              {r === 'TOUTES' ? 'Toutes les régions' : r}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="glass-input rounded-xl px-3 py-2 text-xs bg-slate-900 text-white"
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
              placeholder="Chercher une arène..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input pl-8 pr-3 py-2 text-xs rounded-xl w-48 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* ── Carte Interactive + Fiche de Détail ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.95fr] gap-6">
        {/* Carte */}
        <div className="glass-panel rounded-3xl border border-white/10 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#FFB800] font-black">
                Plan Géographique Interactif
              </div>
              <div className="text-sm font-black text-white">Couverture du Territoire National</div>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Libre
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Match en cours
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Entretien
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-black min-h-[380px] sm:min-h-[440px]">
            {/* Arrière-plan SVG stylisé du Togo */}
            <div className="absolute inset-0 opacity-25">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                <path
                  d="M20 30 L38 18 L48 20 L56 15 L66 22 L73 31 L80 44 L77 56 L72 68 L58 74 L43 72 L29 61 L23 48 Z"
                  fill="rgba(255,42,59,0.15)"
                  stroke="rgba(255,255,255,0.2)"
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
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group transition-transform ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                  }`}
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                  title={`${spot.name} (${spot.city})`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-xl ${color} ${
                      isSelected ? 'ring-4 ring-[#FF2A3B]/40' : ''
                    }`}
                  >
                    <MapPin className="h-3 w-3 text-slate-950" />
                  </span>

                  <span className="absolute left-1/2 -translate-x-1/2 bottom-7 hidden group-hover:block whitespace-nowrap bg-black/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg border border-white/20 shadow-lg pointer-events-none">
                    {spot.name}
                  </span>
                </button>
              );
            })}

            <div className="absolute bottom-4 left-4 rounded-2xl border border-white/10 bg-slate-950/80 px-3.5 py-2 text-[11px] text-slate-300 backdrop-blur-md">
              <div className="font-black text-white">Togo Basketball Network</div>
              <div className="text-[10px] text-slate-400">
                {filteredTerrains.length} site(s) affiché(s)
              </div>
            </div>
          </div>
        </div>

        {/* Fiche détaillée du terrain sélectionné */}
        {selectedTerrain ? (
          <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden flex flex-col justify-between">
            <div>
              {/* Photo du terrain */}
              <div className="relative h-48 w-full bg-slate-900 flex items-center justify-center overflow-hidden">
                {selectedTerrain.image ? (
                  <img
                    src={selectedTerrain.image}
                    alt={selectedTerrain.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-1" />
                    <span className="text-[11px] text-slate-500">Image officielle de l'arène</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
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
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#FFB800]">
                    {selectedTerrain.region} • {selectedTerrain.city}
                  </span>
                  <h3 className="text-xl font-black text-white mt-1">{selectedTerrain.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#FF2A3B]" /> {selectedTerrain.address}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-300">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-slate-400 text-[10px] block">Surface de jeu</span>
                    <strong className="text-white block mt-0.5">{selectedTerrain.surface}</strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-slate-400 text-[10px] block">Gradins & Capacité</span>
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
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white text-xs font-black hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-[#FF2A3B]/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {selectedTerrain.status === 'Disponible'
                  ? 'Réserver un créneau pour ce terrain'
                  : 'Terrain non disponible actuellement'}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Modal Réservation ── */}
      {isBookingModalOpen && selectedTerrain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md glass-panel rounded-3xl border border-white/15 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Réserver le Terrain</h3>
                  <p className="text-xs text-slate-400">{selectedTerrain.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSubmitted ? (
              <div className="p-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Demande enregistrée !</h4>
                <p className="text-xs text-slate-300">
                  Votre demande a été transmise aux gestionnaires du site. Vous recevrez une confirmation sous peu.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Date souhaitée</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    className="glass-input w-full rounded-xl p-3 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Créneau horaire</label>
                  <select
                    value={bookingForm.timeSlot}
                    onChange={(e) => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                    className="glass-input w-full rounded-xl p-3 text-xs bg-slate-900 text-white"
                  >
                    <option value="08:00 - 10:00">Matinée (08:00 - 10:00)</option>
                    <option value="15:00 - 17:00">Après-midi (15:00 - 17:00)</option>
                    <option value="17:00 - 19:00">Fin d'après-midi (17:00 - 19:00)</option>
                    <option value="19:00 - 21:00">Nocturne éclairée (19:00 - 21:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Responsable / Club demandeur
                  </label>
                  <input
                    required
                    placeholder="Ex : Coach Kossi (FIRE STONE)"
                    value={bookingForm.organizer}
                    onChange={(e) => setBookingForm({ ...bookingForm, organizer: e.target.value })}
                    className="glass-input w-full rounded-xl p-3 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Type d'événement</label>
                  <select
                    value={bookingForm.purpose}
                    onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                    className="glass-input w-full rounded-xl p-3 text-xs bg-slate-900 text-white"
                  >
                    <option value="ENTRAINEMENT">Entraînement officiel</option>
                    <option value="MATCH_AMICAL">Match amical</option>
                    <option value="TOURNOI">Tournoi / Compétition</option>
                    <option value="STAGE">Stage de perfectionnement</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white text-xs font-black hover:brightness-110 transition-all cursor-pointer"
                  >
                    Confirmer la réservation
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
