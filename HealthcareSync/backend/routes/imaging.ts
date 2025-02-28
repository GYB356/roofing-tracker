import express from 'express';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '../storage';


const router = express.Router();
const storage = new Storage();

// Set up multer for file uploads (retained from original)
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'medical-images');

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + uuidv4();
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and DICOM files
    const filetypes = /jpeg|jpg|png|gif|tiff|dcm|dicom/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image and DICOM files are allowed'));
  }
});


// Medical image record schema (This might need adjustment based on the new schema)
const medicalImageSchema = z.object({
  patientId: z.string(),
  studyType: z.enum(['X-RAY', 'CT_SCAN', 'MRI', 'ULTRASOUND', 'MAMMOGRAM', 'OTHER']),
  bodyPart: z.string(),
  orderingPhysicianId: z.string(),
  clinicalIndication: z.string(),
  studyDate: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Get all medical images (Retained, but might be redundant with new endpoints)
router.get('/', requireAuth, async (req, res) => {
  try {
    const images = await storage.prisma.medicalImage.findMany({
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        orderingPhysician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(images);
  } catch (error) {
    console.error('Error fetching medical images:', error);
    res.status(500).json({ error: 'Failed to fetch medical images' });
  }
});

// Get all medical images for a patient (From edited code)
router.get('/patient/:patientId', requireAuth, async (req, res) => {
  try {
    const { patientId } = req.params;

    const images = await prisma.medicalRecord.findMany({
      where: {
        patientId,
        recordType: 'IMAGING'
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.json(images);
  } catch (error) {
    console.error('Error fetching medical images:', error);
    res.status(500).json({ message: 'Failed to fetch medical images' });
  }
});

// Get a specific medical image (From edited code)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const image = await prisma.medicalRecord.findUnique({
      where: {
        id,
        recordType: 'IMAGING'
      }
    });

    if (!image) {
      return res.status(404).json({ message: 'Medical image not found' });
    }

    res.json(image);
  } catch (error) {
    console.error('Error fetching medical image:', error);
    res.status(500).json({ message: 'Failed to fetch medical image' });
  }
});

// Upload a new medical image (From edited code)
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      title,
      description,
      date,
      imageType,
      bodyPart,
      attachmentUrl
    } = req.body;

    if (!patientId || !doctorId || !title || !date || !attachmentUrl) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newImage = await prisma.medicalRecord.create({
      data: {
        patientId,
        doctorId,
        recordType: 'IMAGING',
        title,
        description,
        date: new Date(date),
        status: 'FINAL',
        confidentiality: 'NORMAL',
        metadata: {
          imageType: imageType || 'X-RAY',
          bodyPart: bodyPart || 'UNSPECIFIED',
          format: attachmentUrl.split('.').pop().toLowerCase(),
          sizeKb: Math.floor(Math.random() * 5000) + 1000, // Mock size
          dimensions: '2048x1536',
          radiologistNotes: ''
        },
        attachmentUrl
      }
    });

    res.status(201).json(newImage);
  } catch (error) {
    console.error('Error uploading medical image:', error);
    res.status(500).json({ message: 'Failed to upload medical image' });
  }
});

// Add radiologist annotation to an image (From edited code)
router.patch('/:id/annotate', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { annotations, radiologistNotes } = req.body;

    const image = await prisma.medicalRecord.findUnique({
      where: {
        id,
        recordType: 'IMAGING'
      }
    });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Update metadata with annotations
    const metadata = {
      ...(image.metadata as object),
      annotations: annotations || [],
      radiologistNotes: radiologistNotes || '',
      annotatedAt: new Date().toISOString(),
      annotatedBy: req.user.id
    };

    const updatedImage = await prisma.medicalRecord.update({
      where: { id },
      data: {
        metadata
      }
    });

    res.json(updatedImage);
  } catch (error) {
    console.error('Error annotating medical image:', error);
    res.status(500).json({ message: 'Failed to annotate medical image' });
  }
});


// Delete a medical image (From edited code and original, combined)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the image to potentially delete associated files (from original, adapted)
    const image = await prisma.medicalRecord.findUnique({
      where: { id, recordType: 'IMAGING' }
    });

    if (image && image.attachmentUrl) {
      //Simulate file deletion.  Replace with actual file deletion logic if needed.
      console.log(`Simulating deletion of file: ${image.attachmentUrl}`);
    }

    // Delete record from database (from edited code)
    await prisma.medicalRecord.delete({ where: { id, recordType: 'IMAGING' } });

    res.json({ message: 'Medical image deleted successfully' });
  } catch (error) {
    console.error('Error deleting medical image:', error);
    res.status(500).json({ message: 'Failed to delete medical image' });
  }
});

// Stream image file (Retained from original, modified to use attachmentUrl)
router.get('/:imageId/file', requireAuth, async (req, res) => {
  try {
    const { imageId } = req.params;

    const image = await prisma.medicalRecord.findUnique({
      where: { id: imageId, recordType: 'IMAGING' }
    });

    if (!image || !image.attachmentUrl) {
      return res.status(404).json({ error: 'Image file not found' });
    }

    // Redirect to the actual file location
    return res.redirect(image.attachmentUrl);


  } catch (error) {
    console.error('Error streaming medical image file:', error);
    res.status(500).json({ error: 'Failed to stream medical image file' });
  }
});

// Get medical images by patient ID (Retained from original, but might be redundant)
router.get('/patient/:patientId', requireAuth, async (req, res) => {
  try {
    const { patientId } = req.params;

    const images = await storage.prisma.medicalImage.findMany({
      where: { patientId },
      include: {
        orderingPhysician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(images);
  } catch (error) {
    console.error('Error fetching patient medical images:', error);
    res.status(500).json({ error: 'Failed to fetch patient medical images' });
  }
});


// Get a specific medical image (Retained from original, but might be redundant)
router.get('/:imageId', requireAuth, async (req, res) => {
  try {
    const { imageId } = req.params;

    const image = await storage.prisma.medicalImage.findUnique({
      where: { id: imageId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        orderingPhysician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    if (!image) {
      return res.status(404).json({ error: 'Medical image not found' });
    }

    res.json(image);
  } catch (error) {
    console.error('Error fetching medical image:', error);
    res.status(500).json({ error: 'Failed to fetch medical image' });
  }
});

// Update medical image metadata (Retained from original)
router.put('/:imageId', requireAuth, async (req, res) => {
  try {
    const { imageId } = req.params;
    const validatedData = medicalImageSchema.partial().parse(req.body);

    const updatedImage = await storage.prisma.medicalImage.update({
      where: { id: imageId },
      data: validatedData
    });

    res.json(updatedImage);
  } catch (error) {
    console.error('Error updating medical image:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update medical image' });
    }
  }
});

// Upload a new medical image (Retained from original, but might be redundant)
router.post('/', requireAuth, imageUpload.single('imageFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const validatedData = medicalImageSchema.parse(JSON.parse(req.body.metadata));

    const newImage = await storage.prisma.medicalImage.create({
      data: {
        patientId: validatedData.patientId,
        studyType: validatedData.studyType,
        bodyPart: validatedData.bodyPart,
        orderingPhysicianId: validatedData.orderingPhysicianId,
        clinicalIndication: validatedData.clinicalIndication,
        studyDate: validatedData.studyDate || new Date().toISOString(),
        notes: validatedData.notes,
        tags: validatedData.tags,
        filePath: req.file.path,
        fileName: req.file.filename,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      }
    });

    res.status(201).json(newImage);
  } catch (error) {
    console.error('Error uploading medical image:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to upload medical image' });
    }
  }
});


export default router;