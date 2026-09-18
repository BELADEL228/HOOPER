import type { ThemeTokens } from '../types';

type Rgb = [number, number, number];

const toHex = ([r, g, b]: Rgb) => `#${[r, g, b].map((value) => Math.round(value).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
const luminance = ([r, g, b]: Rgb) => {
  const channels = [r, g, b].map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};
const distance = (a: Rgb, b: Rgb) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const saturation = ([r, g, b]: Rgb) => Math.max(r, g, b) - Math.min(r, g, b);
const contrastText = (color: Rgb) => luminance(color) > 0.42 ? '#0F172A' : '#FFFFFF';

const rgbToHsl = ([r, g, b]: Rgb): [number, number, number] => {
  const [red, green, blue] = [r, g, b].map((value) => value / 255);
  const max = Math.max(red, green, blue); const min = Math.min(red, green, blue); const delta = max - min;
  let hue = 0;
  if (delta) hue = ((max === red ? (green - blue) / delta : max === green ? (blue - red) / delta + 2 : (red - green) / delta + 4) * 60 + 360) % 360;
  const lightness = (max + min) / 2;
  return [hue, delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0, lightness];
};

const hslToRgb = (hue: number, saturationValue: number, lightness: number): Rgb => {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturationValue;
  const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1)); const m = lightness - chroma / 2;
  const [r, g, b] = hue < 60 ? [chroma, x, 0] : hue < 120 ? [x, chroma, 0] : hue < 180 ? [0, chroma, x] : hue < 240 ? [0, x, chroma] : hue < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
};

const derivedColour = (base: Rgb, shift: number): Rgb => {
  const [hue, saturationValue, lightness] = rgbToHsl(base);
  return hslToRgb((hue + shift) % 360, Math.max(0.58, saturationValue), lightness > 0.62 ? 0.42 : 0.58);
};

/** Extract a stable palette locally. It deliberately avoids network/AI-service availability. */
export const analyzeLogoFile = async (file: File): Promise<ThemeTokens> => {
  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image(); element.onload = () => resolve(element); element.onerror = () => reject(new Error('Logo illisible.'));
      element.src = imageUrl;
    });
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Analyse de pixels indisponible.');
    context.drawImage(image, 0, 0, 128, 128);
    const data = context.getImageData(0, 0, 128, 128).data;
    const buckets = new Map<string, { count: number; sum: Rgb }>();

    for (let index = 0; index < data.length; index += 16) {
      const rgb: Rgb = [data[index], data[index + 1], data[index + 2]];
      if (data[index + 3] < 80) continue;
      const max = Math.max(...rgb); const min = Math.min(...rgb);
      // Ignore common transparent-canvas leftovers, pure white and black framing.
      if ((max > 245 && max - min < 15) || (max < 18 && max - min < 12)) continue;
      const key = rgb.map((value) => Math.floor(value / 32)).join('-');
      const bucket = buckets.get(key) || { count: 0, sum: [0, 0, 0] };
      bucket.count += 1; bucket.sum = [bucket.sum[0] + rgb[0], bucket.sum[1] + rgb[1], bucket.sum[2] + rgb[2]];
      buckets.set(key, bucket);
    }

    const colours = [...buckets.values()].map(({ count, sum }) => ({ count, rgb: [sum[0] / count, sum[1] / count, sum[2] / count] as Rgb }));
    if (!colours.length) throw new Error('Le logo ne contient pas assez de couleur exploitable.');
    const ranked = [...colours].sort((a, b) => (b.count * (0.35 + saturation(b.rgb) / 255)) - (a.count * (0.35 + saturation(a.rgb) / 255)));
    const primary = ranked[0].rgb;
    const secondary = ranked.find((item) => distance(primary, item.rgb) > 78)?.rgb || derivedColour(primary, 35);
    const accent = ranked.find((item) => distance(primary, item.rgb) > 135 && distance(secondary, item.rgb) > 70)?.rgb || derivedColour(primary, 190);
    const primaryHex = toHex(primary); const secondaryHex = toHex(secondary); const accentHex = toHex(accent);
    const background = '#090A0F'; const surface = '#121621';

    return {
      primary: primaryHex, secondary: secondaryHex, accent: accentHex, background, surface,
      textPrimary: '#FFFFFF', textSecondary: '#CBD5E1', border: primaryHex,
      gradient: `linear-gradient(135deg, ${primaryHex} 0%, ${secondaryHex} 100%)`,
      matchdayGradient: `radial-gradient(circle at 20% 20%, ${primaryHex}55 0%, ${background} 75%)`,
      shadow: `0 16px 40px ${primaryHex}55`, glow: `0 0 24px ${accentHex}66`, themeType: 'dark',
      palette: [primaryHex, secondaryHex, accentHex, surface, '#FFFFFF'],
      contrastRatio: Number(((1.05) / (luminance(primary) + 0.05)).toFixed(2)),
      homeKit: { jerseyBase: primaryHex, jerseyTrims: secondaryHex, jerseyAccent: accentHex, textColor: contrastText(primary), shortsBase: primaryHex, pattern: 'gradient' },
      awayKit: { jerseyBase: '#F8FAFC', jerseyTrims: primaryHex, jerseyAccent: secondaryHex, textColor: '#0F172A', shortsBase: '#F8FAFC', pattern: 'stripes' },
    };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
};
