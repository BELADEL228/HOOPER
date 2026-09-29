import { GlassCard } from '../GlassCard';
import { HudText } from '../HudText';
import { UIAvatar, UIBorder, UIBlock } from './ui';

interface ClubCardProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    opacity?: number;
}

/* Reconstruit l'écran "ESPACE CLUB — AIGLE · Lomé" */

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
            borderColor="#FFB800"
        >
            {/* ─── Header : logo AIGLE + nom + localisation ─────────────── */}
            <UIAvatar
                position={[-0.55, 0.3, 0.004]}
                radius={0.12}
                bgColor={0xFFFFFF}
                innerColor={0xFF2A3B}
                ringOpacity={0.15}
            />
            {/* Cercle intérieur du logo (rappel du logo AIGLE) */}
            <mesh position={[-0.55, 0.3, 0.005]}>
                <ringGeometry args={[0.07, 0.09, 32]} />
                <meshBasicMaterial color={0xFF2A3B} depthWrite={false} transparent opacity={0.9 * o} />
            </mesh>

            <HudText
                position={[-0.34, 0.35, 0.004]}
                fontSize={0.14}
                color="#FFFFFF"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.05}
                fontWeight={800}
            >
                AIGLE
            </HudText>

            {/* Pin + Lomé */}
            <HudText
                position={[-0.34, 0.2, 0.004]}
                fontSize={0.07}
                color="#A0A0A0"
                opacity={0.9 * o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={500}
            >
                ⌖  Lomé
            </HudText>

            {/* Badge "ESPACE CLUB" */}
            <HudText
                position={[-0.66, 0.08, 0.004]}
                fontSize={0.055}
                color="#FFB800"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.22}
                fontWeight={700}
            >
                ESPACE CLUB
            </HudText>

            {/* ─── Deux boutons : Gérer l'effectif / Voir les matchs ───── */}
            {/* Bouton blanc plein */}
            <mesh position={[-0.36, -0.08, 0.004]}>
                <planeGeometry args={[0.6, 0.11]} />
                <meshBasicMaterial color={0xFFFFFF} depthWrite={false} transparent opacity={0.95 * o} />
            </mesh>
            <HudText
                position={[-0.36, -0.08, 0.006]}
                fontSize={0.058}
                color="#0a0a0e"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={700}
            >
                Gérer l'effectif
            </HudText>

            {/* Bouton bordure */}
            <mesh position={[0.3, -0.08, 0.004]}>
                <planeGeometry args={[0.6, 0.11]} />
                <meshBasicMaterial color={0x000000} depthWrite={false} transparent opacity={0.35 * o} />
            </mesh>
            <UIBorder position={[0.3, -0.08, 0.005]} width={0.6} height={0.11} opacity={0.35 * o} />
            <HudText
                position={[0.3, -0.08, 0.006]}
                fontSize={0.058}
                color="#FFFFFF"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={700}
            >
                Voir les matchs
            </HudText>

            {/* ─── Bloc "Prochain match" ────────────────────────────────── */}
            <mesh position={[0, -0.31, 0.004]}>
                <planeGeometry args={[1.32, 0.22]} />
                <meshBasicMaterial color={0x0e0e12} depthWrite={false} transparent opacity={0.9 * o} />
            </mesh>
            <UIBorder position={[0, -0.31, 0.005]} width={1.32} height={0.22} opacity={0.1 * o} />

            {/* Icône calendrier */}
            <HudText
                position={[-0.6, -0.24, 0.006]}
                fontSize={0.09}
                color="#FFFFFF"
                opacity={0.9 * o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0}
                fontWeight={500}
            >
                ▤
            </HudText>
            <HudText
                position={[-0.5, -0.24, 0.006]}
                fontSize={0.075}
                color="#FFFFFF"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={700}
            >
                Prochain match
            </HudText>

            <HudText
                position={[0.62, -0.24, 0.006]}
                fontSize={0.06}
                color="#A0A0A0"
                opacity={0.9 * o}
                anchorX="right"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={500}
            >
                Calendrier  →
            </HudText>

            {/* Sous-bloc dashed "Aucun match..." */}
            <mesh position={[0, -0.38, 0.005]}>
                <planeGeometry args={[1.22, 0.08]} />
                <meshBasicMaterial color={0x000000} depthWrite={false} transparent opacity={0.4 * o} />
            </mesh>
            <UIBorder position={[0, -0.38, 0.006]} width={1.22} height={0.08} opacity={0.15 * o} />
            <HudText
                position={[0, -0.38, 0.008]}
                fontSize={0.055}
                color="#7a7e86"
                opacity={0.9 * o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={500}
            >
                Aucun match à venir n'est publié.
            </HudText>

            <UIBlock position={[0, 100, 0]} width={0.01} height={0.01} color={0x000000} opacity={0} />
        </GlassCard>
    );
};