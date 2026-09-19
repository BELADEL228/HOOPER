import { useEffect, useMemo, useState } from 'react';
import { Building2, Camera, MapPin, ShieldCheck, Star } from 'lucide-react';
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
}

const fallbackTerrainSpots: TerrainSpot[] = [
  {
    id: 'adetikopé',
    name: "Terrain du Lycée d'Adétikopé",
    city: 'Lomé',
    region: 'Maritime',
    address: 'Quartier Adétikopé, Lomé — Togo',
    owner: 'FIRE STONE Basketball Club',
    surface: 'Terrain synthétique / gazon renforcé',
    capacity: '1200 spectateurs',
    status: 'Disponible',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80',
    description: 'Principal terrain d’entraînement et de matches à domicile du club, au cœur du quartier d’Adétikopé.',
    rating: 4.9,
    x: 56,
    y: 62,
  },
  {
    id: 'atakpame',
    name: 'Complexe Sportif d’Atakpamé',
    city: 'Atakpamé',
    region: 'Plateau',
    address: 'Route Nationale 1, Atakpamé — Togo',
    owner: 'Ministère des Sports',
    surface: 'Terrain semi-gazonné',
    capacity: '800 spectateurs',
    status: 'Réservé',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&auto=format&fit=crop&q=80',
    description: 'Site de préparation régional, utilisé pour les rencontres de sélection et les camps jeunes.',
    rating: 4.7,
    x: 41,
    y: 44,
  },
  {
    id: 'kara',
    name: 'Court National de Kara',
    city: 'Kara',
    region: 'Kara',
    address: 'Boulevard de la République, Kara — Togo',
    owner: 'Fédération Togolaise de Basket',
    surface: 'Indoor + extérieur',
    capacity: '600 spectateurs',
    status: 'Disponible',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
    description: 'Terrain polyvalent pour stages, compétitions et entraînements régionaux.',
    rating: 4.6,
    x: 69,
    y: 26,
  },
  {
    id: 'dapaong',
    name: 'Salle Omnisports de Dapaong',
    city: 'Dapaong',
    region: 'Savanes',
    address: 'Zone sportive, Dapaong — Togo',
    owner: 'Direction Régionale des Sports',
    surface: 'Salle intérieure',
    capacity: '500 spectateurs',
    status: 'En maintenance',
    image: 'https://images.unsplash.com/photo-1521417531038-928ec6d4d6d9?w=1200&auto=format&fit=crop&q=80',
    description: 'Complexe pensé pour les entraînements intérieurs et les rencontres interrégionales.',
    rating: 4.4,
    x: 80,
    y: 34,
  },
];

