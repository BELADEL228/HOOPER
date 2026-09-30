import { useMemo } from 'react';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════════════
 *  ICON — rendu vectoriel canvas (pas d'emoji)
 *
 *  Chaque icône est dessinée sur un canvas 96×96 avec traits 6px, puis
 *  affichée sur un plane. Supporte stroke + fill, taille contrôlable.
 * ═══════════════════════════════════════════════════════════════════════════ */

export type IconName =
    | 'bell' | 'user' | 'users' | 'message' | 'heart' | 'comment' | 'share'
    | 'bookmark' | 'search' | 'plus' | 'star' | 'fire' | 'shield' | 'calendar'
    | 'chart' | 'arrow-right' | 'arrow-left' | 'dots-v' | 'image' | 'video'
    | 'upload' | 'globe' | 'send' | 'eye' | 'trash' | 'check' | 'lock' | 'mail'
    | 'basketball' | 'trophy' | 'clock' | 'map-pin';

interface IconProps {
    name: IconName;
    position?: [number, number, number];
    size?: number;
    color?: string;
    opacity?: number;
}

const DRAWERS: Record<IconName, (ctx: CanvasRenderingContext2D) => void> = {
    bell: (c) => {
        c.beginPath();
        c.moveTo(48, 18);
        c.bezierCurveTo(34, 18, 26, 28, 26, 42);
        c.lineTo(26, 56);
        c.lineTo(20, 66);
        c.lineTo(76, 66);
        c.lineTo(70, 56);
        c.lineTo(70, 42);
        c.bezierCurveTo(70, 28, 62, 18, 48, 18);
        c.closePath();
        c.stroke();
        c.beginPath();
        c.moveTo(40, 74);
        c.bezierCurveTo(40, 80, 44, 82, 48, 82);
        c.bezierCurveTo(52, 82, 56, 80, 56, 74);
        c.stroke();
    },
    user: (c) => {
        c.beginPath();
        c.arc(48, 36, 15, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.moveTo(20, 82);
        c.bezierCurveTo(20, 64, 32, 58, 48, 58);
        c.bezierCurveTo(64, 58, 76, 64, 76, 82);
        c.stroke();
    },
    users: (c) => {
        c.beginPath();
        c.arc(38, 38, 12, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.moveTo(14, 80);
        c.bezierCurveTo(14, 64, 24, 60, 38, 60);
        c.bezierCurveTo(52, 60, 62, 64, 62, 80);
        c.stroke();
        c.beginPath();
        c.arc(68, 42, 9, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.moveTo(62, 78);
        c.bezierCurveTo(62, 68, 68, 66, 76, 66);
        c.bezierCurveTo(82, 66, 84, 68, 84, 76);
        c.stroke();
    },
    message: (c) => {
        c.beginPath();
        c.moveTo(20, 30);
        c.lineTo(76, 30);
        c.bezierCurveTo(80, 30, 82, 32, 82, 36);
        c.lineTo(82, 66);
        c.bezierCurveTo(82, 70, 80, 72, 76, 72);
        c.lineTo(40, 72);
        c.lineTo(26, 84);
        c.lineTo(26, 72);
        c.lineTo(20, 72);
        c.bezierCurveTo(16, 72, 14, 70, 14, 66);
        c.lineTo(14, 36);
        c.bezierCurveTo(14, 32, 16, 30, 20, 30);
        c.closePath();
        c.stroke();
    },
    heart: (c) => {
        c.beginPath();
        c.moveTo(48, 76);
        c.bezierCurveTo(24, 58, 16, 46, 16, 34);
        c.bezierCurveTo(16, 24, 24, 18, 34, 18);
        c.bezierCurveTo(42, 18, 46, 22, 48, 28);
        c.bezierCurveTo(50, 22, 54, 18, 62, 18);
        c.bezierCurveTo(72, 18, 80, 24, 80, 34);
        c.bezierCurveTo(80, 46, 72, 58, 48, 76);
        c.closePath();
        c.stroke();
    },
    comment: (c) => {
        c.beginPath();
        c.arc(48, 48, 26, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.moveTo(40, 74);
        c.lineTo(30, 88);
        c.lineTo(48, 76);
        c.stroke();
    },
    share: (c) => {
        c.beginPath();
        c.arc(70, 24, 10, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.arc(24, 48, 10, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.arc(70, 74, 10, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.moveTo(32, 43);
        c.lineTo(60, 29);
        c.stroke();
        c.beginPath();
        c.moveTo(32, 53);
        c.lineTo(60, 69);
        c.stroke();
    },
    bookmark: (c) => {
        c.beginPath();
        c.moveTo(30, 14);
        c.lineTo(66, 14);
        c.lineTo(66, 84);
        c.lineTo(48, 68);
        c.lineTo(30, 84);
        c.closePath();
        c.stroke();
    },
    search: (c) => {
        c.beginPath();
        c.arc(42, 42, 22, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.moveTo(58, 58);
        c.lineTo(80, 80);
        c.stroke();
    },
    plus: (c) => {
        c.beginPath();
        c.moveTo(48, 22);
        c.lineTo(48, 74);
        c.stroke();
        c.beginPath();
        c.moveTo(22, 48);
        c.lineTo(74, 48);
        c.stroke();
    },
    star: (c) => {
        c.beginPath();
        c.moveTo(48, 14);
        c.lineTo(58, 40);
        c.lineTo(84, 40);
        c.lineTo(62, 56);
        c.lineTo(70, 82);
        c.lineTo(48, 68);
        c.lineTo(26, 82);
        c.lineTo(34, 56);
        c.lineTo(12, 40);
        c.lineTo(38, 40);
        c.closePath();
        c.fill();
        c.stroke();
    },
    fire: (c) => {
        c.beginPath();
        c.moveTo(48, 84);
        c.bezierCurveTo(28, 84, 20, 68, 24, 52);
        c.bezierCurveTo(28, 40, 38, 32, 36, 16);
        c.bezierCurveTo(46, 20, 52, 30, 52, 42);
        c.bezierCurveTo(58, 32, 60, 24, 58, 16);
        c.bezierCurveTo(72, 32, 76, 52, 72, 64);
        c.bezierCurveTo(68, 78, 58, 84, 48, 84);
        c.closePath();
        c.stroke();
    },
    shield: (c) => {
        c.beginPath();
        c.moveTo(48, 12);
        c.lineTo(80, 26);
        c.lineTo(80, 52);
        c.bezierCurveTo(80, 70, 64, 82, 48, 86);
        c.bezierCurveTo(32, 82, 16, 70, 16, 52);
        c.lineTo(16, 26);
        c.closePath();
        c.stroke();
    },
    calendar: (c) => {
        c.beginPath();
        c.rect(16, 24, 64, 60);
        c.stroke();
        c.beginPath();
        c.moveTo(16, 40);
        c.lineTo(80, 40);
        c.stroke();
        c.beginPath();
        c.moveTo(32, 16);
        c.lineTo(32, 30);
        c.stroke();
        c.beginPath();
        c.moveTo(64, 16);
        c.lineTo(64, 30);
        c.stroke();
    },
    chart: (c) => {
        c.beginPath();
        c.moveTo(18, 82);
        c.lineTo(82, 82);
        c.stroke();
        c.beginPath();
        c.moveTo(18, 82);
        c.lineTo(18, 18);
        c.stroke();
        c.beginPath();
        c.moveTo(30, 70);
        c.lineTo(30, 50);
        c.stroke();
        c.beginPath();
        c.moveTo(48, 70);
        c.lineTo(48, 34);
        c.stroke();
        c.beginPath();
        c.moveTo(66, 70);
        c.lineTo(66, 24);
        c.stroke();
    },
    'arrow-right': (c) => {
        c.beginPath();
        c.moveTo(20, 48);
        c.lineTo(76, 48);
        c.stroke();
        c.beginPath();
        c.moveTo(58, 30);
        c.lineTo(76, 48);
        c.lineTo(58, 66);
        c.stroke();
    },
    'arrow-left': (c) => {
        c.beginPath();
        c.moveTo(76, 48);
        c.lineTo(20, 48);
        c.stroke();
        c.beginPath();
        c.moveTo(38, 30);
        c.lineTo(20, 48);
        c.lineTo(38, 66);
        c.stroke();
    },
    'dots-v': (c) => {
        c.beginPath();
        c.arc(48, 24, 5, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(48, 48, 5, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(48, 72, 5, 0, Math.PI * 2);
        c.fill();
    },
    image: (c) => {
        c.beginPath();
        c.rect(14, 22, 68, 56);
        c.stroke();
        c.beginPath();
        c.arc(34, 42, 7, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.moveTo(20, 70);
        c.lineTo(40, 50);
        c.lineTo(58, 64);
        c.lineTo(74, 44);
        c.lineTo(76, 74);
        c.closePath();
        c.stroke();
    },
    video: (c) => {
        c.beginPath();
        c.rect(14, 26, 52, 44);
        c.stroke();
        c.beginPath();
        c.moveTo(66, 38);
        c.lineTo(84, 28);
        c.lineTo(84, 68);
        c.lineTo(66, 58);
        c.closePath();
        c.stroke();
    },
    upload: (c) => {
        c.beginPath();
        c.moveTo(48, 72);
        c.lineTo(48, 24);
        c.stroke();
        c.beginPath();
        c.moveTo(30, 40);
        c.lineTo(48, 22);
        c.lineTo(66, 40);
        c.stroke();
        c.beginPath();
        c.moveTo(20, 76);
        c.lineTo(20, 86);
        c.lineTo(76, 86);
        c.lineTo(76, 76);
        c.stroke();
    },
    globe: (c) => {
        c.beginPath();
        c.arc(48, 48, 32, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.ellipse(48, 48, 14, 32, 0, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.moveTo(16, 48);
        c.lineTo(80, 48);
        c.stroke();
    },
    send: (c) => {
        c.beginPath();
        c.moveTo(84, 48);
        c.lineTo(16, 18);
        c.lineTo(28, 48);
        c.lineTo(16, 78);
        c.closePath();
        c.stroke();
        c.beginPath();
        c.moveTo(28, 48);
        c.lineTo(84, 48);
        c.stroke();
    },
    eye: (c) => {
        c.beginPath();
        c.moveTo(12, 48);
        c.bezierCurveTo(26, 26, 70, 26, 84, 48);
        c.bezierCurveTo(70, 70, 26, 70, 12, 48);
        c.closePath();
        c.stroke();
        c.beginPath();
        c.arc(48, 48, 10, 0, Math.PI * 2);
        c.stroke();
    },
    trash: (c) => {
        c.beginPath();
        c.moveTo(22, 28);
        c.lineTo(74, 28);
        c.stroke();
        c.beginPath();
        c.moveTo(40, 28);
        c.lineTo(40, 18);
        c.lineTo(56, 18);
        c.lineTo(56, 28);
        c.stroke();
        c.beginPath();
        c.moveTo(28, 28);
        c.lineTo(32, 82);
        c.lineTo(64, 82);
        c.lineTo(68, 28);
        c.stroke();
    },
    check: (c) => {
        c.beginPath();
        c.moveTo(20, 48);
        c.lineTo(40, 68);
        c.lineTo(78, 28);
        c.stroke();
    },
    lock: (c) => {
        c.beginPath();
        c.rect(22, 44, 52, 40);
        c.stroke();
        c.beginPath();
        c.arc(48, 44, 18, Math.PI, 0);
        c.stroke();
    },
    mail: (c) => {
        c.beginPath();
        c.rect(14, 26, 68, 44);
        c.stroke();
        c.beginPath();
        c.moveTo(14, 26);
        c.lineTo(48, 54);
        c.lineTo(82, 26);
        c.stroke();
    },
    basketball: (c) => {
        c.beginPath();
        c.arc(48, 48, 32, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.moveTo(16, 48);
        c.lineTo(80, 48);
        c.stroke();
        c.beginPath();
        c.moveTo(48, 16);
        c.lineTo(48, 80);
        c.stroke();
    },
    trophy: (c) => {
        c.beginPath();
        c.moveTo(28, 22);
        c.lineTo(68, 22);
        c.lineTo(68, 44);
        c.bezierCurveTo(68, 58, 58, 64, 48, 64);
        c.bezierCurveTo(38, 64, 28, 58, 28, 44);
        c.closePath();
        c.stroke();
        c.beginPath();
        c.moveTo(28, 30);
        c.lineTo(16, 30);
        c.lineTo(16, 40);
        c.bezierCurveTo(16, 48, 22, 52, 30, 52);
        c.stroke();
        c.beginPath();
        c.moveTo(68, 30);
        c.lineTo(80, 30);
        c.lineTo(80, 40);
        c.bezierCurveTo(80, 48, 74, 52, 66, 52);
        c.stroke();
        c.beginPath();
        c.moveTo(48, 64);
        c.lineTo(48, 80);
        c.stroke();
        c.beginPath();
        c.moveTo(34, 84);
        c.lineTo(62, 84);
        c.stroke();
    },
    clock: (c) => {
        c.beginPath();
        c.arc(48, 48, 32, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.moveTo(48, 28);
        c.lineTo(48, 48);
        c.lineTo(62, 56);
        c.stroke();
    },
    'map-pin': (c) => {
        c.beginPath();
        c.moveTo(48, 86);
        c.bezierCurveTo(30, 62, 22, 48, 22, 38);
        c.bezierCurveTo(22, 24, 34, 14, 48, 14);
        c.bezierCurveTo(62, 14, 74, 24, 74, 38);
        c.bezierCurveTo(74, 48, 66, 62, 48, 86);
        c.closePath();
        c.stroke();
        c.beginPath();
        c.arc(48, 38, 8, 0, Math.PI * 2);
        c.stroke();
    },
};

/* ─── Cache global : une seule texture par (nom, couleur) ───────────── */
const iconCache = new Map<string, THREE.CanvasTexture>();

const getIconTexture = (name: IconName, color: string): THREE.CanvasTexture => {
    const key = `${name}|${color}`;
    const cached = iconCache.get(key);
    if (cached) return cached;

    const SIZE = 96;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;

    // Style commun : stroke 6px, linecap rond, linejoin rond
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    DRAWERS[name](ctx);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    iconCache.set(key, tex);
    return tex;
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  COMPOSANT ICON
 * ═══════════════════════════════════════════════════════════════════════════ */

export const Icon = ({
    name,
    position = [0, 0, 0],
    size = 0.06,
    color = '#FFFFFF',
    opacity = 1,
}: IconProps) => {
    const texture = useMemo(() => getIconTexture(name, color), [name, color]);

    // Le cache est global → pas de dispose ici pour ne pas casser les autres usages

    return (
        <mesh position={position}>
            <planeGeometry args={[size, size]} />
            <meshBasicMaterial
                map={texture}
                transparent
                opacity={opacity}
                depthWrite={false}
                toneMapped={false}
            />
        </mesh>
    );
};