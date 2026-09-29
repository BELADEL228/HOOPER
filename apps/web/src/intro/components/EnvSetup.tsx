import { useEffect, useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════════════
 *  ENV SETUP — environnement studio brillant (indispensable pour PBR)
 *
 *  ⚠️ Un env map sombre rend les matériaux PBR SOMBRES, car la couleur
 *     diffuse vient principalement de l'irradiance de l'environnement.
 *  ⚠️ On utilise un PMREM (Prefiltered Mipmapped Radiance Env Map) pour
 *     éviter l'erreur shader CUBEUV_TEXEL_HEIGHT.
 * ═══════════════════════════════════════════════════════════════════════════ */

const createStudioEnvCanvas = (): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    /* ─── Plafond lumineux (lumière du studio) ──────────────────────── */
    const ceiling = ctx.createLinearGradient(0, 0, 0, 120);
    ceiling.addColorStop(0, '#e8eef5');   // blanc froid très lumineux
    ceiling.addColorStop(0.5, '#c8d4e0');
    ceiling.addColorStop(1, '#8899aa');
    ctx.fillStyle = ceiling;
    ctx.fillRect(0, 0, 512, 120);

    /* ─── Murs mi-clairs (rebond de lumière) ────────────────────────── */
    const walls = ctx.createLinearGradient(0, 120, 0, 200);
    walls.addColorStop(0, '#8899aa');
    walls.addColorStop(0.5, '#5a6472');
    walls.addColorStop(1, '#3a4250');
    ctx.fillStyle = walls;
    ctx.fillRect(0, 120, 512, 80);

    /* ─── Sol sombre mais pas noir (comme un vrai parquet verni) ─────── */
    const floor = ctx.createLinearGradient(0, 200, 0, 256);
    floor.addColorStop(0, '#3a4250');
    floor.addColorStop(0.6, '#1e2530');
    floor.addColorStop(1, '#0e1218');
    ctx.fillStyle = floor;
    ctx.fillRect(0, 200, 512, 56);

    /* ─── Key light chaude (haut droite) ────────────────────────────── */
    const kx = 380, ky = 40;
    const kGrad = ctx.createRadialGradient(kx, ky, 0, kx, ky, 140);
    kGrad.addColorStop(0, 'rgba(255,248,235,1)');
    kGrad.addColorStop(0.3, 'rgba(255,225,180,0.85)');
    kGrad.addColorStop(0.7, 'rgba(255,200,140,0.3)');
    kGrad.addColorStop(1, 'rgba(255,180,120,0)');
    ctx.fillStyle = kGrad;
    ctx.fillRect(0, 0, 512, 256);

    /* ─── Fill light froide (gauche) ────────────────────────────────── */
    const fx = 90, fy = 90;
    const fGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, 120);
    fGrad.addColorStop(0, 'rgba(180,210,255,0.8)');
    fGrad.addColorStop(0.5, 'rgba(140,180,240,0.35)');
    fGrad.addColorStop(1, 'rgba(100,150,220,0)');
    ctx.fillStyle = fGrad;
    ctx.fillRect(0, 0, 512, 256);

    /* ─── Rim light chaude (bas droite) ─────────────────────────────── */
    const rx = 440, ry = 220;
    const rGrad = ctx.createRadialGradient(rx, ry, 0, rx, ry, 90);
    rGrad.addColorStop(0, 'rgba(255,180,90,0.7)');
    rGrad.addColorStop(0.5, 'rgba(255,150,50,0.3)');
    rGrad.addColorStop(1, 'rgba(255,140,40,0)');
    ctx.fillStyle = rGrad;
    ctx.fillRect(0, 0, 512, 256);

    /* ─── Petite lumière d'appoint au centre haut ───────────────────── */
    const cx = 256, cy = 30;
    const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
    cGrad.addColorStop(0, 'rgba(255,255,255,0.5)');
    cGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = cGrad;
    ctx.fillRect(0, 0, 512, 120);

    return canvas;
};

export const EnvSetup = () => {
    const { gl, scene } = useThree();
    const [pmremTexture, setPmremTexture] = useState<THREE.Texture | null>(null);

    // Génération PMREM asynchrone pour laisser le renderer se stabiliser
    useEffect(() => {
        let cancelled = false;

        const id = requestAnimationFrame(() => {
            try {
                const generator = new THREE.PMREMGenerator(gl);
                generator.compileEquirectangularShader();

                const envCanvas = createStudioEnvCanvas();
                const equirect = new THREE.CanvasTexture(envCanvas);
                equirect.mapping = THREE.EquirectangularReflectionMapping;
                equirect.colorSpace = THREE.SRGBColorSpace;
                equirect.needsUpdate = true;

                const pmrem = generator.fromEquirectangular(equirect);

                equirect.dispose();
                generator.dispose();
                envCanvas.width = 1;
                envCanvas.height = 1;

                if (!cancelled) {
                    setPmremTexture(pmrem.texture);
                } else {
                    pmrem.texture.dispose();
                }
            } catch (err) {
                console.error('[EnvSetup] PMREM generation failed:', err);
            }
        });

        return () => {
            cancelled = true;
            cancelAnimationFrame(id);
        };
    }, [gl]);

    // Application à la scène quand prête
    useEffect(() => {
        if (!pmremTexture || !scene) return;

        scene.environment = pmremTexture;
        // Multiplie l'intensité (compense si l'env reste un peu sombre)
        (scene as any).environmentIntensity = 1.2;

        return () => {
            if (scene.environment === pmremTexture) {
                scene.environment = null;
            }
        };
    }, [scene, pmremTexture]);

    // Dispose au démontage complet
    useEffect(() => {
        return () => {
            pmremTexture?.dispose();
        };
    }, [pmremTexture]);

    return null;
};