export const TerrainsMapPage: React.FC = () => {
  const [terrainSpots, setTerrainSpots] = useState<TerrainSpot[]>(fallbackTerrainSpots);
  const [selectedId, setSelectedId] = useState<string>(fallbackTerrainSpots[0].id);

  useEffect(() => {
    fetch(apiUrl('/venues'))
      .then(async (response) => {
        if (!response.ok) throw new Error('Terrains indisponibles');
        const venues = await response.json() as Array<TerrainSpot & { status: string; capacity?: number | null; imageUrl?: string | null }>;
        if (venues.length > 0) {
          const mapped = venues.map((venue, index) => ({
            ...venue,
            capacity: venue.capacity ? `${venue.capacity} spectateurs` : 'Capacité à confirmer',
            status: venue.status as TerrainSpot['status'],
            x: fallbackTerrainSpots[index % fallbackTerrainSpots.length].x,
            y: fallbackTerrainSpots[index % fallbackTerrainSpots.length].y,
            image: venue.imageUrl || fallbackTerrainSpots[index % fallbackTerrainSpots.length].image,
            description: venue.description || 'Site sportif répertorié sur la plateforme FIRE STONE.',
            rating: venue.rating || 0,
          }));
          setTerrainSpots(mapped);
          setSelectedId(mapped[0].id);
        }
      })
      .catch(() => undefined);
  }, []);

  const selectedTerrain = useMemo(
    () => terrainSpots.find((spot) => spot.id === selectedId) ?? terrainSpots[0],
    [selectedId, terrainSpots]
  );

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-3xl font-extrabold text-white">Terrains disponibles & sites sportifs nationaux</h2>
        <p className="text-slate-400 text-sm">Carte des infrastructures actives, réservées ou en maintenance dans les grandes villes du pays.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.95fr] gap-6">
        <div className="glass-panel rounded-3xl border border-white/10 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Carte du Togo</div>
              <div className="text-sm font-bold text-white">Infrastructures sportives</div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400" /> Disponible
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" /> Réservé
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400" /> Maintenance
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-linear-to-br from-emerald-950/40 via-slate-950 to-slate-900 min-h-115">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(34,197,94,0.15),transparent_25%),radial-gradient(circle_at_70%_20%,rgba(251,191,36,0.1),transparent_18%),radial-gradient(circle_at_50%_65%,rgba(59,130,246,0.12),transparent_28%)]" />
            <div className="absolute inset-0 opacity-40">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                <path d="M20 30 L38 18 L48 20 L56 15 L66 22 L73 31 L80 44 L77 56 L72 68 L58 74 L43 72 L29 61 L23 48 Z" fill="rgba(15,118,110,0.2)" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
              </svg>
            </div>

            {terrainSpots.map((spot) => {
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
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                  title={spot.name}
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-lg ${color}`}>
                    <MapPin className="h-2.5 w-2.5 text-slate-950" />
                  </span>
                </button>
              );
            })}

            <div className="absolute bottom-4 left-4 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-[10px] text-slate-300 backdrop-blur-sm">
              <div className="font-bold text-white">Togo • 4 sites répertoriés</div>
              <div>Principalement dans les villes de Lomé, Kara et Atakpamé</div>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
          <div className="relative h-44 w-full">
            <img src={selectedTerrain.image} alt={selectedTerrain.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-900/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="inline-flex rounded-full border border-white/20 bg-black/40 px-2 py-1 text-[10px] text-slate-200 backdrop-blur-sm">
                {selectedTerrain.status}
              </div>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#FFB800]">Terrain sélectionné</div>
              <h3 className="mt-1 text-xl font-black text-white">{selectedTerrain.name}</h3>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300">
              <MapPin className="w-4 h-4 text-[#FF2A3B]" />
              <span>{selectedTerrain.address}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="rounded-xl bg-white/5 p-2.5 border border-white/10">
                <div className="text-slate-400">Propriétaire</div>
                <div className="mt-1 font-bold text-white">{selectedTerrain.owner}</div>
              </div>
              <div className="rounded-xl bg-white/5 p-2.5 border border-white/10">
                <div className="text-slate-400">Capacité</div>
                <div className="mt-1 font-bold text-white">{selectedTerrain.capacity}</div>
              </div>
              <div className="rounded-xl bg-white/5 p-2.5 border border-white/10 col-span-2">
                <div className="text-slate-400">Surface</div>
                <div className="mt-1 font-bold text-white">{selectedTerrain.surface}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Star className="w-4 h-4 fill-[#FFB800] text-[#FFB800]" />
              <span>{selectedTerrain.rating}/5 • Site reconnu pour les matchs et stages du club</span>
            </div>

            <p className="text-xs leading-relaxed text-slate-300">{selectedTerrain.description}</p>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-[11px] text-emerald-300">
              <div className="flex items-center gap-2 font-bold">
                <ShieldCheck className="w-4 h-4" /> Système de réservation club
              </div>
              <p className="mt-1 text-emerald-200/90">Le terrain est géré par le club ou l’autorité locale selon les disponibilités du calendrier.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {terrainSpots.map((spot) => (
          <button
            key={spot.id}
            type="button"
            onClick={() => setSelectedId(spot.id)}
            className={`glass-panel rounded-2xl border p-3 text-left transition-all ${selectedId === spot.id ? 'border-[#FF2A3B] bg-[#FF2A3B]/10' : 'border-white/10 hover:border-white/20'
              }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#FFB800]" />
                <span className="text-sm font-bold text-white">{spot.city}</span>
              </div>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${spot.status === 'Disponible'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : spot.status === 'Réservé'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-red-500/20 text-red-300'
                }`}>
                {spot.status}
              </span>
            </div>

            <div className="mt-3 text-xs font-bold text-slate-100">{spot.name}</div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
              <Camera className="w-3 h-3" /> Site sportif • {spot.region}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
