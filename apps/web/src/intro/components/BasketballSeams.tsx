import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const SPHERE_RADIUS = 1;
const SEAM_TUBE_RADIUS = 0.0155;
const WAVE_AMPLITUDE = 0.34;
const WAVE_FREQUENCY = 2;

const CURVE_SEGMENTS = 160;
const TUBE_SEGMENTS = 120;
const RADIAL_SEGMENTS = 6;

const sph = (theta: number, phi: number, r = SPHERE_RADIUS): THREE.Vector3 =>
    new THREE.Vector3(
        r * Math.sin(theta) * Math.cos(phi),
        r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(theta),
    );

const buildGreatCircle = (phi0: number): THREE.Vector3[] => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= CURVE_SEGMENTS; i++) {
        const t = (i / CURVE_SEGMENTS) * Math.PI * 2;
        const secondHalf = t >= Math.PI;
        const theta = secondHalf ? Math.PI * 2 - t : t;
        const phi = secondHalf ? phi0 + Math.PI : phi0;
        pts.push(sph(theta, phi));
    }
    return pts;
};

const buildWaveSeam = (
    amplitude: number,
    frequency: number,
    phase: number,
): THREE.Vector3[] => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= CURVE_SEGMENTS; i++) {
        const t = (i / CURVE_SEGMENTS) * Math.PI * 2;
        const theta = Math.PI / 2 + amplitude * Math.sin(frequency * t + phase);
        const phi = t;
        pts.push(sph(theta, phi));
    }
    return pts;
};

export const BasketballSeams = () => {
    const { geometries, material } = useMemo(() => {
        const curves: THREE.Vector3[][] = [
            buildGreatCircle(0),
            buildGreatCircle(Math.PI / 2),
            buildWaveSeam(WAVE_AMPLITUDE, WAVE_FREQUENCY, 0),
            buildWaveSeam(WAVE_AMPLITUDE, WAVE_FREQUENCY, Math.PI),
        ];

        const geos = curves.map((points) => {
            const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5);
            return new THREE.TubeGeometry(
                curve,
                TUBE_SEGMENTS,
                SEAM_TUBE_RADIUS,
                RADIAL_SEGMENTS,
                true,
            );
        });

        const mat = new THREE.MeshStandardMaterial({
            color: 0x0a0503,
            roughness: 0.82,
            metalness: 0.02,
        });

        return { geometries: geos, material: mat };
    }, []);

    useEffect(() => {
        return () => {
            geometries.forEach((g) => g.dispose());
            material.dispose();
        };
    }, [geometries, material]);

    return (
        <group>
            {geometries.map((geo, i) => (
                <mesh key={i} geometry={geo} material={material} castShadow />
            ))}
        </group>
    );
};