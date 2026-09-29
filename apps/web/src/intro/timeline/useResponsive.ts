import { useEffect, useState } from 'react';

interface ResponsiveInfo {
    width: number;
    height: number;
    isMobile: boolean;
    isPortrait: boolean;
    aspect: number;
    quality: number;
}

const getInfo = (): ResponsiveInfo => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const h = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const isMobile = w < 768;
    const isPortrait = h > w;
    const aspect = w / h;

    let quality = 1;
    if (isMobile) quality = w < 400 ? 0.4 : 0.6;
    else if (w < 1200) quality = 0.85;

    return { width: w, height: h, isMobile, isPortrait, aspect, quality };
};

export const useResponsive = (): ResponsiveInfo => {
    const [info, setInfo] = useState<ResponsiveInfo>(getInfo);

    useEffect(() => {
        let raf: number | null = null;
        const handle = () => {
            if (raf !== null) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => setInfo(getInfo()));
        };
        window.addEventListener('resize', handle);
        window.addEventListener('orientationchange', handle);
        return () => {
            window.removeEventListener('resize', handle);
            window.removeEventListener('orientationchange', handle);
            if (raf !== null) cancelAnimationFrame(raf);
        };
    }, []);

    return info;
};