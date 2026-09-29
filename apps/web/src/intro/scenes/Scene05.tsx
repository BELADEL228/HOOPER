// scenes/Scene05.tsx — Bandeau HOOPERS (12-15s)
import { localProgress, SCENES, easeOutCubic, easeOutQuart } from '../timeline/timeline';
import { HudText } from '../components/HudText';

export const Scene05 = ({ time }: { time: number }) => {
    const p = localProgress(time, SCENES.S05.start, SCENES.S05.end);
    const enter = easeOutQuart(Math.min(p / 0.35, 1));
    const fade = p > 0.85 ? 1 - (p - 0.85) / 0.15 : 1;
    const opacity = enter * fade;

    // Position : entre à gauche, se stabilise, sort à droite
    const x = -3 + 3 * easeOutCubic(Math.min(p / 0.4, 1));
    const width = 0.6 + 3.4 * easeOutQuart(Math.min(p / 0.4, 1));

    return (
        <group visible={opacity > 0.01} position={[x, 0.95, 1.9]}>
            {/* Fond noir translucide */}
            <mesh position={[width / 2 - 0.3, 0, -0.005]}>
                <planeGeometry args={[width, 0.7]} />
                <meshBasicMaterial color={0x000000} transparent opacity={0.7 * opacity} />
            </mesh>

            {/* Barre accent OR à gauche */}
            <mesh position={[-0.3, 0, 0]}>
                <planeGeometry args={[0.06, 0.7]} />
                <meshBasicMaterial color={0xFFB800} transparent opacity={0.95 * opacity} />
            </mesh>

            {/* Titre principal */}
            <HudText
                position={[0, 0.06, 0.01]}
                fontSize={0.24}
                color="#FFFFFF"
                opacity={opacity}
                letterSpacing={0.34}
                fontWeight={700}
            >
                HOOPERS
            </HudText>

            {/* Sous-texte */}
            <HudText
                position={[0, -0.18, 0.01]}
                fontSize={0.085}
                color="#FFB800"
                opacity={opacity * 0.9}
                letterSpacing={0.24}
                fontWeight={500}
            >
                BASKETBALL · COMMUNITY
            </HudText>
        </group>
    );
};