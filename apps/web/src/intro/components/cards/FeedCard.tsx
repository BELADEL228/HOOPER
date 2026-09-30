import { GlassCard } from '../GlassCard';
import { HudText } from '../HudText';
import { Icon } from '../icons';
import { UIAvatar } from './ui';

interface FeedCardProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    opacity?: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  FEED CARD — Post du feed (AIGLE · Club officiel)
 * ═══════════════════════════════════════════════════════════════════════════ */

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
            accentColor="#FF2A3B"
        >
            {/* ═══ HEADER ═══════════════════════════════════════════════ */}
            <UIAvatar
                position={[-0.6, 0.32, 0.004]}
                radius={0.085}
                bgColor={0xFFFFFF}
                innerColor={0xFF2A3B}
                ringOpacity={0.12}
            />

            <HudText
                position={[-0.48, 0.36, 0.004]}
                fontSize={0.082}
                color="#FFFFFF"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.05}
                fontWeight={800}
            >
                AIGLE
            </HudText>

            {/* Badge CLUB OFFICIEL */}
            <mesh position={[-0.14, 0.36, 0.004]}>
                <planeGeometry args={[0.32, 0.075]} />
                <meshBasicMaterial
                    color={0xFF2A3B}
                    transparent
                    opacity={0.14 * o}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>
            <HudText
                position={[-0.14, 0.36, 0.006]}
                fontSize={0.042}
                color="#FF2A3B"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.14}
                fontWeight={700}
            >
                CLUB OFFICIEL
            </HudText>

            {/* Méta sous le nom */}
            <HudText
                position={[-0.48, 0.25, 0.004]}
                fontSize={0.05}
                color="rgba(255,255,255,0.5)"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.04}
                fontWeight={500}
            >
                Belei Abel · 23 sept. · 20:57
            </HudText>

            <Icon
                name="dots-v"
                position={[0.6, 0.34, 0.004]}
                size={0.08}
                color="rgba(255,255,255,0.55)"
                opacity={o}
            />

            {/* ═══ DIVIDER ══════════════════════════════════════════════ */}
            <mesh position={[0, 0.17, 0.004]}>
                <planeGeometry args={[1.3, 0.0012]} />
                <meshBasicMaterial
                    color={0xffffff}
                    transparent
                    opacity={0.08 * o}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>

            {/* ═══ BODY ═════════════════════════════════════════════════ */}
            <HudText
                position={[-0.6, 0.03, 0.004]}
                fontSize={0.13}
                color="#FFFFFF"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={600}
            >
                HI
            </HudText>

            {/* ═══ DIVIDER ══════════════════════════════════════════════ */}
            <mesh position={[0, -0.13, 0.004]}>
                <planeGeometry args={[1.3, 0.0012]} />
                <meshBasicMaterial
                    color={0xffffff}
                    transparent
                    opacity={0.08 * o}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>

            {/* ═══ ACTIONS ══════════════════════════════════════════════ */}
            {/* Like */}
            <Icon
                name="heart"
                position={[-0.6, -0.3, 0.004]}
                size={0.07}
                color="#FFFFFF"
                opacity={o * 0.85}
            />
            <HudText
                position={[-0.52, -0.3, 0.004]}
                fontSize={0.06}
                color="rgba(255,255,255,0.6)"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={600}
            >
                0
            </HudText>

            {/* Comment */}
            <Icon
                name="comment"
                position={[-0.36, -0.3, 0.004]}
                size={0.07}
                color="#FFFFFF"
                opacity={o * 0.85}
            />
            <HudText
                position={[-0.28, -0.3, 0.004]}
                fontSize={0.06}
                color="rgba(255,255,255,0.6)"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={600}
            >
                0
            </HudText>

            {/* Share */}
            <Icon
                name="share"
                position={[-0.12, -0.3, 0.004]}
                size={0.07}
                color="#FFFFFF"
                opacity={o * 0.85}
            />

            {/* Bookmark */}
            <Icon
                name="bookmark"
                position={[0.6, -0.3, 0.004]}
                size={0.07}
                color="#FFFFFF"
                opacity={o * 0.85}
            />
        </GlassCard>
    );
};