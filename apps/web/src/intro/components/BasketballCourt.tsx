import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { MeshReflectorMaterial, useTexture } from '@react-three/drei';
import { clamp01, easeOutCubic } from '../timeline/timeline';

/*  PATCH_SIZE : taille du morceau de terrain (14 = petit, 20 = plus large)
 *  PLANK_TILE : taille d'UNE répétition de ta texture (plus petit = planches plus fines) */
const PATCH_SIZE = 14;
const PLANK_TILE = 4.67;      // = 28 / 6 : même échelle de planches qu'avant

const createRadialVignetteTexture = (): THREE.CanvasTexture => {
    const SIZE = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, SIZE, SIZE);

    const centerX = SIZE / 2;
    const centerY = SIZE / 2;
    const innerRadius = SIZE * 0.08;
    const midRadius = SIZE * 0.28;
    const outerRadius = SIZE * 0.48;

    ctx.globalCompositeOperation = 'destination-out';
    const grad = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop((midRadius - innerRadius) / (outerRadius - innerRadius), 'rgba(0,0,0,0.85)');
    grad.addColorStop(0.85, 'rgba(0,0,0,0.25)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    return tex;
};

interface BasketballCourtProps {
    time: number;
    ballX?: number;
    ballZ?: number;
    reflective?: boolean;
}

export const BasketballCourt = ({ time, ballX = 0, ballZ = 0, reflective = false }: BasketballCourtProps) => {
    const [diffuse, normal, rough] = useTexture([
        '/textures/parquet/diffuse.jpg',
        '/textures/parquet/normal.jpg',
        '/textures/parquet/rough.jpg',
    ]);

    useMemo(() => {
        const repeat = PATCH_SIZE / PLANK_TILE;

        diffuse.wrapS = diffuse.wrapT = THREE.RepeatWrapping;
        diffuse.repeat.set(repeat, repeat);
        diffuse.anisotropy = 8;
        diffuse.colorSpace = THREE.SRGBColorSpace;
        diffuse.needsUpdate = true;

        normal.wrapS = normal.wrapT = THREE.RepeatWrapping;
        normal.repeat.set(repeat, repeat);
        normal.anisotropy = 8;
        normal.needsUpdate = true;

        rough.wrapS = rough.wrapT = THREE.RepeatWrapping;
        rough.repeat.set(repeat, repeat);
        rough.anisotropy = 8;
        rough.needsUpdate = true;
    }, [diffuse, normal, rough]);

    const vignette = useMemo(() => createRadialVignetteTexture(), []);
    const courtGeo = useMemo(() => new THREE.PlaneGeometry(PATCH_SIZE, PATCH_SIZE), []);
    const vignetteGeo = useMemo(() => new THREE.PlaneGeometry(PATCH_SIZE, PATCH_SIZE), []);
    const haloGeo = useMemo(() => new THREE.CircleGeometry(3.2, 48), []);

    useEffect(() => () => {
        vignette.dispose();
        courtGeo.dispose();
        vignetteGeo.dispose();
        haloGeo.dispose();
    }, [vignette, courtGeo, vignetteGeo, haloGeo]);

    const appear = clamp01(easeOutCubic((time - 0.3) / 1.8));
    const haloPulse = 0.55 + Math.sin(time * 1.8) * 0.06;

    /* ORDRE DE DESSIN : parquet (-4) → lignes (-3) → vignette (-2) → halos (-1) → ballon (0) */
    return (
        <group visible={appear > 0.001}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow renderOrder={-4}>
                <primitive object={courtGeo} attach="geometry" />
                {reflective ? (
                    <MeshReflectorMaterial
                        map={diffuse}
                        normalMap={normal}
                        normalScale={new THREE.Vector2(0.7, 0.7)}
                        roughnessMap={rough}
                        color={0xffffff}
                        metalness={0.02}
                        roughness={0.55}
                        mirror={0.35}
                        resolution={512}
                        blur={[280, 90]}
                        mixBlur={1.2}
                        mixStrength={0.8}
                        mixContrast={1}
                        depthScale={0.6}
                        minDepthThreshold={0.4}
                        maxDepthThreshold={1.4}
                        envMapIntensity={0.3}
                        transparent
                        opacity={appear}
                    />
                ) : (
                    <meshPhysicalMaterial
                        map={diffuse}
                        normalMap={normal}
                        normalScale={new THREE.Vector2(0.7, 0.7)}
                        roughnessMap={rough}
                        color={0xffffff}
                        metalness={0.02}
                        roughness={0.55}
                        clearcoat={0.35}
                        clearcoatRoughness={0.35}
                        envMapIntensity={0.4}
                        transparent
                        opacity={appear}
                    />
                )}
            </mesh>

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ballX, 0.004, ballZ]} renderOrder={-2}>
                <primitive object={vignetteGeo} attach="geometry" />
                <meshBasicMaterial
                    map={vignette}
                    transparent
                    opacity={appear * 0.96}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                />
            </mesh>

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ballX, 0.006, ballZ]} renderOrder={-1}>
                <primitive object={haloGeo} attach="geometry" />
                <meshBasicMaterial
                    color={0xFFB800}
                    transparent
                    opacity={0.09 * haloPulse * appear}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    toneMapped={false}
                />
            </mesh>

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ballX, 0.008, ballZ]} renderOrder={-1}>
                <circleGeometry args={[5.5, 64]} />
                <meshBasicMaterial
                    color={0xFFA040}
                    transparent
                    opacity={0.035 * appear}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    toneMapped={false}
                />
            </mesh>
        </group>
    );
};