import React, { useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import type { StoryGroup } from '../../types';

interface StoriesBarProps {
  stories: StoryGroup[];
  currentUserName?: string;
  currentUserAvatar?: string;
  onOpenStory: (storyGroup: StoryGroup, initialIndex?: number) => void;
  onAddStory: () => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  stories,
  currentUserName = 'Moi',
  currentUserAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
  onOpenStory,
  onAddStory,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group w-full py-2">
      {/* ✅ Bouton défilement gauche (Desktop) — key ajoutée */}
      <button
        key="scroll-left"
        onClick={() => handleScroll('left')}
        aria-label="Défiler les stories vers la gauche"
        className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#0F121A]/90 border border-white/15 text-white items-center justify-center shadow-lg hover:bg-[#FF2A3B] transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* ✅ Conteneur défilable horizontal — key ajoutée */}
      <div
        key="scroll-container"
        ref={scrollRef}
        className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar px-1 py-2 scroll-smooth"
      >
        {/* 1. Votre Story / Ajouter — ✅ key ajoutée */}
        <button
          key="add-story"
          onClick={onAddStory}
          className="flex flex-col items-center gap-1.5 shrink-0 group/item cursor-pointer focus:outline-none"
        >
          <div className="relative w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-full p-[2px] border-2 border-dashed border-[#FF2A3B]/60 group-hover/item:border-[#FF2A3B] transition-all">
            <img
              src={currentUserAvatar}
              alt="Votre avatar"
              className="w-full h-full object-cover rounded-full bg-slate-800"
            />
            <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#FF2A3B] text-white flex items-center justify-center border-2 border-[#090A0F] shadow-sm">
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-300 group-hover/item:text-white truncate max-w-[70px]">
            {currentUserName === 'Moi' ? 'Votre story' : 'Ma story'}
          </span>
        </button>

        {/* 2. Liste des stories d'autres clubs / joueurs */}
        {stories.map((group, idx) => {
          const hasUnseen = group.hasUnseen;
          // ✅ Fallback d'id pour éviter les keys undefined
          const groupKey = group.id || `story-${idx}`;

          return (
            <button
              key={groupKey}
              onClick={() => onOpenStory(group)}
              className="flex flex-col items-center gap-1.5 shrink-0 group/item cursor-pointer focus:outline-none transition-transform hover:scale-105"
            >
              <div
                className={`relative w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-full flex items-center justify-center ${hasUnseen
                    ? 'story-ring-unseen shadow-lg shadow-[#FF2A3B]/20'
                    : 'story-ring-seen'
                  }`}
              >
                <div className="w-full h-full rounded-full p-[2px] bg-[#090A0F]">
                  <img
                    src={
                      group.authorAvatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        group.authorName || 'Story'
                      )}&background=FF2A3B&color=fff`
                    }
                    alt={group.authorName || 'Story'}
                    className="w-full h-full object-cover rounded-full bg-slate-800"
                  />
                </div>

                {/* Badge club certifié */}
                {group.isClub && (
                  <span
                    title="Club officiel"
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FFB800] text-black flex items-center justify-center shadow"
                  >
                    <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
                  </span>
                )}
              </div>

              <span className="text-[11px] font-medium text-slate-200 group-hover/item:text-white truncate max-w-[72px]">
                {group.authorName || 'Story'}
              </span>
            </button>
          );
        })}
      </div>

      {/* ✅ Bouton défilement droit (Desktop) — key ajoutée */}
      <button
        key="scroll-right"
        onClick={() => handleScroll('right')}
        aria-label="Défiler les stories vers la droite"
        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#0F121A]/90 border border-white/15 text-white items-center justify-center shadow-lg hover:bg-[#FF2A3B] transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};