import { useMemo } from 'react';
import { Billboard } from '@react-three/drei';
import { localProgress, SCENES, easeInOutCubic, easeOutCubic } from '../timeline/timeline';
import {
    PlayerCard,
    FeedCard,
    ClubCard,
    MessageCard,
    StoryCard,
    StatsCard,
} from '../components/cards';

/* ═══════════════════════════════════════════════════════════════════════════
 *  SCÈNE 09 — Cartes HOOPERS en orbite autour du ballon
 *  6 cartes tournent en couronne, chacune billboardée face caméra.
 *  Vitesse et rayons subtilement variés pour un effet satellite réaliste.
 * ═══════════════════════════════════════════════════════════════════════════ */

const CARDS = [
    PlayerCard,
    FeedCard,
    ClubCard,
    MessageCard,
    StoryCard,
    StatsCard,
] as const;

/** Rayons légèrement différents → profondeur 3D naturelle */
const RADII = [3.6, 4.2, 3.4, 4.4, 3.8, 4.0] as const;

/** Hauteurs alternées → évite l'effet « plat » */
const HEIGHTS = [1.7, 2.1, 1.3, 1.9, 1.5, 2.3] as const;

/** Décalage angulaire pour ne pas tous les aligner */
const ANGLE_OFFSETS = [0, 0.3, 0.6, 0.9, 1.2, 1.5] as const;

/** Vitesse orbitale (rad/s) */
const ANGULAR_SPEED = 0.22;

export const Scene09 = ({ time }: { time: number }) => {
    const p = localProgress(time, SCENES.S09.start, SCENES.S09.end);

    // Apparition progressive des cartes
    const globalAppear = easeInOutCubic(Math.min(p / 0.4, 1));
    // Disparition en fin de scène
    const fade = p > 0.78 ? 1 - (p - 0.78) / 0.22 : 1;

    // Angle global en fonction du temps absolu
    const baseAngle = (time - SCENES.S09.start) * ANGULAR_SPEED;

    // Pré-calcule les slots des cartes
    const slots = useMemo(() => {
        return CARDS.map((Card, i) => {
            const angle = ANGLE_OFFSETS[i];
            return {
                Card,
                angle,
                radius: RADII[i],
                height: HEIGHTS[i],
                delay: i * 0.06,
            };
        });
    }, []);

    return (
        <group>
            {slots.map(({ Card, angle, radius, height, delay }, i) => {
                const localP = Math.max(0, Math.min(1, (p - delay) / 0.5));
                if (localP <= 0.001) return null;

                const appear = easeOutCubic(localP);
                const finalAngle = baseAngle + angle;

                const x = Math.cos(finalAngle) * radius;
                const z = Math.sin(finalAngle) * radius;

                // Les cartes les plus éloignées (z < 0) paraissent un peu plus petites
                const depthScale = 0.85 + 0.15 * ((z + radius) / (2 * radius));

                return (
                    <Billboard
                        key={i}
                        position={[x, height, z]}
                    >
                        <Card
                            scale={appear * depthScale * 0.58}
                            opacity={appear * fade}
                        />
                    </Billboard>
                );
            })}
        </group>
    );
};