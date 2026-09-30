// scenes/Scene08.tsx — Cards progressives (12.5-15.5 s)
import { localProgress, SCENES, easeOutCubic } from '../timeline/timeline';
import { ClubCard, MessageCard, StoryCard, StatsCard } from '../components/cards';

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
    { Comp: ClubCard, delay: 0.00, pos: [-2.7, 2.4, 1.4], rot: [0, 0.5, -0.03], side: -1 },
    { Comp: MessageCard, delay: 0.15, pos: [-2.6, 0.2, 1.4], rot: [0, 0.5, 0.04], side: -1 },
    { Comp: StoryCard, delay: 0.30, pos: [2.7, 2.4, 1.4], rot: [0, -0.5, 0.03], side: 1 },
    { Comp: StatsCard, delay: 0.45, pos: [2.6, 0.2, 1.4], rot: [0, -0.5, -0.04], side: 1 },
];

export const Scene08 = ({ time }: { time: number }) => {
    const p = localProgress(time, SCENES.S08.start, SCENES.S08.end);
    const fade = p > 0.92 ? 1 - (p - 0.92) / 0.08 : 1;

    return (
        <group>
            {CARDS.map(({ Comp, delay, pos, rot, side }, i) => {
                /* ⚡ Apparition plus lente (0.6 au lieu de 0.4) */
                const local = Math.max(0, Math.min(1, (p - delay) / 0.6));
                const eased = easeOutCubic(local);
                if (eased <= 0.001) return null;

                const x = pos[0] + (1 - eased) * side * 1.5;

                return (
                    <Comp
                        key={i}
                        position={[x, pos[1], pos[2]]}
                        rotation={rot}
                        scale={0.85 + 0.15 * eased}
                        opacity={eased * fade}
                    />
                );
            })}
        </group>
    );
};