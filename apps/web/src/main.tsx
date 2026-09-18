import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App.tsx';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
// ─────────────────────────────────────────────
// GSAP — Enregistrement des plugins
// ─────────────────────────────────────────────
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Observer } from 'gsap/Observer';

gsap.registerPlugin(ScrollTrigger, Observer);

// Config GSAP globale
gsap.defaults({
  ease: 'power2.out',
  duration: 0.8,
});

// Optimisation GPU en production
if (import.meta.env.PROD) {
  gsap.config({ force3D: true });
}

// ─────────────────────────────────────────────
// PWA — Service Worker
// ─────────────────────────────────────────────
registerServiceWorker({
  onSuccess: () =>
    console.log('🔥 [PWA] Service Worker FIRE STONE prêt pour le mode hors-ligne.'),
  onUpdate: () =>
    console.log('🔄 [PWA] Nouvelle version de FIRE STONE disponible.'),
});

// ─────────────────────────────────────────────
// React — Montage
// ─────────────────────────────────────────────
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary scope="Application">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);