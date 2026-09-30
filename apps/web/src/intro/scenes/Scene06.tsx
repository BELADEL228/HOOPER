// scenes/Scene06.tsx — HUD sportif complet (6.8-9.5 s)
import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { localProgress, SCENES, easeOutCubic } from '../timeline/timeline';
import { HudText } from '../components/HudText';
import { HudLine } from '../components/HudLine';

const LABELS = [
    { label: 'PLAYER', value: 'ACTIVE', color: '#FFB800' },
    { label: 'CLUB', value: 'PARIS', color: '#FFFFFF' },
    { label: 'LEVEL', value: 'PRO', color: '#FFB800' },
    { label: 'STATS', value: 'LIVE', color: '#FF2A3B' },
    { label: 'GAME', value: 'T-24H', color: '#FFFFFF' },
    { label: 'COMMUNITY', value: '4.2K', color: '#FFB800' },
];

export const Scene06 = ({ time }: { time: number }) => {
    const p = localProgress(time, SCENES.S06.start, SCENES.S06.end);
    const fade = p > 0.85 ? 1 - (p - 0.85) / 0.15 : 1;

    /* ⚡ Adaptation mobile : grille plus compacte sur petit écran */
    const { size } = useThree();
    const compact = size.width < 768;
    const xBase = compact ? 0.9 : 1.9;
    const xStep = compact ? 0.9 : 1.55;
    const yBase = compact ? 1.4 : 2.1;
    const yStep = compact ? 0.4 : 0.55;
    const fsLabel = compact ? 0.06 : 0.075;
    const fsValue = compact ? 0.12 : 0.16;

    const cells = useMemo(() => LABELS, []);

    return (
        <group visible={fade > 0.01}>
            {cells.map((cell, i) => {
                const col = i % 2;
                const row = Math.floor(i / 2);
                const delay = col * 0.1 + row * 0.12;
                const local = Math.max(0, Math.min(1, (p - delay) / 0.35));
                const o = easeOutCubic(local) * fade;

                const x = xBase + col * xStep;
                const y = yBase - row * yStep;

                return (
                    <group key={cell.label} position={[x, y, 1.3]} visible={o > 0.01}>
                        <HudLine
                            from={[-0.45, 0, 0]}
                            to={[0.45, 0, 0]}
                            color={0xffffff}
                            opacity={o * 0.25}
                        />
                        <HudText
                            position={[-0.45, 0.13, 0.001]}
                            fontSize={fsLabel}
                            color="#A0A0A0"
                            opacity={o * 0.85}
                            letterSpacing={0.22}
                            fontWeight={500}
                        >
                            {cell.label}
                        </HudText>
                        <HudText
                            position={[-0.45, -0.06, 0.001]}
                            fontSize={fsValue}
                            color={cell.color}
                            opacity={o}
                            letterSpacing={0.06}
                            fontWeight={700}
                        >
                            {cell.value}
                        </HudText>
                    </group>
                );
            })}
        </group>
    );
};