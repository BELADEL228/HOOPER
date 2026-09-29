// components/HudText.tsx
import { Text } from '@react-three/drei';

interface HudTextProps {
    children: string;
    position: [number, number, number];
    fontSize?: number;
    color?: string;
    opacity?: number;
    anchorX?: 'left' | 'center' | 'right';
    anchorY?: 'top' | 'middle' | 'bottom';
    letterSpacing?: number;
    fontWeight?: number;
}

export const HudText = ({
    children,
    position,
    fontSize = 0.14,
    color = '#FFFFFF',
    opacity = 1,
    anchorX = 'left',
    anchorY = 'middle',
    letterSpacing = 0.08,
    fontWeight = 500,
}: HudTextProps) => (
    <Text
        position={position}
        fontSize={fontSize}
        color={color}
        fillOpacity={opacity}
        anchorX={anchorX}
        anchorY={anchorY}
        letterSpacing={letterSpacing}
        fontWeight={fontWeight}
        outlineWidth={0}
    >
        {children}
    </Text>
);