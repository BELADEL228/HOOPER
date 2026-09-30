# Intro Hoopers — V2 (réalisme)

## Installation
    npm i @react-three/postprocessing postprocessing
Testé avec : react 18, three 0.169, @react-three/fiber 8, @react-three/drei 9,
@react-three/postprocessing 2, postprocessing 6.
(R3F 9 → prendre @react-three/postprocessing 3.)

## Fichiers nouveaux
- timeline/ballMotion.ts     trajectoire du ballon (gravité, 3 rebonds, roulement, squash & stretch, lévitation)
- components/ContactShadow.tsx  ombre de contact qui suit la hauteur du ballon
- components/PostFX.tsx      bloom, profondeur de champ, aberration chromatique, grain, vignette, ACES

## Fichiers modifiés
- Intro.tsx            horloge exacte (timeRef) + rendu React ~30 Hz, brume, poussière, fondu avant logo, prop `debugTime`
- camera/CameraRig.tsx spline PCHIP (vitesse continue) + handheld léger
- components/Basketball.tsx  mouvement piloté par ballMotion ; correctif texture noire
- components/BasketballCourt.tsx  correctif parquet invisible ; reflets (MeshReflectorMaterial, desktop) ; parquet plus satiné
- components/BasketballSeams.tsx  coutures qui suivent l'opacité du ballon
- components/HudLine.tsx, HudCircle.tsx  fuite mémoire corrigée (géométrie recréée à chaque frame)
- timeline/IntroContext.tsx  + ballY, ballGap
- timeline/timeline.ts  + helpers (noise1, easeOutBack, smootherstep…)
- scenes/Scene02.tsx (HUD suit le ballon), Scene07/08 (cartes recadrées)

## Bug corrigé n°1
`releaseCanvas()` mettait le canvas en 1×1 avant le premier rendu → texture vide
→ ballon noir, parquet invisible. Désormais no-op.

## Debug
    <Intro debugTime={8.5} />   // fige l'intro à 8,5 s pour régler une scène

## Réglages rapides
- Rebonds : G, H0, RESTITUTION dans ballMotion.ts
- Flou d'arrière-plan : bokehScale (PostFX.tsx)
- Reflets parquet : mirror / mixStrength (BasketballCourt.tsx) ou reflective={false}
- Trop lourd ? passer isMobile=true force la version légère
