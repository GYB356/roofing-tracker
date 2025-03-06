import { prisma } from '../../lib/prisma';
import { AppError } from '../utils/app-error';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

export interface MedicalImage {
  id: string;
  patientId: number;
  providerId: number;
  imageType: 'xray' | 'mri' | 'ct' | 'ultrasound' | 'other';
  description: string;
  filePath: string;
  fileHash: string;
  uploadedAt: string;
  metadata: {
    bodyPart?: string;
    orientation?: string;
    studyDate?: string;
    technician?: string;
    equipment?: string;
  };
}

export class MedicalImagingService {
  private static readonly UPLOAD_DIR = process.env.MEDICAL_IMAGES_DIR || 'uploads/medical-images';
  private static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/dicom'
  ];

  static async initialize() {
    // Ensure upload directory exists
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
    }
  }

  static async uploadImage(
    file: Express.Multer.File,
    patientId: number,
    providerId: number,
    metadata: Partial<MedicalImage['metadata']> & {
      imageType: MedicalImage['imageType'];
      description: string;
    }
  ): Promise<MedicalImage> {
    try {
      // Validate file type
      if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new AppError('Invalid file type', 400);
      }

      // Generate secure filename
      const fileHash = crypto
        .createHash('sha256')
        .update(file.buffer)
        .digest('hex');
      const fileExt = path.extname(file.originalname);
      const secureFilename = `${fileHash}${fileExt}`;
      const filePath = path.join(this.UPLOAD_DIR, secureFilename);

      // Save file
      await fs.promises.writeFile(filePath, file.buffer);

      // Create database record
      const image = await prisma.medicalImage.create({
        data: {
          patientId,
          providerId,
          imageType: metadata.imageType,
          description: metadata.description,
          filePath: secureFilename,
          fileHash,
          metadata: metadata,
          uploadedAt: new Date().toISOString()
        }
      });

      return image;
    } catch (error) {
      console.error('Error uploading medical image:', error);
      throw error;
    }
  }

  static async getPatientImages(patientId: number): Promise<MedicalImage[]> {
    try {
      return await prisma.medicalImage.findMany({
        where: { patientId },
        orderBy: { uploadedAt: 'desc' }
      });
    } catch (error) {
      console.error('Error fetching patient images:', error);
      throw error;
    }
  }

  static async getImage(imageId: string): Promise<MedicalImage> {
    try {
      const image = await prisma.medicalImage.findUnique({
        where: { id: imageId }
      });

      if (!image) {
        throw new AppError('Image not found', 404);
      }

      return image;
    } catch (error) {
      console.error('Error fetching image:', error);
      throw error;
    }
  }

  static async deleteImage(imageId: string): Promise<void> {
    try {
      const image = await this.getImage(imageId);
      const filePath = path.join(this.UPLOAD_DIR, image.filePath);

      // Delete file
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }

      // Delete database record
      await prisma.medicalImage.delete({
        where: { id: imageId }
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  static async updateImageMetadata(
    imageId: string,
    metadata: Partial<MedicalImage['metadata']>
  ): Promise<MedicalImage> {
    try {
      return await prisma.medicalImage.update({
        where: { id: imageId },
        data: { metadata }
      });
    } catch (error) {
      console.error('Error updating image metadata:', error);
      throw error;
    }
  }

  static getImagePath(image: MedicalImage): string {
    return path.join(this.UPLOAD_DIR, image.filePath);
  }
}