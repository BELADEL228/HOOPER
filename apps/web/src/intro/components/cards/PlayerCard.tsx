import { GlassCard } from '../GlassCard';
import { HudText } from '../HudText';
import { Icon } from '../icons';
import { UIAvatar } from './ui';

interface PlayerCardProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    opacity?: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  PLAYER CARD — Profil joueur (analytics premium)
 *
 *  Structure :
 *   ┌─────────────────────────────────┐
 *   │ [avatar] MARC D.          ● 92  │  ← header
 *   │          Guard · 24 ans         │
 *   ├─────────────────────────────────┤
 *   │  PPG     RPG     APG            │  ← stats en 3 colonnes
 *   │  24.6    4.8     6.2            │
 *   ├─────────────────────────────────┤
 *   │  ▸ Voir le profil               │  ← CTA
 *   └─────────────────────────────────┘
 * ═══════════════════════════════════════════════════════════════════════════ */

export const PlayerCard = ({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    opacity = 1,
}: PlayerCardProps) => {
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
            {/* Avatar 2× plus grand, mieux positionné */}
            <UIAvatar
                position={[-0.6, 0.3, 0.004]}
                radius={0.105}
                bgColor={0xFF2A3B}
                innerColor={0x8a1520}
                ringOpacity={0.22}
            />

            {/* Nom — hiérarchie forte */}
            <HudText
                position={[-0.44, 0.35, 0.004]}
                fontSize={0.095}
                color="#FFFFFF"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.05}
                fontWeight={800}
            >
                MARC D.
            </HudText>

            {/* Rôle + âge — meta ligne */}
            <HudText
                position={[-0.44, 0.24, 0.004]}
                fontSize={0.052}
                color="rgba(255,255,255,0.55)"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.14}
                fontWeight={500}
            >
                GUARD · 24 ANS · #10
            </HudText>

            {/* Badge rating — pastille dorée en haut à droite */}
            <mesh position={[0.58, 0.31, 0.004]}>
                <circleGeometry args={[0.075, 32]} />
                <meshBasicMaterial color={0xFFB800} transparent opacity={0.15 * o} depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh position={[0.58, 0.31, 0.005]}>
                <ringGeometry args={[0.072, 0.075, 32]} />
                <meshBasicMaterial color={0xFFB800} transparent opacity={0.8 * o} depthWrite={false} toneMapped={false} />
            </mesh>
            <HudText
                position={[0.58, 0.315, 0.006]}
                fontSize={0.075}
                color="#FFB800"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={800}
            >
                92
            </HudText>

            {/* ═══ DIVIDER ══════════════════════════════════════════════ */}
            <mesh position={[0, 0.15, 0.004]}>
                <planeGeometry args={[1.3, 0.0012]} />
                <meshBasicMaterial color={0xffffff} transparent opacity={0.08 * o} depthWrite={false} toneMapped={false} />
            </mesh>

            {/* ═══ STATS — 3 colonnes ═══════════════════════════════════ */}
            {/* Colonne PPG */}
            <HudText
                position={[-0.55, 0.02, 0.004]}
                fontSize={0.05}
                color="rgba(255,255,255,0.42)"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.22}
                fontWeight={600}
            >
                PPG
            </HudText>
            <HudText
                position={[-0.55, -0.08, 0.004]}
                fontSize={0.135}
                color="#FFB800"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.01}
                fontWeight={800}
            >
                24.6
            </HudText>

            {/* Colonne RPG */}
            <HudText
                position={[-0.11, 0.02, 0.004]}
                fontSize={0.05}
                color="rgba(255,255,255,0.42)"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.22}
                fontWeight={600}
            >
                RPG
            </HudText>
            <HudText
                position={[-0.11, -0.08, 0.004]}
                fontSize={0.135}
                color="#FFFFFF"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.01}
                fontWeight={800}
            >
                4.8
            </HudText>

            {/* Colonne APG */}
            <HudText
                position={[0.33, 0.02, 0.004]}
                fontSize={0.05}
                color="rgba(255,255,255,0.42)"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.22}
                fontWeight={600}
            >
                APG
            </HudText>
            <HudText
                position={[0.33, -0.08, 0.004]}
                fontSize={0.135}
                color="#FFFFFF"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.01}
                fontWeight={800}
            >
                6.2
            </HudText>

            {/* ═══ CTA — bouton "Voir profil" ═════════════════════════ */}
            {/* Fond dégradé rouge */}
            <mesh position={[0, -0.32, 0.004]}>
                <planeGeometry args={[1.3, 0.13]} />
                <meshBasicMaterial color={0xFF2A3B} transparent opacity={0.95 * o} depthWrite={false} toneMapped={false} />
            </mesh>

            <HudText
                position={[-0.06, -0.32, 0.006]}
                fontSize={0.062}
                color="#FFFFFF"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.16}
                fontWeight={700}
            >
                VOIR LE PROFIL
            </HudText>
            <Icon
                name="arrow-right"
                position={[0.54, -0.32, 0.006]}
                size={0.075}
                color="#FFFFFF"
                opacity={o * 0.9}
            />
        </GlassCard>
    );
};