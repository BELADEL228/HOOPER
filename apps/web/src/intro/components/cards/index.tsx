// components/cards/index.tsx
import { GlassCard } from '../GlassCard';
import { HudText } from '../HudText';

/* ═══════════════════════════════════════════════════════════════════════════
 *  STRUCTURE INTERNE COMMUNE
 * ═══════════════════════════════════════════════════════════════════════════ */

interface CardProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    opacity?: number;
}

const CardTitle = ({
    children,
    accent = '#FFB800',
    y = 0.32,
}: {
    children: string;
    accent?: string;
    y?: number;
}) => (
    <HudText
        position={[-0.56, y, 0.004]}
        fontSize={0.075}
        color={accent}
        opacity={0.95}
        anchorX="left"
        anchorY="middle"
        letterSpacing={0.22}
        fontWeight={700}
    >
        {children}
    </HudText>
);

const CardBody = ({
    children,
    y,
}: {
    children: string;
    y: number;
}) => (
    <HudText
        position={[-0.56, y, 0.004]}
        fontSize={0.11}
        color="#FFFFFF"
        opacity={0.9}
        anchorX="left"
        anchorY="middle"
        letterSpacing={0.02}
        fontWeight={600}
    >
        {children}
    </HudText>
);

const CardMeta = ({
    children,
    y,
}: {
    children: string;
    y: number;
}) => (
    <HudText
        position={[-0.56, y, 0.004]}
        fontSize={0.07}
        color="#A0A0A0"
        opacity={0.85}
        anchorX="left"
        anchorY="middle"
        letterSpacing={0.02}
        fontWeight={500}
    >
        {children}
    </HudText>
);

/* ═══════════════════════════════════════════════════════════════════════════
 *  6 CARTES HOOPERS
 * ═══════════════════════════════════════════════════════════════════════════ */

export const PlayerCard = (p: CardProps) => (
    <GlassCard {...p} width={1.5} height={0.95} borderColor="#FFB800">
        <CardTitle accent="#FFB800">PLAYER PROFILE</CardTitle>
        <CardBody y={0.12}>MARC D.</CardBody>
        <CardMeta y={-0.05}>GUARD · 24 ANS</CardMeta>
        <CardMeta y={-0.22}>RATING 92</CardMeta>
    </GlassCard>
);

export const FeedCard = (p: CardProps) => (
    <GlassCard {...p} width={1.5} height={0.95} borderColor="#FF2A3B">
        <CardTitle accent="#FF2A3B">FEED</CardTitle>
        <CardBody y={0.12}>3-PT CONTEST</CardBody>
        <CardMeta y={-0.05}>+128 LIKES · 2H</CardMeta>
        <CardMeta y={-0.22}>CLIP · 0:12</CardMeta>
    </GlassCard>
);

export const ClubCard = (p: CardProps) => (
    <GlassCard {...p} width={1.5} height={0.95} borderColor="#FFB800">
        <CardTitle accent="#FFB800">CLUB</CardTitle>
        <CardBody y={0.12}>PARIS ELITE</CardBody>
        <CardMeta y={-0.05}>12 JOUEURS · D1</CardMeta>
        <CardMeta y={-0.22}>NEXT · VEN 20:00</CardMeta>
    </GlassCard>
);

export const MessageCard = (p: CardProps) => (
    <GlassCard {...p} width={1.5} height={0.95} borderColor="#FFB800">
        <CardTitle accent="#FFB800">MESSAGES</CardTitle>
        <CardBody y={0.12}>COACH · 3 NEW</CardBody>
        <CardMeta y={-0.05}>"Bon tir hier."</CardMeta>
        <CardMeta y={-0.22}>VU · IL Y A 8 MIN</CardMeta>
    </GlassCard>
);

export const StoryCard = (p: CardProps) => (
    <GlassCard {...p} width={1.5} height={0.95} borderColor="#FF2A3B">
        <CardTitle accent="#FF2A3B">STORIES</CardTitle>
        <CardBody y={0.12}>4 NOUVELLES</CardBody>
        <CardMeta y={-0.05}>SUIVIS · 12</CardMeta>
        <CardMeta y={-0.22}>DEPUIS 6H</CardMeta>
    </GlassCard>
);

export const StatsCard = (p: CardProps) => (
    <GlassCard {...p} width={1.5} height={0.95} borderColor="#FFB800">
        <CardTitle accent="#FFB800">STATISTICS</CardTitle>
        <CardBody y={0.12}>PPG  24.6</CardBody>
        <CardMeta y={-0.05}>APG  6.2 · RPG 4.8</CardMeta>
        <CardMeta y={-0.22}>FG% 51.2</CardMeta>
    </GlassCard>
);