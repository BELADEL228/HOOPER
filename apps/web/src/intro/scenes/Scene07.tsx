// scenes/Scene07.tsx — Premières cards (9.5-12.5 s)
import { localProgress, SCENES, easeOutCubic } from '../timeline/timeline';
import { PlayerCard, FeedCard } from '../components/cards';

type Vec3 = [number, number, number];

interface CardSlot {
    Comp: React.ComponentType<{
        position?: Vec3;
        rotation?: Vec3;
        scale?: number;
        opacity?: number;
    }>;
    delay: number;
    pos: Vec3;
    rot: Vec3;
    side: -1 | 1;
}

const CARDS: CardSlot[] = [
    { Comp: PlayerCard, delay: 0.05, pos: [-2.5, 1.6, 1.2], rot: [0, 0.5, -0.03], side: -1 },
    { Comp: FeedCard, delay: 0.35, pos: [2.5, 1.4, 1.2], rot: [0, -0.5, 0.03], side: 1 },
];

export const Scene07 = ({ time }: { time: number }) => {
    const p = localProgress(time, SCENES.S07.start, SCENES.S07.end);
    const fade = p > 0.92 ? 1 - (p - 0.92) / 0.08 : 1;

    return (
        <group>
            {CARDS.map(({ Comp, delay, pos, rot, side }, i) => {
                /* ⚡ Apparition plus lente (0.6 au lieu de 0.4) */
                const local = Math.max(0, Math.min(1, (p - delay) / 0.6));
                const eased = easeOutCubic(local);
                if (eased <= 0.001) return null;

                /* Glissement depuis l'extérieur */
                const x = pos[0] + (1 - eased) * side * 1.5;

                return (
                    <Comp
                        key={i}
                        position={[x, pos[1], pos[2]]}
                        rotation={rot}
                        scale={0.88 + 0.12 * eased}
                        opacity={eased * fade}
                    />
                );
            })}
        </group>
    );
};