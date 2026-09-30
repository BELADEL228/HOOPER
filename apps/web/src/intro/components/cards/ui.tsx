import { HudText } from '../HudText';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════════════
 *  UI PRIMITIVES PREMIUM — briques pour les cards HOOPERS
 *
 *  Toutes les primitives utilisent maintenant des dégradés doux, des bordures
 *  fines, et respectent la palette HOOPERS (rouge #FF2A3B, or #FFB800).
 * ═══════════════════════════════════════════════════════════════════════════ */

/* ─── Bloc plein (fond de card, bouton) ─────────────────────────────── */
export const UIBlock = ({
    position = [0, 0, 0] as [number, number, number],
    width,
    height,
    color = 0x14141a,
    opacity = 1,
}: {
    position?: [number, number, number];
    width: number;
    height: number;
    color?: number | string;
    opacity?: number;
}) => (
    <mesh position={position}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
            color={color}
            transparent
            opacity={opacity}
            depthWrite={false}
            toneMapped={false}
        />
    </mesh>
);

/* ─── Pastille circulaire ────────────────────────────────────────────── */
export const UIDot = ({
    position = [0, 0, 0] as [number, number, number],
    radius = 0.07,
    color = 0xFF2A3B,
    opacity = 1,
}: {
    position?: [number, number, number];
    radius?: number;
    color?: number | string;
    opacity?: number;
}) => (
    <mesh position={position}>
        <circleGeometry args={[radius, 32]} />
        <meshBasicMaterial
            color={color}
            transparent
            opacity={opacity}
            depthWrite={false}
            toneMapped={false}
        />
    </mesh>
);

/* ─── Bordure fine ───────────────────────────────────────────────────── */
export const UIBorder = ({
    position = [0, 0, 0] as [number, number, number],
    width,
    height,
    color = 0xffffff,
    opacity = 0.12,
}: {
    position?: [number, number, number];
    width: number;
    height: number;
    color?: number | string;
    opacity?: number;
}) => {
    const halfW = width / 2;
    const halfH = height / 2;
    const thick = 0.005;

    return (
        <group position={position}>
            <mesh position={[0, halfH, 0]}>
                <planeGeometry args={[width, thick]} />
                <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh position={[0, -halfH, 0]}>
                <planeGeometry args={[width, thick]} />
                <meshBasicMaterial color={color} transparent opacity={opacity * 0.6} depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh position={[halfW, 0, 0]}>
                <planeGeometry args={[thick, height]} />
                <meshBasicMaterial color={color} transparent opacity={opacity * 0.7} depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh position={[-halfW, 0, 0]}>
                <planeGeometry args={[thick, height]} />
                <meshBasicMaterial color={color} transparent opacity={opacity * 0.7} depthWrite={false} toneMapped={false} />
            </mesh>
        </group>
    );
};

/* ─── Badge (pastille colorée + label) ──────────────────────────────── */
export const UIBadge = ({
    position = [0, 0, 0] as [number, number, number],
    width = 0.28,
    height = 0.085,
    color = 0xFF2A3B,
    label,
    labelColor = '#FFFFFF',
    labelSize = 0.05,
}: {
    position?: [number, number, number];
    width?: number;
    height?: number;
    color?: number | string;
    label: string;
    labelColor?: string;
    labelSize?: number;
}) => (
    <group position={position}>
        <mesh>
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial color={color} depthWrite={false} toneMapped={false} />
        </mesh>
        <HudText
            position={[0, 0, 0.002]}
            fontSize={labelSize}
            color={labelColor}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.08}
            fontWeight={700}
        >
            {label}
        </HudText>
    </group>
);

