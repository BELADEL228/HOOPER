import type { Request, Response } from 'express';
import { CloudinaryService } from '../services/cloudinary.service';

export class UploadController {
  /**
   * POST /api/upload
   * Accepte un payload { file: string (base64 ou url), folder?: string, resourceType?: 'image' | 'video' }
   */
  static async upload(req: Request, res: Response) {
    try {
      const { file, folder = 'firestone', resourceType = 'auto' } = req.body;

      if (!file || typeof file !== 'string') {
        return res.status(400).json({ error: 'Fichier requis (base64 ou URL).' });
      }

      const result = await CloudinaryService.uploadMedia(file, folder, resourceType);

      return res.status(201).json({
        url: result.secure_url || result.url,
        secure_url: result.secure_url,
        publicId: result.publicId,
        resourceType: result.resourceType,
        format: result.format,
        bytes: result.bytes,
      });
    } catch (err: any) {
      console.error('[UploadController]', err?.message);
      return res.status(500).json({
        error: 'Erreur lors du téléversement du média.',
        details: err?.message,
      });
    }
  }
}
