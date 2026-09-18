import { useEffect, useState, type ReactNode } from 'react';

/** Turns legacy bare base64 values into a browser-readable image URL. */
export const toLogoImageSrc = (logoUrl?: string | null): string | null => {
  const value = logoUrl?.trim();
  if (!value) return null;
  if (value.startsWith('data:image/') || value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) return value;
  if (value.length > 128 && /^[A-Za-z0-9+/=\r\n]+$/.test(value)) return `data:image/jpeg;base64,${value.replace(/\s/g, '')}`;
  return null;
};

export function ClubLogo({ logoUrl, alt, className, fallback }: { logoUrl?: string | null; alt: string; className: string; fallback: ReactNode }) {
  const src = toLogoImageSrc(logoUrl);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return src && !failed ? <img src={src} alt={alt} className={className} onError={() => setFailed(true)} /> : <>{fallback}</>;
}
