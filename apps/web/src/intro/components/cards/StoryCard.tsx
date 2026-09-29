import { GlassCard } from '../GlassCard';
import { HudText } from '../HudText';
import { UIAvatar, UIBorder } from './ui';

interface StoryCardProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    opacity?: number;
}

/* Reconstruit le bloc "Ma story + Quoi de neuf sur le parquet ?" */

export const StoryCard = ({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    opacity = 1,
}: StoryCardProps) => {
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
            {/* ─── Bloc "Ma story" ──────────────────────────────────────── */}
            {/* Icône refresh en haut à droite */}
            <HudText
                position={[0.62, 0.4, 0.004]}
                fontSize={0.09}
                color="#A0A0A0"
                opacity={0.75 * o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0}
                fontWeight={500}
            >
                ⟳
            </HudText>

            {/* Cercle pointillé rouge */}
            <mesh position={[-0.5, 0.22, 0.004]}>
                <ringGeometry args={[0.115, 0.13, 48]} />
                <meshBasicMaterial color={0xFF2A3B} depthWrite={false} transparent opacity={0.85 * o} />
            </mesh>

            {/* Avatar VI au centre */}
            <UIAvatar
                position={[-0.5, 0.22, 0.005]}
                radius={0.1}
                bgColor={0xFF2A3B}
                innerColor={0x8a1520}
                ringOpacity={0}
            />
            <HudText
                position={[-0.5, 0.22, 0.006]}
                fontSize={0.11}
                color="#FFFFFF"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={800}
            >
                VI
            </HudText>

            {/* Petit + rouge */}
            <mesh position={[-0.4, 0.12, 0.007]}>
                <circleGeometry args={[0.035, 20]} />
                <meshBasicMaterial color={0xFF2A3B} depthWrite={false} />
            </mesh>
            <HudText
                position={[-0.4, 0.12, 0.009]}
                fontSize={0.055}
                color="#FFFFFF"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0}
                fontWeight={800}
            >
                +
            </HudText>

            {/* Label "Ma story" */}
            <HudText
                position={[-0.5, 0.04, 0.004]}
                fontSize={0.062}
                color="#FFFFFF"
                opacity={0.9 * o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={500}
            >
                Ma story
            </HudText>

            {/* ─── Séparateur ───────────────────────────────────────────── */}
            <mesh position={[0, -0.05, 0.003]}>
                <planeGeometry args={[1.32, 0.003]} />
                <meshBasicMaterial color={0xffffff} transparent opacity={0.06 * o} depthWrite={false} />
            </mesh>

            {/* ─── Bloc composer "Quoi de neuf ?" ───────────────────────── */}
            <UIAvatar
                position={[-0.6, -0.17, 0.005]}
                radius={0.07}
                bgColor={0xFF2A3B}
                innerColor={0x8a1520}
                ringOpacity={0}
            />
            <HudText
                position={[-0.6, -0.17, 0.006]}
                fontSize={0.075}
                color="#FFFFFF"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={800}
            >
                VI
            </HudText>

            <HudText
                position={[-0.46, -0.13, 0.004]}
                fontSize={0.062}
                color="#D0D0D0"
                opacity={0.85 * o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.01}
                fontWeight={500}
            >
                Quoi de neuf sur le parquet ?
            </HudText>

            <HudText
                position={[-0.46, -0.22, 0.004]}
                fontSize={0.062}
                color="#A0A0A0"
                opacity={0.75 * o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.01}
                fontWeight={500}
            >
                Partagez vos scores, dunks…
            </HudText>

            {/* Séparateur medium */}
            <mesh position={[0, -0.28, 0.003]}>
                <planeGeometry args={[1.32, 0.003]} />
                <meshBasicMaterial color={0xffffff} transparent opacity={0.06 * o} depthWrite={false} />
            </mesh>

            {/* ─── Rangée d'icônes media + bouton Publier ───────────────── */}
            {/* Image */}
            <mesh position={[-0.6, -0.38, 0.004]}>
                <planeGeometry args={[0.075, 0.075]} />
                <meshBasicMaterial color={0x10b981} depthWrite={false} transparent opacity={0.9 * o} />
            </mesh>
            <mesh position={[-0.6, -0.38, 0.005]}>
                <planeGeometry args={[0.045, 0.045]} />
                <meshBasicMaterial color={0x0a0a0e} depthWrite={false} />
            </mesh>

            {/* Vidéo */}
            <mesh position={[-0.4, -0.38, 0.004]}>
                <planeGeometry args={[0.075, 0.075]} />
                <meshBasicMaterial color={0xFFB800} depthWrite={false} transparent opacity={0.9 * o} />
            </mesh>
            <mesh position={[-0.4, -0.38, 0.005]}>
                <circleGeometry args={[0.022, 20]} />
                <meshBasicMaterial color={0x0a0a0e} depthWrite={false} />
            </mesh>

            {/* Upload */}
            <HudText
                position={[-0.2, -0.38, 0.004]}
                fontSize={0.1}
                color="#FFFFFF"
                opacity={0.75 * o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0}
                fontWeight={500}
            >
                ⇧
            </HudText>

            {/* Globe */}
            <HudText
                position={[0.0, -0.38, 0.004]}
                fontSize={0.11}
                color="#3b82f6"
                opacity={0.9 * o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0}
                fontWeight={500}
            >
                ⊕
            </HudText>

            {/* Bouton Publier */}
            <mesh position={[0.42, -0.38, 0.004]}>
                <planeGeometry args={[0.4, 0.11]} />
                <meshBasicMaterial color={0xFF2A3B} depthWrite={false} transparent opacity={0.95 * o} />
            </mesh>
            <HudText
                position={[0.38, -0.38, 0.006]}
                fontSize={0.06}
                color="#FFFFFF"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.1}
                fontWeight={700}
            >
                Publier
            </HudText>
            <HudText
                position={[0.58, -0.38, 0.006]}
                fontSize={0.085}
                color="#FFFFFF"
                opacity={0.9 * o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0}
                fontWeight={500}
            >
                ➤
            </HudText>
        </GlassCard>
    );
};