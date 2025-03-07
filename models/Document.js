// models/Document.js
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  fileType: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['contract', 'permit', 'invoice', 'photo', 'inspection', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true
  }],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  thumbnailPath: {
    type: String
  },
  metadata: {
    type: Map,
    of: String
  }
}, { timestamps: true });

// Create indexes for faster querying
documentSchema.index({ projectId: 1 });
documentSchema.index({ clientId: 1 });
documentSchema.index({ category: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ tags: 1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;

// routes/documents.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const sharp = require('sharp');
const mime = require('mime-types');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create directories if they don't exist
    const baseUploadDir = path.join(__dirname, '../uploads/documents');
    const yearMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const uploadDir = path.join(baseUploadDir, yearMonth);
    
    if (!fs.existsSync(baseUploadDir)) {
      fs.mkdirSync(baseUploadDir, { recursive: true });
    }
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with original extension
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Others
    'application/zip',
    'application/x-zip-compressed'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only documents, images, and archives are allowed.'), false);
  }
};

// Setup multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB
  }
});

// Create thumbnail for image files
const createThumbnail = async (filePath, mimeType) => {
  try {
    const isImage = mimeType.startsWith('image/');
    if (!isImage) return null;
    
    const fileDir = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const thumbnailPath = path.join(fileDir, `thumb_${fileName}`);
    
    await sharp(filePath)
      .resize(200, 200, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    
    return thumbnailPath.replace(path.join(__dirname, '..'), '');
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE - Remove document
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Get full file path
    const filePath = path.join(__dirname, '..', document.path);
    
    // Delete file from filesystem
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete thumbnail if exists
    if (document.thumbnailPath) {
      const thumbnailPath = path.join(__dirname, '..', document.thumbnailPath);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }
    
    // Remove from database
    await Document.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET - Download document
router.get('/:id/download', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Get full file path
    const filePath = path.join(__dirname, '..', document.path);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
    res.setHeader('Content-Type', document.mimeType);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET documents by project ID
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const documents = await Document.find({ 
      projectId: req.params.projectId,
      isArchived: false 
    })
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(documents);
  } catch (error) {
    console.error('Error fetching project documents:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET documents by client ID
router.get('/client/:clientId', auth, async (req, res) => {
  try {
    const documents = await Document.find({ 
      clientId: req.params.clientId,
      isArchived: false 
    })
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(documents);
  } catch (error) {
    console.error('Error fetching client documents:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; {
    console.error('Thumbnail creation error:', error);
    return null;
  }
};

// GET all documents with filtering
router.get('/', auth, async (req, res) => {
  try {
    const { projectId, clientId, category, tags, search } = req.query;
    
    const query = {};
    
    // Apply filters
    if (projectId) query.projectId = projectId;
    if (clientId) query.clientId = clientId;
    if (category) query.category = category;
    
    // Search by tags (if provided as comma-separated string)
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }
    
    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Only show non-archived documents by default
    if (!req.query.showArchived) {
      query.isArchived = false;
    }
    
    const documents = await Document.find(query)
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET document by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'firstName lastName email')
      .populate('projectId', 'name')
      .populate('clientId', 'name');
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST - Upload new document
router.post('/', [auth, upload.single('file')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const {
      name,
      description,
      category,
      tags,
      projectId,
      clientId,
      metadata
    } = req.body;
    
    // Generate relative path for storage in DB
    const yearMonth = new Date().toISOString().slice(0, 7);
    const relativePath = `/uploads/documents/${yearMonth}/${req.file.filename}`;
    
    // Create thumbnail for images
    const thumbnailPath = await createThumbnail(
      req.file.path,
      req.file.mimetype
    );
    
    // Process tags if provided
    let tagArray = [];
    if (tags) {
      tagArray = tags.split(',').map(tag => tag.trim());
    }
    
    // Process metadata if provided
    let metadataMap = {};
    if (metadata) {
      try {
        metadataMap = JSON.parse(metadata);
      } catch (err) {
        console.error('Error parsing metadata:', err);
      }
    }
    
    const document = new Document({
      name: name || req.file.originalname,
      description,
      fileType: path.extname(req.file.originalname).slice(1),
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: relativePath,
      category: category || 'other',
      tags: tagArray,
      uploadedBy: req.user.id,
      projectId: projectId || null,
      clientId: clientId || null,
      thumbnailPath,
      metadata: metadataMap
    });
    
    await document.save();
    
    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT - Update document metadata
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      tags,
      projectId,
      clientId,
      isArchived,
      metadata
    } = req.body;
    
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Update fields if provided
    if (name) document.name = name;
    if (description !== undefined) document.description = description;
    if (category) document.category = category;
    if (tags) {
      const tagArray = typeof tags === 'string' 
        ? tags.split(',').map(tag => tag.trim())
        : tags;
      document.tags = tagArray;
    }
    if (projectId !== undefined) document.projectId = projectId || null;
    if (clientId !== undefined) document.clientId = clientId || null;
    if (isArchived !== undefined) document.isArchived = isArchived;
    
    // Update metadata if provided
    if (metadata) {
      let metadataMap;
      if (typeof metadata === 'string') {
        try {
          metadataMap = JSON.parse(metadata);
        } catch (err) {
          console.error('Error parsing metadata:', err);
          metadataMap = {};
        }
      } else {
        metadataMap = metadata;
      }
      
      document.metadata = metadataMap;
    }
    
    await document.save();
    
    res.json(document);
  } catch (error)