import { GlassCard } from '../GlassCard';
import { HudText } from '../HudText';
import { Icon } from '../icons';
import { UIAvatar } from './ui';

interface MessageCardProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    opacity?: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  MESSAGE CARD — Discussions (Belei · salut)
 * ═══════════════════════════════════════════════════════════════════════════ */

export const MessageCard = ({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    opacity = 1,
}: MessageCardProps) => {
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
            <Icon
                name="message"
                position={[-0.6, 0.35, 0.004]}
                size={0.085}
                color="#FF2A3B"
                opacity={o}
            />

            <HudText
                position={[-0.48, 0.35, 0.004]}
                fontSize={0.085}
                color="#FFFFFF"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.1}
                fontWeight={800}
            >
                DISCUSSIONS
            </HudText>

            {/* Badge EN DIRECT */}
            <mesh position={[-0.12, 0.35, 0.004]}>
                <planeGeometry args={[0.34, 0.075]} />
                <meshBasicMaterial
                    color={0x22c55e}
                    transparent
                    opacity={0.14 * o}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>
            <mesh position={[-0.24, 0.35, 0.005]}>
                <circleGeometry args={[0.018, 16]} />
                <meshBasicMaterial
                    color={0x22c55e}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>
            <HudText
                position={[-0.1, 0.35, 0.006]}
                fontSize={0.042}
                color="#22c55e"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.12}
                fontWeight={700}
            >
                EN DIRECT
            </HudText>

            {/* Bouton + rouge carré */}
            <mesh position={[0.6, 0.35, 0.004]}>
                <planeGeometry args={[0.09, 0.09]} />
                <meshBasicMaterial
                    color={0xFF2A3B}
                    transparent
                    opacity={0.95 * o}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>
            <Icon
                name="plus"
                position={[0.6, 0.35, 0.005]}
                size={0.06}
                color="#FFFFFF"
                opacity={o}
            />

            {/* ═══ BARRE DE RECHERCHE ═══════════════════════════════════ */}
            <mesh position={[0, 0.19, 0.003]}>
                <planeGeometry args={[1.32, 0.11]} />
                <meshBasicMaterial color={0x0e0e12} depthWrite={false} toneMapped={false} />
            </mesh>
            <Icon
                name="search"
                position={[-0.55, 0.19, 0.005]}
                size={0.06}
                color="rgba(255,255,255,0.45)"
                opacity={o}
            />
            <HudText
                position={[-0.47, 0.19, 0.005]}
                fontSize={0.052}
                color="rgba(255,255,255,0.4)"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={500}
            >
                Rechercher…
            </HudText>

            {/* ═══ LISTE CONVERSATION ═══════════════════════════════════ */}
            <mesh position={[0, -0.03, 0.003]}>
                <planeGeometry args={[1.32, 0.2]} />
                <meshBasicMaterial
                    color={0x1a1a20}
                    transparent
                    opacity={0.65 * o}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>

            <UIAvatar
                position={[-0.55, -0.03, 0.005]}
                radius={0.088}
                bgColor={0x2a2a30}
                innerColor={0x8a5a3a}
                ringOpacity={0.1}
            />

            <HudText
                position={[-0.4, 0.035, 0.006]}
                fontSize={0.075}
                color="#FFFFFF"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.03}
                fontWeight={700}
            >
                Belei
            </HudText>
            <HudText
                position={[-0.4, -0.08, 0.006]}
                fontSize={0.062}
                color="rgba(255,255,255,0.55)"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={500}
            >
                salut
            </HudText>

            <HudText
                position={[0.6, 0.035, 0.006]}
                fontSize={0.055}
                color="rgba(255,255,255,0.45)"
                opacity={o}
                anchorX="right"
                anchorY="middle"
                letterSpacing={0.04}
                fontWeight={500}
            >
                09:12
            </HudText>

            {/* Badge non-lu */}
            <mesh position={[0.6, -0.08, 0.006]}>
                <circleGeometry args={[0.042, 20]} />
                <meshBasicMaterial
                    color={0xFF2A3B}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>
            <HudText
                position={[0.6, -0.08, 0.008]}
                fontSize={0.055}
                color="#FFFFFF"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0}
                fontWeight={800}
            >
                1
            </HudText>
        </GlassCard>
    );
};