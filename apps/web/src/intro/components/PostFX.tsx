import { useEffect, useMemo, useRef, type JSX, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    EffectComposer, Bloom, DepthOfField, Vignette, Noise, ChromaticAberration, ToneMapping,
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode, type DepthOfFieldEffect } from 'postprocessing';
import { useIntroState } from '../timeline/IntroContext';
import { clamp01 } from '../timeline/timeline';
import type { QualityTier } from '../timeline/qualityTiers';

interface PostFXProps {
    timeRef: MutableRefObject<number>;
    tier: QualityTier;
}

export const PostFX = ({ timeRef, tier }: PostFXProps) => {
    const shared = useIntroState();
    const dofRef = useRef<DepthOfFieldEffect>(null);
    const focus = useMemo(() => new THREE.Vector3(), []);
    const caOffset = useMemo(() => new THREE.Vector2(0.0004, 0.0004), []);

    useEffect(() => {
        if (dofRef.current) dofRef.current.target = focus;
    });

    useFrame(() => {
        const dof = dofRef.current;
        if (!dof) return;
        const t = timeRef.current;
        const s = shared.current;
        focus.set(s.ballX, s.ballY, s.ballZ);
        dof.bokehScale = 0.8 + 1.0 * (1 - clamp01((t - 2.5) / 3.0));
    });

    const effects: JSX.Element[] = [];
    if (tier.dof) {
        effects.push(
            <DepthOfField key="dof" ref={dofRef} focalLength={0.05} bokehScale={2}
                worldFocusRange={3.2} height={tier.dofHeight} />,
        );
    }
    effects.push(
        <Bloom key="bloom" intensity={0.55} luminanceThreshold={1.0} luminanceSmoothing={0.3} mipmapBlur />,
    );
    if (tier.chromatic) {
        effects.push(
            <ChromaticAberration key="ca" offset={caOffset} radialModulation={false} modulationOffset={0} />,
        );
    }
    if (tier.noise) {
        effects.push(<Noise key="noise" premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.28} />);
    }
    effects.push(<Vignette key="vig" offset={0.28} darkness={0.75} />);
    effects.push(<ToneMapping key="tm" mode={ToneMappingMode.ACES_FILMIC} />);

    return (
        <EffectComposer key={`${tier.name}-${tier.msaa}`} multisampling={tier.msaa}>
            {effects}
        </EffectComposer>
    );
};