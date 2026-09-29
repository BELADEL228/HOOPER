import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface CloudinaryUploadResult {
  url: string;
  secure_url: string;
  publicId: string;
  resourceType: 'image' | 'video' | 'raw';
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
}

export class CloudinaryService {
  /**
   * Nom du cloud Cloudinary (récupéré dynamiquement depuis l'environnement)
   */
  public static get cloudName(): string {
    if (process.env.CLOUDINARY_URL) {
      try {
        const u = new URL(process.env.CLOUDINARY_URL);
        return u.hostname || '';
      } catch {}
    }
    return process.env.CLOUDINARY_CLOUD_NAME || '';
  }

  /**
   * Clé API Cloudinary
   */
  public static get apiKey(): string {
    if (process.env.CLOUDINARY_URL) {
      try {
        const u = new URL(process.env.CLOUDINARY_URL);
        return u.username || '';
      } catch {}
    }
    return process.env.CLOUDINARY_API_KEY || '';
  }

  /**
   * Secret API Cloudinary
   */
  public static get apiSecret(): string {
    if (process.env.CLOUDINARY_URL) {
      try {
        const u = new URL(process.env.CLOUDINARY_URL);
        return u.password || '';
      } catch {}
    }
    return process.env.CLOUDINARY_API_SECRET || '';
  }

  /**
   * Upload preset éventuel (pour uploads non signés)
   */
  public static get uploadPreset(): string {
    return process.env.CLOUDINARY_UPLOAD_PRESET || '';
  }

  /**
   * Vérifie si Cloudinary est configuré dans l'environnement
   */
  public static isConfigured(): boolean {
    const cn = this.cloudName;
    const ak = this.apiKey;
    const as = this.apiSecret;
    const up = this.uploadPreset;
    return Boolean((cn && ak && as) || (cn && up));
  }

  /**
   * Upload d'un fichier (base64 ou URL) vers Cloudinary
   * Si Cloudinary n'est pas configuré du tout, bascule vers le stockage local de secours.
   */
  public static async uploadMedia(
    fileData: string, // Base64 data URL ou URL
    folder = 'firestone',
    resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
  ): Promise<CloudinaryUploadResult> {
    if (!fileData) {
      throw new Error('Données de fichier manquantes pour l\'upload.');
    }

    // Si Cloudinary est configuré, on upload obligatoirement vers Cloudinary
    if (this.isConfigured()) {
      return await this.uploadToCloudinary(fileData, folder, resourceType);
    }

    // Fallback stockage local uniquement si non configuré
    console.warn('[CloudinaryService] ⚠️ Cloudinary non configuré dans l\'environnement, fallback sur stockage local.');
    return await this.saveLocally(fileData, folder);
  }

  /**
   * Upload direct via l'API REST Cloudinary sécurisée
   */
  private static async uploadToCloudinary(
    fileData: string,
    folder: string,
    resourceType: 'image' | 'video' | 'raw' | 'auto'
  ): Promise<CloudinaryUploadResult> {
    const timestamp = Math.round(Date.now() / 1000);

    // Détermination précise du type de ressource
    let targetType: 'image' | 'video' | 'raw' | 'auto' = resourceType;
    if (resourceType === 'auto') {
      if (fileData.startsWith('data:video/')) {
        targetType = 'video';
      } else if (fileData.startsWith('data:application/pdf') || fileData.startsWith('data:text/')) {
        targetType = 'raw';
      } else {
        targetType = 'image';
      }
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/${targetType}/upload`;

    const formData = new FormData();
    formData.append('file', fileData);
    formData.append('folder', folder);
    formData.append('timestamp', String(timestamp));

    if (this.uploadPreset) {
      formData.append('upload_preset', this.uploadPreset);
    } else if (this.apiKey && this.apiSecret) {
      formData.append('api_key', this.apiKey);

      // Signature Cloudinary : tri alphabétique strict des paramètres + api_secret
      const paramsToSign = `folder=${folder}&timestamp=${timestamp}${this.apiSecret}`;
      const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');
      formData.append('signature', signature);
    }

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedError = errText;
      try {
        const jsonErr = JSON.parse(errText);
        parsedError = jsonErr.error?.message || errText;
      } catch {}
      console.error(`[CloudinaryService] Erreur API Cloudinary HTTP ${response.status}:`, parsedError);
      throw new Error(`Cloudinary HTTP ${response.status}: ${parsedError}`);
    }

    const json = (await response.json()) as any;

    return {
      url: json.url,
      secure_url: json.secure_url || json.url,
      publicId: json.public_id,
      resourceType: json.resource_type || (targetType === 'raw' ? 'raw' : targetType === 'video' ? 'video' : 'image'),
      format: json.format,
      bytes: json.bytes,
      width: json.width,
      height: json.height,
    };
  }

  /**
   * Sauvegarde locale de secours en cas d'absence de configuration Cloudinary
   */
  private static async saveLocally(
    fileData: string,
    folder: string
  ): Promise<CloudinaryUploadResult> {
    // Si c'est déjà une URL distante (http://... ou https://...), on la conserve telle quelle
    if (fileData.startsWith('http://') || fileData.startsWith('https://')) {
      return {
        url: fileData,
        secure_url: fileData,
        publicId: `remote_${Date.now()}`,
        resourceType: fileData.endsWith('.mp4') ? 'video' : 'image',
      };
    }

    const uploadsDir = path.resolve(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let extension = 'jpg';
    let resourceType: 'image' | 'video' | 'raw' = 'image';

    if (fileData.startsWith('data:video/')) {
      extension = 'mp4';
      resourceType = 'video';
    } else if (fileData.startsWith('data:image/png')) {
      extension = 'png';
    } else if (fileData.startsWith('data:image/webp')) {
      extension = 'webp';
    } else if (fileData.startsWith('data:image/gif')) {
      extension = 'gif';
    } else if (fileData.startsWith('data:application/pdf')) {
      extension = 'pdf';
      resourceType = 'raw';
    }

    const rawBase64 = fileData.replace(/^data:[a-zA-Z0-9/-]+;base64,/, '');
    const buffer = Buffer.from(rawBase64, 'base64');

    const fileName = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${extension}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/${folder}/${fileName}`;

    return {
      url: relativeUrl,
      secure_url: relativeUrl,
      publicId: `${folder}/${fileName}`,
      resourceType,
      bytes: buffer.length,
    };
  }
}
