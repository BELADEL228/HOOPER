// scenes/Scene08.tsx — Cartes progressives (22-26s)
import { localProgress, SCENES, easeOutCubic } from '../timeline/timeline';
import {
    ClubCard,
    MessageCard,
    StoryCard,
    StatsCard,
} from '../components/cards';

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
}

const CARDS: CardSlot[] = [
    { Comp: ClubCard, delay: 0.00, pos: [-3.6, 3.1, 2.1], rot: [0, 0.55, -0.03] },
    { Comp: MessageCard, delay: 0.15, pos: [-3.4, 0.2, 2.1], rot: [0, 0.5, 0.05] },
    { Comp: StoryCard, delay: 0.30, pos: [3.6, 3.1, 2.1], rot: [0, -0.55, 0.03] },
    { Comp: StatsCard, delay: 0.45, pos: [3.4, 0.2, 2.1], rot: [0, -0.5, -0.05] },
];

export const Scene08 = ({ time }: { time: number }) => {
    const p = localProgress(time, SCENES.S08.start, SCENES.S08.end);
    const fade = p > 0.9 ? 1 - (p - 0.9) / 0.1 : 1;

    return (
        <group>
            {CARDS.map(({ Comp, delay, pos, rot }, i) => {
                const local = Math.max(0, Math.min(1, (p - delay) / 0.4));
                const eased = easeOutCubic(local);
                if (eased <= 0.001) return null;

                return (
                    <Comp
                        key={i}
                        position={pos}
                        rotation={rot}
                        scale={0.85 + 0.15 * eased}
                        opacity={eased * fade}
                    />
                );
            })}
        </group>
    );
};