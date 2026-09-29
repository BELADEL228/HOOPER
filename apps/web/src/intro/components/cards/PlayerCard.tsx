import { GlassCard } from '../GlassCard';
import { HudText } from '../HudText';
import { UIAvatar, UIBorder, UIDot } from './ui';

interface PlayerCardProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    opacity?: number;
}

/* Reconstruit l'écran "Compte / Paramètres" de HOOPERS */

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
            borderColor="#FFB800"
        >
            {/* ─── Top bar : ← Compte ───────────────────────────────────── */}
            <HudText
                position={[-0.66, 0.36, 0.004]}
                fontSize={0.062}
                color="#A0A0A0"
                opacity={0.9 * o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0}
                fontWeight={500}
            >
                ‹
            </HudText>
            <HudText
                position={[-0.58, 0.36, 0.004]}
                fontSize={0.08}
                color="#FFFFFF"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={700}
            >
                Compte
            </HudText>

            {/* Séparateur haut */}
            <mesh position={[0, 0.29, 0.003]}>
                <planeGeometry args={[1.36, 0.004]} />
                <meshBasicMaterial color={0xffffff} transparent opacity={0.08 * o} depthWrite={false} />
            </mesh>

            {/* ─── Avatar + nom + email ─────────────────────────────────── */}
            <UIAvatar
                position={[-0.5, 0.16, 0.004]}
                radius={0.11}
                bgColor={0xFF2A3B}
                innerColor={0x8a1520}
            />

            <HudText
                position={[-0.32, 0.2, 0.004]}
                fontSize={0.1}
                color="#FFFFFF"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={700}
            >
                Belei Abel
            </HudText>

            <HudText
                position={[-0.32, 0.08, 0.004]}
                fontSize={0.055}
                color="#A0A0A0"
                opacity={0.9 * o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={500}
            >
                jerome · beleiablel3@gmail.com
            </HudText>

            {/* ─── Barre de stats PPG / RPG / APG ───────────────────────── */}
            <mesh position={[0, -0.05, 0.003]}>
                <planeGeometry args={[1.32, 0.004]} />
                <meshBasicMaterial color={0xffffff} transparent opacity={0.08 * o} depthWrite={false} />
            </mesh>

            {/* Colonne 1 — PPG */}
            <HudText
                position={[-0.5, -0.16, 0.004]}
                fontSize={0.11}
                color="#FFB800"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={700}
            >
                24.6
            </HudText>
            <HudText
                position={[-0.5, -0.26, 0.004]}
                fontSize={0.05}
                color="#A0A0A0"
                opacity={0.85 * o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.18}
                fontWeight={500}
            >
                PPG
            </HudText>

            {/* Séparateur vertical */}
            <mesh position={[-0.13, -0.2, 0.003]}>
                <planeGeometry args={[0.004, 0.22]} />
                <meshBasicMaterial color={0xffffff} transparent opacity={0.08 * o} depthWrite={false} />
            </mesh>

            {/* Colonne 2 — RPG */}
            <HudText
                position={[0.02, -0.16, 0.004]}
                fontSize={0.11}
                color="#FFFFFF"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={700}
            >
                4.8
            </HudText>
            <HudText
                position={[0.02, -0.26, 0.004]}
                fontSize={0.05}
                color="#A0A0A0"
                opacity={0.85 * o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.18}
                fontWeight={500}
            >
                RPG
            </HudText>

            {/* Séparateur vertical */}
            <mesh position={[0.29, -0.2, 0.003]}>
                <planeGeometry args={[0.004, 0.22]} />
                <meshBasicMaterial color={0xffffff} transparent opacity={0.08 * o} depthWrite={false} />
            </mesh>

            {/* Colonne 3 — APG */}
            <HudText
                position={[0.42, -0.16, 0.004]}
                fontSize={0.11}
                color="#FFFFFF"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={700}
            >
                6.2
            </HudText>
            <HudText
                position={[0.42, -0.26, 0.004]}
                fontSize={0.05}
                color="#A0A0A0"
                opacity={0.85 * o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.18}
                fontWeight={500}
            >
                APG
            </HudText>

            {/* ─── Bouton rouge "Voir profil →" ──────────────────────────── */}
            <mesh position={[0, -0.38, 0.004]}>
                <planeGeometry args={[1.34, 0.1]} />
                <meshBasicMaterial color={0xFF2A3B} depthWrite={false} transparent opacity={0.95 * o} />
            </mesh>
            <HudText
                position={[-0.05, -0.38, 0.006]}
                fontSize={0.06}
                color="#FFFFFF"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.1}
                fontWeight={700}
            >
                VOIR PROFIL
            </HudText>
            <HudText
                position={[0.5, -0.38, 0.006]}
                fontSize={0.07}
                color="#FFFFFF"
                opacity={0.9 * o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0}
                fontWeight={500}
            >
                →
            </HudText>
        </GlassCard>
    );
};