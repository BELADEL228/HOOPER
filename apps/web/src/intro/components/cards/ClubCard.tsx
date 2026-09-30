import { GlassCard } from '../GlassCard';
import { HudText } from '../HudText';
import { Icon } from '../icons';
import { UIAvatar } from './ui';

interface ClubCardProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    opacity?: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  CLUB CARD — Espace club (AIGLE · Lomé)
 * ═══════════════════════════════════════════════════════════════════════════ */

export const ClubCard = ({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    opacity = 1,
}: ClubCardProps) => {
    const o = opacity;

    return (
        <GlassCard
            position={position}
            rotation={rotation}
            scale={scale}
            opacity={opacity}
            width={1.5}
            height={0.95}
            accentColor="#FFB800"
        >
            {/* ═══ HEADER ═══════════════════════════════════════════════ */}
            <UIAvatar
                position={[-0.55, 0.29, 0.004]}
                radius={0.115}
                bgColor={0xFFFFFF}
                innerColor={0xFF2A3B}
                ringOpacity={0.15}
            />

            <HudText
                position={[-0.32, 0.35, 0.004]}
                fontSize={0.135}
                color="#FFFFFF"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.06}
                fontWeight={800}
            >
                AIGLE
            </HudText>

            <Icon
                name="map-pin"
                position={[-0.32, 0.21, 0.004]}
                size={0.07}
                color="rgba(255,255,255,0.55)"
                opacity={o}
            />
            <HudText
                position={[-0.24, 0.21, 0.004]}
                fontSize={0.06}
                color="rgba(255,255,255,0.55)"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.04}
                fontWeight={500}
            >
                Lomé
            </HudText>

            {/* Eyebrow */}
            <HudText
                position={[-0.63, 0.08, 0.004]}
                fontSize={0.048}
                color="#FFB800"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.24}
                fontWeight={700}
            >
                ESPACE CLUB
            </HudText>

            {/* Description */}
            <HudText
                position={[-0.63, -0.03, 0.004]}
                fontSize={0.056}
                color="rgba(255,255,255,0.7)"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={500}
            >
                Club officiel · Terrain d'agoé centre
            </HudText>

            {/* ═══ BLOC PROCHAIN MATCH ══════════════════════════════════ */}
            <mesh position={[0, -0.24, 0.003]}>
                <planeGeometry args={[1.32, 0.17]} />
                <meshBasicMaterial
                    color={0x000000}
                    transparent
                    opacity={0.35 * o}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>

            <Icon
                name="calendar"
                position={[-0.58, -0.21, 0.005]}
                size={0.075}
                color="#FFB800"
                opacity={o}
            />
            <HudText
                position={[-0.5, -0.21, 0.005]}
                fontSize={0.07}
                color="#FFFFFF"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.04}
                fontWeight={700}
            >
                Prochain match
            </HudText>

            <HudText
                position={[0.55, -0.21, 0.005]}
                fontSize={0.055}
                color="#FFB800"
                opacity={o}
                anchorX="right"
                anchorY="middle"
                letterSpacing={0.04}
                fontWeight={600}
            >
                Calendrier
            </HudText>
            <Icon
                name="arrow-right"
                position={[0.62, -0.21, 0.005]}
                size={0.055}
                color="#FFB800"
                opacity={o}
            />

            <HudText
                position={[0, -0.31, 0.005]}
                fontSize={0.048}
                color="rgba(255,255,255,0.45)"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.06}
                fontWeight={500}
            >
                Aucun match à venir
            </HudText>
        </GlassCard>
    );
};