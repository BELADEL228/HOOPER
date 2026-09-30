import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

/** Rayon du rond central (le ballon doit rester bien à l'intérieur) */
const CIRCLE_RADIUS = 2.2;
/** Épaisseur des lignes (unités monde) */
const LINE_WIDTH = 0.09;
/** Demi-longueur de la ligne médiane */
const CENTER_LINE_HALF = 5.5;

const LINE_Y = 0.003;                 // au-dessus du parquet (0), SOUS la vignette (0.004)
const LINE_COLOR = 0xf4efe6;
const LINE_OPACITY = 0.92;

interface CourtLinesProps {
    visible?: boolean;
    opacity?: number;
}

export const CourtLines = ({ visible = true, opacity = 1 }: CourtLinesProps) => {
    const ringGeo = useMemo(
        () => new THREE.RingGeometry(CIRCLE_RADIUS - LINE_WIDTH / 2, CIRCLE_RADIUS + LINE_WIDTH / 2, 160),
        [],
    );
    const lineGeo = useMemo(
        () => new THREE.PlaneGeometry(LINE_WIDTH, CENTER_LINE_HALF * 2),
        [],
    );

    useEffect(() => () => {
        ringGeo.dispose();
        lineGeo.dispose();
    }, [ringGeo, lineGeo]);

    const material = (
        <meshBasicMaterial
            color={LINE_COLOR}
            transparent
            opacity={LINE_OPACITY * opacity}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
        />
    );

    return (
        <group visible={visible} position={[0, LINE_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            {/* renderOrder : après le parquet (-4), AVANT la vignette (-2) qui les assombrit */}
            <mesh renderOrder={-3}>
                <primitive object={ringGeo} attach="geometry" />
                {material}
            </mesh>
            <mesh renderOrder={-3}>
                <primitive object={lineGeo} attach="geometry" />
                {material}
            </mesh>
        </group>
    );
};