/* ─── Bouton avec glow subtil ───────────────────────────────────────── */
export const UIButton = ({
    position = [0, 0, 0] as [number, number, number],
    width = 0.4,
    height = 0.12,
    color = 0xFF2A3B,
    label,
    labelColor = '#FFFFFF',
    labelSize = 0.06,
    border = false,
}: {
    position?: [number, number, number];
    width?: number;
    height?: number;
    color?: number | string;
    label: string;
    labelColor?: string;
    labelSize?: number;
    border?: boolean;
}) => (
    <group position={position}>
        {/* Glow doux derrière le bouton */}
        {!border && (
            <mesh position={[0, 0, -0.004]}>
                <planeGeometry args={[width * 1.15, height * 1.6]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.18}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    toneMapped={false}
                />
            </mesh>
        )}

        <mesh>
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial
                color={color}
                depthWrite={false}
                transparent
                opacity={border ? 0.08 : 1}
                toneMapped={false}
            />
        </mesh>
        {border && <UIBorder width={width} height={height} opacity={0.28} />}
        <HudText
            position={[0, 0, 0.002]}
            fontSize={labelSize}
            color={labelColor}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.05}
            fontWeight={700}
        >
            {label}
        </HudText>
    </group>
);

/* ─── Barre de recherche ────────────────────────────────────────────── */
export const UISearchBar = ({
    position = [0, 0, 0] as [number, number, number],
    width = 1.3,
    height = 0.13,
    placeholder,
}: {
    position?: [number, number, number];
    width?: number;
    height?: number;
    placeholder: string;
}) => (
    <group position={position}>
        <mesh>
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial color={0x0e0e12} depthWrite={false} toneMapped={false} />
        </mesh>
        <UIBorder width={width} height={height} opacity={0.12} />

        <UIDot position={[-width / 2 + 0.08, 0.012, 0.002]} radius={0.032} color={0x666a72} />
        <UIDot position={[-width / 2 + 0.08, 0.012, 0.001]} radius={0.022} color={0x0e0e12} />
        <mesh position={[-width / 2 + 0.088, -0.015, 0.002]}>
            <planeGeometry args={[0.006, 0.03]} />
            <meshBasicMaterial color={0x666a72} depthWrite={false} toneMapped={false} />
        </mesh>

        <HudText
            position={[-width / 2 + 0.16, 0, 0.002]}
            fontSize={0.055}
            color="#5a5e66"
            anchorX="left"
            anchorY="middle"
            letterSpacing={0}
            fontWeight={500}
        >
            {placeholder}
        </HudText>
    </group>
);

/* ─── Avatar circulaire ─────────────────────────────────────────────── */
export const UIAvatar = ({
    position = [0, 0, 0] as [number, number, number],
    radius = 0.11,
    bgColor = 0xFF2A3B,
    innerColor = 0xFF1F3D,
    ringColor = 0xffffff,
    ringOpacity = 0.15,
}: {
    position?: [number, number, number];
    radius?: number;
    bgColor?: number | string;
    innerColor?: number | string;
    ringColor?: number | string;
    ringOpacity?: number;
}) => (
    <group position={position}>
        <mesh>
            <circleGeometry args={[radius + 0.012, 32]} />
            <meshBasicMaterial color={ringColor} transparent opacity={ringOpacity} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh>
            <circleGeometry args={[radius, 32]} />
            <meshBasicMaterial color={bgColor} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh position={[0, -radius * 0.15, 0.001]}>
            <circleGeometry args={[radius * 0.55, 24]} />
            <meshBasicMaterial color={innerColor} transparent opacity={0.35} depthWrite={false} toneMapped={false} />
        </mesh>
    </group>
);

/* ─── Point d'état ──────────────────────────────────────────────────── */
export const UIStatusDot = ({
    position = [0, 0, 0] as [number, number, number],
    color = 0x22c55e,
    radius = 0.022,
}: {
    position?: [number, number, number];
    color?: number | string;
    radius?: number;
}) => (
    <mesh position={position}>
        <circleGeometry args={[radius, 16]} />
        <meshBasicMaterial color={color} depthWrite={false} toneMapped={false} />
    </mesh>
);