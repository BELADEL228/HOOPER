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
  private static cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
  private static apiKey = process.env.CLOUDINARY_API_KEY || '';
  private static apiSecret = process.env.CLOUDINARY_API_SECRET || '';
  private static uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || '';

  /**
   * Vérifie si Cloudinary est configuré dans l'environnement
   */
  public static isConfigured(): boolean {
    return Boolean(
      (this.cloudName && this.apiKey && this.apiSecret) ||
      (this.cloudName && this.uploadPreset)
    );
  }

  /**
   * Upload d'un fichier (base64 ou Buffer) vers Cloudinary
   * avec fallback automatique sur le stockage local si non configuré
   */
  public static async uploadMedia(
    fileData: string, // Base64 data URL ou URL
    folder = 'firestone',
    resourceType: 'image' | 'video' | 'auto' = 'auto'
  ): Promise<CloudinaryUploadResult> {
    // Si Cloudinary est configuré, on upload vers Cloudinary
    if (this.isConfigured()) {
      try {
        return await this.uploadToCloudinary(fileData, folder, resourceType);
      } catch (err: any) {
        console.warn('[CloudinaryService] Erreur upload Cloudinary, fallback local:', err?.message);
      }
    }

    // Fallback stockage local
    return await this.saveLocally(fileData, folder);
  }

  /**
   * Upload direct via l'API REST Cloudinary (sans SDK lourd)
   */
  private static async uploadToCloudinary(
    fileData: string,
    folder: string,
    resourceType: 'image' | 'video' | 'auto'
  ): Promise<CloudinaryUploadResult> {
    const timestamp = Math.round(Date.now() / 1000);
    const targetType = resourceType === 'auto' ? 'auto' : resourceType;
    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/${targetType}/upload`;

    const formData = new FormData();
    formData.append('file', fileData);
    formData.append('folder', folder);
    formData.append('timestamp', String(timestamp));

    if (this.uploadPreset) {
      formData.append('upload_preset', this.uploadPreset);
    } else if (this.apiKey && this.apiSecret) {
      formData.append('api_key', this.apiKey);

      // Génération de la signature Cloudinary : tri alphabétique des paramètres
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
      throw new Error(`Cloudinary HTTP ${response.status}: ${errText}`);
    }

    const json = (await response.json()) as any;

    return {
      url: json.url,
      secure_url: json.secure_url,
      publicId: json.public_id,
      resourceType: json.resource_type || 'image',
      format: json.format,
      bytes: json.bytes,
      width: json.width,
      height: json.height,
    };
  }

  /**
   * Sauvegarde locale en cas d'absence de configuration Cloudinary
   */
  private static async saveLocally(
    fileData: string,
    folder: string
  ): Promise<CloudinaryUploadResult> {
    // Si c'est déjà une URL distante (https://...), on la conserve
    if (fileData.startsWith('http://') || fileData.startsWith('https://')) {
      return {
        url: fileData,
        secure_url: fileData,
        publicId: `remote_${Date.now()}`,
        resourceType: fileData.endsWith('.mp4') ? 'video' : 'image',
      };
    }

    // Répertoire local /uploads
    const uploadsDir = path.resolve(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Détection type MIME
    let extension = 'jpg';
    let resourceType: 'image' | 'video' = 'image';

    if (fileData.startsWith('data:video/')) {
      extension = 'mp4';
      resourceType = 'video';
    } else if (fileData.startsWith('data:image/png')) {
      extension = 'png';
    } else if (fileData.startsWith('data:image/webp')) {
      extension = 'webp';
    } else if (fileData.startsWith('data:image/gif')) {
      extension = 'gif';
    }

    const rawBase64 = fileData.replace(/^data:[a-zA-Z0-9/]+;base64,/, '');
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
