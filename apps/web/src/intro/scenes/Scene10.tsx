// scenes/Scene10.tsx — Respiration, effacement (29-31s)
import { localProgress, SCENES, easeInOutCubic } from '../timeline/timeline';

export const Scene10 = ({ time }: { time: number }) => {
    const p = localProgress(time, SCENES.S10.start, SCENES.S10.end);
    const eased = easeInOutCubic(p);

    // Assombrissement progressif du fond via un grand plan noir
    return (
        <mesh position={[0, 0, 3.5]} renderOrder={999}>
            <planeGeometry args={[30, 20]} />
            <meshBasicMaterial
                color={0x000000}
                transparent
                opacity={0.7 * eased}
                depthWrite={false}
            />
        </mesh>
    );
};