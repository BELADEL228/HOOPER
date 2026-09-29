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
}

const CARDS: CardSlot[] = [
    { Comp: PlayerCard, delay: 0, pos: [-3.4, 1.7, 1.6], rot: [0, 0.55, -0.04] },
    { Comp: FeedCard, delay: 0.35, pos: [3.4, 1.4, 1.6], rot: [0, -0.52, 0.03] },
];

export const Scene07 = ({ time }: { time: number }) => {
    const p = localProgress(time, SCENES.S07.start, SCENES.S07.end);
    const fade = p > 0.9 ? 1 - (p - 0.9) / 0.1 : 1;

    return (
        <group>
            {CARDS.map(({ Comp, delay, pos, rot }, i) => {
                const local = Math.max(0, Math.min(1, (p - delay) / 0.4));
                const eased = easeOutCubic(local);
                if (eased <= 0.001) return null;

                const dir = i === 0 ? -1 : 1;
                const x = pos[0] + (1 - eased) * dir * 1.2;

                return (
                    <Comp
                        key={i}
                        position={[x, pos[1], pos[2]]}
                        rotation={rot}
                        scale={0.9 + 0.1 * eased}
                        opacity={eased * fade}
                    />
                );
            })}
        </group>
    );
};