import {
    Component, Suspense, useEffect, useMemo, useRef,
    type MutableRefObject, type ReactNode,
} from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { computeBallPose, createBallPose } from '../timeline/ballMotion';
import { useIntroState } from '../timeline/IntroContext';
import { Basketball } from './Basketball';

interface ModelProps {
    url: string;
    timeRef: MutableRefObject<number>;
    modelRotation?: [number, number, number];
    envIntensity?: number;
}

const BallModel = ({ url, timeRef, modelRotation = [0, 0, 0], envIntensity = 1 }: ModelProps) => {
    const { scene } = useGLTF(url);
    const groupRef = useRef<THREE.Group>(null);
    const shared = useIntroState();
    const pose = useMemo(() => createBallPose(), []);

    /* ⚡ Ref pour ne changer `transparent` qu'une seule fois au moment du fondu */
    const fadingRef = useRef(false);

    const { root, materials, scale, offset } = useMemo(() => {
        const root = scene.clone(true);
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const radius = Math.max(size.x, size.y, size.z) / 2 || 1;
        const scale = 1 / radius;

        const materials: THREE.Material[] = [];
        root.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (!mesh.isMesh) return;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            const src = mesh.material;
            const cloned = Array.isArray(src) ? src.map((m) => m.clone()) : src.clone();
            mesh.material = cloned;
            (Array.isArray(cloned) ? cloned : [cloned]).forEach((m) => {
                /* ⚡ Ballon OPAQUE par défaut (avant : transparent = true) */
                m.transparent = false;
                m.depthWrite = true;
                m.alphaTest = 0;
                m.side = THREE.FrontSide;
                m.opacity = 1;
                const std = m as THREE.MeshStandardMaterial;
                if ('envMapIntensity' in std) std.envMapIntensity = envIntensity;
                materials.push(m);
            });
        });
        return { root, materials, scale, offset: center.multiplyScalar(-scale) };
    }, [scene, envIntensity]);

    useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

    useFrame(() => {
        const g = groupRef.current;
        if (!g) return;
        computeBallPose(timeRef.current, pose);
        g.position.set(pose.x, pose.y, pose.z);
        g.scale.set(pose.scale * pose.sx, pose.scale * pose.sy, pose.scale * pose.sz);
        g.quaternion.copy(pose.quaternion);

        /* ⚡ Active `transparent` UNIQUEMENT quand le fondu commence.
         *    Évite les artefacts de transparence sur les lignes du terrain
         *    qui semblaient apparaître à travers le ballon. */
        const fading = pose.opacity < 0.999;
        if (fading !== fadingRef.current) {
            fadingRef.current = fading;
            for (const m of materials) {
                m.transparent = fading;
                m.needsUpdate = true;
            }
        }
        for (const m of materials) m.opacity = pose.opacity;

        const st = shared.current;
        st.ballX = pose.x; st.ballY = pose.y; st.ballZ = pose.z;
        st.ballScale = pose.scale; st.ballOpacity = pose.opacity; st.ballGap = pose.gap;
    });

    return (
        <group ref={groupRef}>
            <group rotation={modelRotation}>
                <group scale={scale} position={offset}>
                    <primitive object={root} />
                </group>
            </group>
        </group>
    );
};

class ModelBoundary extends Component<
    { fallback: ReactNode; children: ReactNode }, { failed: boolean }
> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch(error: unknown) {
        console.warn('[Intro] Modèle de ballon indisponible → ballon procédural.', error);
    }
    render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

const Loaded = ({ onLoaded }: { onLoaded?: () => void }) => {
    useEffect(() => { onLoaded?.(); }, [onLoaded]);
    return null;
};

interface BasketballAutoProps {
    timeRef: MutableRefObject<number>;
    quality?: number;
    modelUrl?: string;
    modelRotation?: [number, number, number];
    envIntensity?: number;
    onLoaded?: () => void;
}

export const BasketballAuto = ({
    timeRef, quality = 1, modelUrl, modelRotation, envIntensity, onLoaded,
}: BasketballAutoProps) => {
    const procedural = (
        <>
            <Basketball timeRef={timeRef} quality={quality} />
            <Loaded onLoaded={onLoaded} />
        </>
    );
    if (!modelUrl) return procedural;

    return (
        <ModelBoundary fallback={procedural}>
            <Suspense fallback={null}>
                <BallModel url={modelUrl} timeRef={timeRef}
                    modelRotation={modelRotation} envIntensity={envIntensity} />
                <Loaded onLoaded={onLoaded} />
            </Suspense>
        </ModelBoundary>
    );
};