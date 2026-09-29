import { GlassCard } from '../GlassCard';
import { HudText } from '../HudText';
import { UIBorder } from './ui';

interface StatsCardProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    opacity?: number;
}

/* Reconstruit l'écran Shop : "Maillot Officiel Domicile FIRE STONE 2026" */

export const StatsCard = ({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    opacity = 1,
}: StatsCardProps) => {
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
            {/* ─── Zone image produit (simulée) ─────────────────────────── */}
            <mesh position={[0, 0.22, 0.004]}>
                <planeGeometry args={[1.36, 0.48]} />
                <meshBasicMaterial color={0x2a1a12} depthWrite={false} transparent opacity={0.95 * o} />
            </mesh>

            {/* Dégradé sombre côté droit pour textes */}
            <mesh position={[0.3, 0.22, 0.005]}>
                <planeGeometry args={[0.8, 0.48]} />
                <meshBasicMaterial color={0x0a0503} depthWrite={false} transparent opacity={0.55 * o} />
            </mesh>

            {/* Panier stylisé (2 cercles concentriques orange) */}
            <mesh position={[-0.4, 0.3, 0.006]}>
                <ringGeometry args={[0.09, 0.11, 32]} />
                <meshBasicMaterial color={0xFF6B14} depthWrite={false} transparent opacity={0.95 * o} />
            </mesh>
            <mesh position={[-0.4, 0.3, 0.006]}>
                <ringGeometry args={[0.05, 0.06, 32]} />
                <meshBasicMaterial color={0xFF6B14} depthWrite={false} transparent opacity={0.75 * o} />
            </mesh>

            {/* Filet stylisé (lignes fines partant du ring) */}
            {[-0.06, -0.03, 0, 0.03, 0.06].map((dx, i) => (
                <mesh key={i} position={[-0.4 + dx, 0.24, 0.006]} rotation={[0, 0, dx * 5]}>
                    <planeGeometry args={[0.004, 0.1]} />
                    <meshBasicMaterial color={0xF5F0E8} depthWrite={false} transparent opacity={0.65 * o} />
                </mesh>
            ))}

            {/* Ballon orange flou en bas à gauche */}
            <mesh position={[-0.5, 0.05, 0.006]}>
                <circleGeometry args={[0.09, 32]} />
                <meshBasicMaterial color={0xC54A18} depthWrite={false} transparent opacity={0.9 * o} />
            </mesh>
            {/* Couture noire */}
            <mesh position={[-0.5, 0.05, 0.007]}>
                <planeGeometry args={[0.18, 0.005]} />
                <meshBasicMaterial color={0x1a0a04} depthWrite={false} transparent opacity={0.9 * o} />
            </mesh>

            {/* Badge "BEST-SELLER" orange */}
            <mesh position={[-0.5, 0.4, 0.007]}>
                <planeGeometry args={[0.32, 0.09]} />
                <meshBasicMaterial color={0xFF6B14} depthWrite={false} />
            </mesh>
            <HudText
                position={[-0.5, 0.4, 0.009]}
                fontSize={0.048}
                color="#FFFFFF"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.1}
                fontWeight={800}
            >
                BEST-SELLER
            </HudText>

            {/* ─── Info produit ─────────────────────────────────────────── */}
            <HudText
                position={[-0.62, -0.06, 0.004]}
                fontSize={0.052}
                color="#FFB800"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.24}
                fontWeight={700}
            >
                JERSEYS
            </HudText>

            {/* Étoile + note */}
            <HudText
                position={[0.4, -0.06, 0.004]}
                fontSize={0.075}
                color="#FFB800"
                opacity={o}
                anchorX="right"
                anchorY="middle"
                letterSpacing={0}
                fontWeight={500}
            >
                ★ 4.9 (38)
            </HudText>

            {/* Titre produit */}
            <HudText
                position={[-0.62, -0.16, 0.004]}
                fontSize={0.075}
                color="#FFFFFF"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.01}
                fontWeight={700}
            >
                Maillot FIRE STONE 2026
            </HudText>

            {/* Séparateur */}
            <mesh position={[0, -0.24, 0.003]}>
                <planeGeometry args={[1.32, 0.003]} />
                <meshBasicMaterial color={0xffffff} transparent opacity={0.08 * o} depthWrite={false} />
            </mesh>

            {/* Prix */}
            <HudText
                position={[-0.62, -0.32, 0.004]}
                fontSize={0.055}
                color="#A0A0A0"
                opacity={0.9 * o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.04}
                fontWeight={500}
            >
                Prix Club
            </HudText>

            <HudText
                position={[0.62, -0.32, 0.004]}
                fontSize={0.085}
                color="#FFB800"
                opacity={o}
                anchorX="right"
                anchorY="middle"
                letterSpacing={0.06}
                fontWeight={800}
            >
                18 000 FCFA
            </HudText>

            {/* ─── Boutons Floquer / Ajouter ────────────────────────────── */}
            {/* Bouton Floquer (sombre avec bordure) */}
            <mesh position={[-0.36, -0.42, 0.004]}>
                <planeGeometry args={[0.6, 0.1]} />
                <meshBasicMaterial color={0x1c1c22} depthWrite={false} transparent opacity={0.9 * o} />
            </mesh>
            <HudText
                position={[-0.36, -0.42, 0.006]}
                fontSize={0.058}
                color="#7dd3fc"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.08}
                fontWeight={700}
            >
                ✦ Floquer
            </HudText>

            {/* Bouton Ajouter (rouge-orange) */}
            <mesh position={[0.36, -0.42, 0.004]}>
                <planeGeometry args={[0.6, 0.1]} />
                <meshBasicMaterial color={0xFF6B14} depthWrite={false} transparent opacity={0.95 * o} />
            </mesh>
            <HudText
                position={[0.36, -0.42, 0.006]}
                fontSize={0.058}
                color="#FFFFFF"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.08}
                fontWeight={700}
            >
                ⌂ Ajouter
            </HudText>

            {/* Bordure subtile sur toute la zone image */}
            <UIBorder position={[0, 0.22, 0.008]} width={1.36} height={0.48} opacity={0.12 * o} />
        </GlassCard>
    );
};