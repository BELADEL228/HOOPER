// ✅ Détection intelligente :
// - Si VITE_API_URL est défini → on l'utilise
// - Sinon → on utilise l'IP du navigateur (pour mobile/network)
// - Sinon → localhost (dev local)
const getApiBaseUrl = (): string => {
    const configured = import.meta.env.VITE_API_URL?.trim();
    if (configured) return configured;

    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;

        // ✅ En dev, on réutilise l'IP du frontend avec le port 5000
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            return `${protocol}//${hostname}:5000/api`;
        }
    }

    return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const apiUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;