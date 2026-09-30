import { GlassCard } from '../GlassCard';
import { HudText } from '../HudText';
import { Icon } from '../icons';

interface StatsCardProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    opacity?: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  STATS CARD — Shop / produit (Maillot FIRE STONE 2026)
 * ═══════════════════════════════════════════════════════════════════════════ */

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
            accentColor="#FFB800"
        >
            {/* ═══ ZONE IMAGE PRODUIT ═══════════════════════════════════ */}
            <mesh position={[0, 0.2, 0.003]}>
                <planeGeometry args={[1.36, 0.46]} />
                <meshBasicMaterial color={0x1a1010} depthWrite={false} toneMapped={false} />
            </mesh>

            {/* Dégradé sombre côté droit */}
            <mesh position={[0.3, 0.2, 0.004]}>
                <planeGeometry args={[0.8, 0.46]} />
                <meshBasicMaterial
                    color={0x0a0503}
                    transparent
                    opacity={0.55 * o}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>

            {/* Panier stylisé */}
            <mesh position={[-0.4, 0.28, 0.006]}>
                <ringGeometry args={[0.09, 0.11, 32]} />
                <meshBasicMaterial
                    color={0xFF6B14}
                    transparent
                    opacity={0.95 * o}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>
            <mesh position={[-0.4, 0.28, 0.006]}>
                <ringGeometry args={[0.05, 0.06, 32]} />
                <meshBasicMaterial
                    color={0xFF6B14}
                    transparent
                    opacity={0.75 * o}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>

            {/* Filet stylisé */}
            {[-0.06, -0.03, 0, 0.03, 0.06].map((dx, i) => (
                <mesh
                    key={i}
                    position={[-0.4 + dx, 0.22, 0.006]}
                    rotation={[0, 0, dx * 5]}
                >
                    <planeGeometry args={[0.004, 0.1]} />
                    <meshBasicMaterial
                        color={0xF5F0E8}
                        transparent
                        opacity={0.65 * o}
                        depthWrite={false}
                        toneMapped={false}
                    />
                </mesh>
            ))}

            {/* Badge BEST-SELLER */}
            <mesh position={[-0.52, 0.36, 0.007]}>
                <planeGeometry args={[0.28, 0.075]} />
                <meshBasicMaterial color={0xFF6B14} depthWrite={false} toneMapped={false} />
            </mesh>
            <HudText
                position={[-0.52, 0.36, 0.009]}
                fontSize={0.042}
                color="#FFFFFF"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.14}
                fontWeight={800}
            >
                BEST-SELLER
            </HudText>

            {/* Badge FLOCAGE */}
            <mesh position={[0.5, 0.16, 0.005]}>
                <planeGeometry args={[0.28, 0.06]} />
                <meshBasicMaterial
                    color={0x0e1a1f}
                    transparent
                    opacity={0.9 * o}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>
            <HudText
                position={[0.5, 0.16, 0.007]}
                fontSize={0.04}
                color="#7dd3fc"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.1}
                fontWeight={700}
            >
                FLOCAGE DISPO
            </HudText>

            {/* ═══ EYEBROW + NOTE ═══════════════════════════════════════ */}
            <HudText
                position={[-0.62, 0.0, 0.004]}
                fontSize={0.048}
                color="#FFB800"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.26}
                fontWeight={700}
            >
                JERSEYS
            </HudText>

            <Icon
                name="star"
                position={[0.42, 0.0, 0.004]}
                size={0.055}
                color="#FFB800"
                opacity={o}
            />
            <HudText
                position={[0.6, 0.0, 0.004]}
                fontSize={0.055}
                color="rgba(255,255,255,0.7)"
                opacity={o}
                anchorX="right"
                anchorY="middle"
                letterSpacing={0.04}
                fontWeight={600}
            >
                4.9 · 38
            </HudText>

            {/* ═══ TITRE PRODUIT ════════════════════════════════════════ */}
            <HudText
                position={[-0.62, -0.09, 0.004]}
                fontSize={0.075}
                color="#FFFFFF"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.02}
                fontWeight={700}
            >
                Maillot FIRE STONE 2026
            </HudText>

            {/* ═══ DIVIDER ══════════════════════════════════════════════ */}
            <mesh position={[0, -0.17, 0.004]}>
                <planeGeometry args={[1.3, 0.0012]} />
                <meshBasicMaterial
                    color={0xffffff}
                    transparent
                    opacity={0.08 * o}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>

            {/* ═══ PRIX ═════════════════════════════════════════════════ */}
            <HudText
                position={[-0.62, -0.25, 0.004]}
                fontSize={0.055}
                color="rgba(255,255,255,0.5)"
                opacity={o}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.08}
                fontWeight={500}
            >
                Prix Club
            </HudText>

            <HudText
                position={[0.62, -0.25, 0.004]}
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

            {/* ═══ BOUTONS ══════════════════════════════════════════════ */}
            {/* Bouton Floquer */}
            <mesh position={[-0.36, -0.4, 0.004]}>
                <planeGeometry args={[0.6, 0.1]} />
                <meshBasicMaterial
                    color={0x1c1c22}
                    transparent
                    opacity={0.9 * o}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>
            <HudText
                position={[-0.36, -0.4, 0.006]}
                fontSize={0.055}
                color="#7dd3fc"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.1}
                fontWeight={700}
            >
                Floquer
            </HudText>

            {/* Bouton Ajouter */}
            <mesh position={[0.36, -0.4, 0.004]}>
                <planeGeometry args={[0.6, 0.1]} />
                <meshBasicMaterial
                    color={0xFF6B14}
                    transparent
                    opacity={0.95 * o}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>
            <HudText
                position={[0.36, -0.4, 0.006]}
                fontSize={0.055}
                color="#FFFFFF"
                opacity={o}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.1}
                fontWeight={700}
            >
                Ajouter
            </HudText>
        </GlassCard>
    );
};