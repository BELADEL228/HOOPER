import { apiUrl } from './api';

export interface UploadResult {
  url: string;
  secure_url?: string;
  publicId?: string;
  resourceType: 'IMAGE' | 'VIDEO';
  format?: string;
  bytes?: number;
}

const getAuthToken = (): string => {
  try {
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    return session?.token || '';
  } catch {
    return '';
  }
};

/**
 * Lit un fichier en base64 pour transmission à l'API d'upload
 */
const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Service d'upload média universel (Cloudinary avec fallback serveur)
 */
export const uploadMedia = async (
  file: File,
  folder = 'firestone',
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  onProgress?.(15);
  const base64 = await readFileAsBase64(file);
  onProgress?.(45);

  const token = getAuthToken();
  const resourceType = file.type.startsWith('video/') ? 'video' : 'image';

  const response = await fetch(apiUrl('/upload'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      file: base64,
      folder,
      resourceType,
    }),
  });

  onProgress?.(85);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Upload failed (HTTP ${response.status}): ${errText}`);
  }

  const data = await response.json();
  onProgress?.(100);

  // Normalisation URL (si relative /uploads/..., la préfixer par le serveur si besoin)
  let finalUrl = data.secure_url || data.url;
  if (finalUrl.startsWith('/uploads/')) {
    // Si c'est une URL locale relative, on utilise apiUrl
    const baseUrl = apiUrl('').replace(/\/api\/?$/, '');
    finalUrl = `${baseUrl}${finalUrl}`;
  }

  return {
    url: finalUrl,
    secure_url: finalUrl,
    publicId: data.publicId,
    resourceType: resourceType === 'video' ? 'VIDEO' : 'IMAGE',
    format: data.format,
    bytes: data.bytes,
  };
};
