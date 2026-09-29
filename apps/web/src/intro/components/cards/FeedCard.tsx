import { GlassCard } from '../GlassCard';
import { HudText } from '../HudText';
import { UIAvatar, UIBlock, UIBorder } from './ui';

interface FeedCardProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    opacity?: number;
}

/* Reconstruit le post "AIGLE · Club officiel" visible sur le feed */

export const FeedCard = ({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    opacity = 1,
}: FeedCardProps) => {
    const o = opacity;

    return (
        <GlassCard
            position={position}
            rotation={rotation}
            scale={scale}
            opacity={opacity}
            width={1.5}
            height={0.95}
            borderColor="#FF2A3B"
        >
            {/* ─── Header : avatar + AIGLE + badge + ⋯ ──────────────────── */}
            <UIAvatar
                position={[-0.62, 0.32, 0.004]}
                radius={0.085}
                bgColor={0xFFFFFF}
                innerColor={0xFF2A3B}
                ringOpacity={0.1}
            />

            <HudText
                position={[-0.5, 0.35, 0.004]}
                fontSize={0.085}
                color="#FFFFFF"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.03}
                fontWeight={800}
            >
                AIGLE
            </HudText>

            {/* Badge CLUB OFFICIEL */}
            <mesh position={[-0.13, 0.35, 0.004]}>
                <planeGeometry args={[0.36, 0.085]} />
                <meshBasicMaterial color={0xFF2A3B} depthWrite={false} transparent opacity={0.12 * o} />
            </mesh>
            <UIBorder position={[-0.13, 0.35, 0.005]} width={0.36} height={0.085} color={0xFF2A3B} opacity={0.5 * o} />
            <HudText
                position={[-0.13, 0.35, 0.006]}
                fontSize={0.045}
                color="#FF2A3B"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.12}
                fontWeight={700}
            >
                CLUB OFFICIEL
            </HudText>

            <HudText
                position={[-0.5, 0.22, 0.004]}
                fontSize={0.052}
                color="#A0A0A0"
                opacity={0.85 * o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={500}
            >
                Par Belei Abel · 23 sept., 20:57
            </HudText>

            {/* Menu ⋯ à droite */}
            <HudText
                position={[0.62, 0.34, 0.004]}
                fontSize={0.14}
                color="#A0A0A0"
                opacity={0.7 * o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0}
                fontWeight={700}
            >
                ⋯
            </HudText>

            {/* Séparateur sous le header */}
            <mesh position={[0, 0.14, 0.003]}>
                <planeGeometry args={[1.32, 0.003]} />
                <meshBasicMaterial color={0xffffff} transparent opacity={0.07 * o} depthWrite={false} />
            </mesh>

            {/* ─── Corps du post : "HI" ─────────────────────────────────── */}
            <HudText
                position={[-0.62, -0.04, 0.004]}
                fontSize={0.15}
                color="#FFFFFF"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={600}
            >
                HI
            </HudText>

            {/* Séparateur au-dessus des actions */}
            <mesh position={[0, -0.22, 0.003]}>
                <planeGeometry args={[1.32, 0.003]} />
                <meshBasicMaterial color={0xffffff} transparent opacity={0.07 * o} depthWrite={false} />
            </mesh>

            {/* ─── Actions : ♡ 0 · ◯ 0 · ↗ · 🔖 ─────────────────────────── */}
            {/* Coeur */}
            <HudText
                position={[-0.62, -0.36, 0.004]}
                fontSize={0.11}
                color="#FFFFFF"
                opacity={0.9 * o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0}
                fontWeight={500}
            >
                ♡
            </HudText>
            <HudText
                position={[-0.52, -0.36, 0.004]}
                fontSize={0.062}
                color="#A0A0A0"
                opacity={0.85 * o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0}
                fontWeight={600}
            >
                0
            </HudText>

            {/* Commentaire */}
            <HudText
                position={[-0.36, -0.36, 0.004]}
                fontSize={0.11}
                color="#FFFFFF"
                opacity={0.9 * o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0}
                fontWeight={500}
            >
                ◯
            </HudText>
            <HudText
                position={[-0.25, -0.36, 0.004]}
                fontSize={0.062}
                color="#A0A0A0"
                opacity={0.85 * o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0}
                fontWeight={600}
            >
                0
            </HudText>

            {/* Partage */}
            <HudText
                position={[-0.08, -0.36, 0.004]}
                fontSize={0.11}
                color="#FFFFFF"
                opacity={0.9 * o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0}
                fontWeight={500}
            >
                ↗
            </HudText>

            {/* Bookmark à droite */}
            <HudText
                position={[0.62, -0.36, 0.004]}
                fontSize={0.11}
                color="#FFFFFF"
                opacity={0.9 * o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0}
                fontWeight={500}
            >
                ⬦
            </HudText>

            {/* (petit espace vide pour utiliser UIBlock — non rendu, garde le fichier cohérent) */}
            <UIBlock position={[0, 100, 0]} width={0.01} height={0.01} color={0x000000} opacity={0} />
        </GlassCard>
    );
};