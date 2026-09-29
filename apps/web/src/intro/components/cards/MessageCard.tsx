import { GlassCard } from '../GlassCard';
import { HudText } from '../HudText';
import { UIAvatar, UIBorder, UIStatusDot, UISearchBar } from './ui';

interface MessageCardProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    opacity?: number;
}

/* Reconstruit l'écran "DISCUSSIONS — Belei · salut" */

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
            borderColor="#FFB800"
        >
            {/* ─── Header : icône + DISCUSSIONS + EN DIRECT + ➕ ───────── */}
            {/* Icône bulle */}
            <mesh position={[-0.66, 0.35, 0.004]}>
                <planeGeometry args={[0.11, 0.08]} />
                <meshBasicMaterial color={0xFF2A3B} depthWrite={false} transparent opacity={0.95 * o} />
            </mesh>
            <mesh position={[-0.71, 0.32, 0.005]}>
                <planeGeometry args={[0.04, 0.05]} />
                <meshBasicMaterial color={0x0a0a0e} depthWrite={false} />
            </mesh>

            <HudText
                position={[-0.56, 0.35, 0.004]}
                fontSize={0.09}
                color="#FFFFFF"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.08}
                fontWeight={800}
            >
                DISCUSSIONS
            </HudText>

            {/* Badge "EN DIRECT" vert */}
            <mesh position={[-0.12, 0.35, 0.004]}>
                <planeGeometry args={[0.42, 0.085]} />
                <meshBasicMaterial color={0x22c55e} depthWrite={false} transparent opacity={0.15 * o} />
            </mesh>
            <UIBorder position={[-0.12, 0.35, 0.005]} width={0.42} height={0.085} color={0x22c55e} opacity={0.5 * o} />
            <UIStatusDot position={[-0.28, 0.35, 0.006]} color={0x22c55e} radius={0.02} />
            <HudText
                position={[-0.08, 0.35, 0.006]}
                fontSize={0.05}
                color="#22c55e"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.14}
                fontWeight={700}
            >
                EN DIRECT
            </HudText>

            {/* Bouton + rouge carré */}
            <mesh position={[0.62, 0.35, 0.004]}>
                <planeGeometry args={[0.12, 0.12]} />
                <meshBasicMaterial color={0xFF2A3B} depthWrite={false} transparent opacity={0.95 * o} />
            </mesh>
            <HudText
                position={[0.62, 0.35, 0.006]}
                fontSize={0.1}
                color="#FFFFFF"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0}
                fontWeight={700}
            >
                +
            </HudText>

            {/* ─── Barre de recherche ───────────────────────────────────── */}
            <UISearchBar
                position={[0, 0.18, 0.004]}
                width={1.32}
                height={0.13}
                placeholder="Rechercher une discussion…"
            />

            {/* Séparateur */}
            <mesh position={[0, 0.08, 0.003]}>
                <planeGeometry args={[1.32, 0.003]} />
                <meshBasicMaterial color={0xffffff} transparent opacity={0.06 * o} depthWrite={false} />
            </mesh>

            {/* ─── Ligne de conversation "Belei · salut · 09:12" ────────── */}
            <mesh position={[0, -0.03, 0.003]}>
                <planeGeometry args={[1.32, 0.2]} />
                <meshBasicMaterial color={0x1a1a20} depthWrite={false} transparent opacity={0.7 * o} />
            </mesh>

            <UIAvatar
                position={[-0.55, -0.03, 0.005]}
                radius={0.09}
                bgColor={0x2a2a30}
                innerColor={0x8a5a3a}
                ringOpacity={0.1}
            />

            <HudText
                position={[-0.4, 0.03, 0.006]}
                fontSize={0.075}
                color="#FFFFFF"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={700}
            >
                Belei
            </HudText>

            <HudText
                position={[-0.4, -0.09, 0.006]}
                fontSize={0.062}
                color="#A0A0A0"
                opacity={0.9 * o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={500}
            >
                salut
            </HudText>

            {/* Timestamp à droite */}
            <HudText
                position={[0.62, 0.03, 0.006]}
                fontSize={0.06}
                color="#A0A0A0"
                opacity={0.85 * o}
                anchorX="right"
                anchorY="middle"
                letterSpacing={0.04}
                fontWeight={500}
            >
                09:12
            </HudText>

            {/* Petit badge non-lu */}
            <mesh position={[0.62, -0.09, 0.006]}>
                <circleGeometry args={[0.045, 20]} />
                <meshBasicMaterial color={0xFF2A3B} depthWrite={false} />
            </mesh>
            <HudText
                position={[0.62, -0.09, 0.008]}
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

            {/* Zones vides en bas pour suggérer l'écran */}
            <mesh position={[0, -0.28, 0.003]}>
                <planeGeometry args={[1.32, 0.003]} />
                <meshBasicMaterial color={0xffffff} transparent opacity={0.04 * o} depthWrite={false} />
            </mesh>
        </GlassCard>
    );
};