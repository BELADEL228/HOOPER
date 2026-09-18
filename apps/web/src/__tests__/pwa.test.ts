/**
 * Tests unitaires des utilitaires PWA et de la configuration Manifest.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { isPwaInstalled, isIosDevice } from '../pwa/registerServiceWorker';
import fs from 'node:fs';
import path from 'node:path';

describe('PWA — isPwaInstalled()', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('retourne false par défaut dans un navigateur classique', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(isPwaInstalled()).toBe(false);
  });

  it('retourne true si display-mode: standalone est actif', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('standalone'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(isPwaInstalled()).toBe(true);
  });

  it('retourne true si navigator.standalone est true (iOS standalone)', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window.navigator, 'standalone', {
      value: true,
      configurable: true,
    });

    expect(isPwaInstalled()).toBe(true);
  });
});

describe('PWA — isIosDevice()', () => {
  it('détecte un iPhone', () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15'
    );
    expect(isIosDevice()).toBe(true);
  });

  it('détecte un iPad', () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15'
    );
    expect(isIosDevice()).toBe(true);
  });

  it('retourne false pour Android', () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36'
    );
    expect(isIosDevice()).toBe(false);
  });

  it('retourne false pour Windows Desktop', () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );
    expect(isIosDevice()).toBe(false);
  });
});

describe('PWA — Validation du Manifest (public/manifest.webmanifest)', () => {
  it('le fichier manifest.webmanifest existe et est du JSON valide', () => {
    const manifestPath = path.resolve(process.cwd(), 'public/manifest.webmanifest');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(raw);

    expect(manifest).toHaveProperty('name', 'FIRE STONE Basketball Club');
    expect(manifest).toHaveProperty('short_name', 'FIRE STONE');
    expect(manifest).toHaveProperty('display', 'standalone');
    expect(manifest).toHaveProperty('theme_color', '#FF2A3B');
    expect(manifest).toHaveProperty('background_color', '#090A0F');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(manifest.shortcuts)).toBe(true);
    expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(4);
  });

  it('les icônes référencées dans le manifest existent sur le disque', () => {
    const manifestPath = path.resolve(process.cwd(), 'public/manifest.webmanifest');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    for (const icon of manifest.icons) {
      const relativePath = icon.src.replace(/^\//, '');
      const iconPath = path.resolve(process.cwd(), 'public', relativePath);
      expect(fs.existsSync(iconPath)).toBe(true);
    }
  });

  it('le fichier Service Worker public/sw.js existe et contient le cache name', () => {
    const swPath = path.resolve(process.cwd(), 'public/sw.js');
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, 'utf-8');
    expect(swContent).toContain('firestone-pwa-v1');
    expect(swContent).toContain('addEventListener');
  });
});
