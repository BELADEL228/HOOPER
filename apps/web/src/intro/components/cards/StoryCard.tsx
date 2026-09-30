import { GlassCard } from '../GlassCard';
import { HudText } from '../HudText';
import { Icon } from '../icons';
import { UIAvatar } from './ui';

interface StoryCardProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    opacity?: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  STORY CARD — Ma story + composer
 * ═══════════════════════════════════════════════════════════════════════════ */

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
            accentColor="#FF2A3B"
        >
            {/* ═══ MA STORY ═════════════════════════════════════════════ */}
            <Icon
                name="plus"
                position={[0.6, 0.4, 0.004]}
                size={0.075}
                color="rgba(255,255,255,0.5)"
                opacity={o}
            />

            {/* Cercle extérieur rouge */}
            <mesh position={[-0.5, 0.24, 0.004]}>
                <ringGeometry args={[0.115, 0.128, 48]} />
                <meshBasicMaterial
                    color={0xFF2A3B}
                    transparent
                    opacity={0.85 * o}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>

            <UIAvatar
                position={[-0.5, 0.24, 0.005]}
                radius={0.1}
                bgColor={0xFF2A3B}
                innerColor={0x8a1520}
                ringOpacity={0}
            />

            <HudText
                position={[-0.5, 0.24, 0.006]}
                fontSize={0.105}
                color="#FFFFFF"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.04}
                fontWeight={800}
            >
                VI
            </HudText>

            {/* Bouton + rouge */}
            <mesh position={[-0.42, 0.14, 0.007]}>
                <circleGeometry args={[0.032, 20]} />
                <meshBasicMaterial
                    color={0xFF2A3B}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>
            <Icon
                name="plus"
                position={[-0.42, 0.14, 0.009]}
                size={0.038}
                color="#FFFFFF"
                opacity={o}
            />

            <HudText
                position={[-0.5, 0.06, 0.004]}
                fontSize={0.062}
                color="#FFFFFF"
                opacity={o * 0.9}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.04}
                fontWeight={600}
            >
                Ma story
            </HudText>

            {/* ═══ DIVIDER ══════════════════════════════════════════════ */}
            <mesh position={[0, -0.03, 0.004]}>
                <planeGeometry args={[1.3, 0.0012]} />
                <meshBasicMaterial
                    color={0xffffff}
                    transparent
                    opacity={0.08 * o}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>

            {/* ═══ COMPOSER ═════════════════════════════════════════════ */}
            <UIAvatar
                position={[-0.6, -0.15, 0.005]}
                radius={0.068}
                bgColor={0xFF2A3B}
                innerColor={0x8a1520}
                ringOpacity={0}
            />
            <HudText
                position={[-0.6, -0.15, 0.006]}
                fontSize={0.07}
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
                position={[-0.47, -0.11, 0.004]}
                fontSize={0.06}
                color="rgba(255,255,255,0.75)"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={500}
            >
                Quoi de neuf sur le parquet ?
            </HudText>

            <HudText
                position={[-0.47, -0.21, 0.004]}
                fontSize={0.052}
                color="rgba(255,255,255,0.4)"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={400}
            >
                Partagez vos scores, dunks…
            </HudText>

            {/* ═══ DIVIDER ══════════════════════════════════════════════ */}
            <mesh position={[0, -0.28, 0.004]}>
                <planeGeometry args={[1.3, 0.0012]} />
                <meshBasicMaterial
                    color={0xffffff}
                    transparent
                    opacity={0.08 * o}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>

            {/* ═══ ACTIONS MÉDIA + PUBLIER ══════════════════════════════ */}
            <Icon
                name="image"
                position={[-0.6, -0.38, 0.004]}
                size={0.075}
                color="#10b981"
                opacity={o * 0.9}
            />
            <Icon
                name="video"
                position={[-0.4, -0.38, 0.004]}
                size={0.075}
                color="#FFB800"
                opacity={o * 0.9}
            />
            <Icon
                name="upload"
                position={[-0.2, -0.38, 0.004]}
                size={0.075}
                color="rgba(255,255,255,0.6)"
                opacity={o}
            />
            <Icon
                name="globe"
                position={[0.0, -0.38, 0.004]}
                size={0.075}
                color="#3b82f6"
                opacity={o * 0.9}
            />

            {/* Bouton Publier */}
            <mesh position={[0.42, -0.38, 0.004]}>
                <planeGeometry args={[0.4, 0.1]} />
                <meshBasicMaterial
                    color={0xFF2A3B}
                    transparent
                    opacity={0.95 * o}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>
            <HudText
                position={[0.36, -0.38, 0.006]}
                fontSize={0.055}
                color="#FFFFFF"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.12}
                fontWeight={700}
            >
                Publier
            </HudText>
            <Icon
                name="send"
                position={[0.57, -0.38, 0.006]}
                size={0.06}
                color="#FFFFFF"
                opacity={o}
            />
        </GlassCard>
    );
};