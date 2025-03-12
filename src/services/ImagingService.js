import axios from 'axios';
import { createCache } from '../utils/performanceUtils';

// Create cache for imaging data
const imagingCache = createCache(20);

/**
 * Service for handling medical imaging functionality
 */
class ImagingService {
  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || '/api';
    this.mockMode = process.env.REACT_APP_USE_MOCK_API === 'true';
    
    // Mock imaging data for development
    this.mockImages = [
      {
        id: 'img_001',
        patientId: 'patient_001',
        type: 'X-Ray',
        bodyRegion: 'Chest',
        imageUrl: '/mock/images/chest_xray_01.jpg',
        thumbnailUrl: '/mock/images/thumbnails/chest_xray_01.jpg',
        description: 'Chest X-Ray, Posterior-Anterior View',
        date: '2025-02-15T09:30:00Z',
        status: 'completed',
        orderedBy: 'Dr. James Wilson',
        radiologistNotes: 'No acute findings. Lungs are clear. Heart size is normal.',
        findings: 'Normal chest X-ray with no evidence of acute cardiopulmonary disease.',
        metadata: {
          width: 2048,
          height: 2048,
          format: 'DICOM',
          sizeBytes: 4194304
        },
        tags: ['routine', 'annual checkup']
      },
      {
        id: 'img_002',
        patientId: 'patient_001',
        type: 'MRI',
        bodyRegion: 'Brain',
        imageUrl: '/mock/images/brain_mri_01.jpg',
        thumbnailUrl: '/mock/images/thumbnails/brain_mri_01.jpg',
        description: 'Brain MRI, T2-weighted sequence',
        date: '2025-01-22T13:45:00Z',
        status: 'completed',
        orderedBy: 'Dr. Sarah Johnson',
        radiologistNotes: 'No evidence of acute intracranial hemorrhage, mass effect, or midline shift. Ventricles are normal in size and configuration.',
        findings: 'Normal brain MRI with no evidence of acute pathology.',
        metadata: {
          width: 512,
          height: 512,
          slices: 32,
          format: 'DICOM',
          sizeBytes: 16777216
        },
        tags: ['neurology', 'headache']
      },
      {
        id: 'img_003',
        patientId: 'patient_001',
        type: 'CT Scan',
        bodyRegion: 'Abdomen',
        imageUrl: '/mock/images/abdomen_ct_01.jpg',
        thumbnailUrl: '/mock/images/thumbnails/abdomen_ct_01.jpg',
        description: 'Abdominal CT Scan with contrast',
        date: '2024-11-05T10:15:00Z',
        status: 'completed',
        orderedBy: 'Dr. Michael Chen',
        radiologistNotes: 'Liver, spleen, pancreas, and adrenal glands appear normal. No free fluid or free air. No lymphadenopathy.',
        findings: 'Unremarkable abdominal CT scan with no evidence of acute pathology.',
        metadata: {
          width: 512,
          height: 512,
          slices: 64,
          format: 'DICOM',
          sizeBytes: 33554432
        },
        tags: ['abdominal pain', 'follow-up']
      },
      {
        id: 'img_004',
        patientId: 'patient_001',
        type: 'Ultrasound',
        bodyRegion: 'Thyroid',
        imageUrl: '/mock/images/thyroid_us_01.jpg',
        thumbnailUrl: '/mock/images/thumbnails/thyroid_us_01.jpg',
        description: 'Thyroid Ultrasound',
        date: '2025-03-01T14:20:00Z',
        status: 'completed',
        orderedBy: 'Dr. Sarah Johnson',
        radiologistNotes: 'Thyroid is normal in size and echotexture. No nodules or masses identified.',
        findings: 'Normal thyroid ultrasound.',
        metadata: {
          width: 800,
          height: 600,
          format: 'JPEG',
          sizeBytes: 1048576
        },
        tags: ['endocrinology', 'routine']
      }
    ];
  }
  
  /**
   * Get all imaging studies for a patient
   * @param {string} patientId - The patient's ID
   * @param {Object} options - Query options (type, dateRange, limit, etc.)
   * @returns {Promise<Array>} - List of imaging studies
   */
  async getPatientImagingStudies(patientId, options = {}) {
    const cacheKey = `patient_imaging_${patientId}_${JSON.stringify(options)}`;
    
    // Check cache first
    if (imagingCache.has(cacheKey)) {
      return imagingCache.get(cacheKey);
    }
    
    try {
      // Use mock data in development
      if (this.mockMode) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Filter mock images by patientId
        const patientImages = this.mockImages.filter(img => img.patientId === patientId);
        
        // Apply filters based on options
        let filteredImages = [...patientImages];
        
        if (options.type) {
          filteredImages = filteredImages.filter(img => img.type === options.type);
        }
        
        if (options.bodyRegion) {
          filteredImages = filteredImages.filter(img => img.bodyRegion === options.bodyRegion);
        }
        
        if (options.dateRange) {
          const { start, end } = options.dateRange;
          filteredImages = filteredImages.filter(img => {
            const imgDate = new Date(img.date);
            return (!start || imgDate >= new Date(start)) && 
                   (!end || imgDate <= new Date(end));
          });
        }
        
        // Sort by date (newest first)
        filteredImages.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Apply limit if specified
        if (options.limit && options.limit > 0) {
          filteredImages = filteredImages.slice(0, options.limit);
        }
        
        // Cache the results
        imagingCache.set(cacheKey, filteredImages);
        return filteredImages;
      }
      
      // Real API call
      const response = await axios.get(`${this.apiUrl}/imaging/patient/${patientId}`, {
        headers: this.getAuthHeaders(),
        params: options
      });
      
      // Cache the results
      imagingCache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting patient imaging studies:', error);
      throw new Error(`Failed to get imaging studies: ${error.message}`);
    }
  }
  
  /**
   * Get a specific imaging study by ID
   * @param {string} imagingId - The imaging study ID
   * @returns {Promise<Object>} - The imaging study details
   */
  async getImagingStudy(imagingId) {
    const cacheKey = `imaging_${imagingId}`;
    
    // Check cache first
    if (imagingCache.has(cacheKey)) {
      return imagingCache.get(cacheKey);
    }
    
    try {
      // Use mock data in development
      if (this.mockMode) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Find matching imaging study
        const study = this.mockImages.find(img => img.id === imagingId);
        
        if (!study) {
          throw new Error('Imaging study not found');
        }
        
        // Cache the result
        imagingCache.set(cacheKey, study);
        return study;
      }
      
      // Real API call
      const response = await axios.get(`${this.apiUrl}/imaging/${imagingId}`, {
        headers: this.getAuthHeaders()
      });
      
      // Cache the result
      imagingCache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting imaging study:', error);
      throw new Error(`Failed to get imaging study: ${error.message}`);
    }
  }
  
  /**
   * Request a new imaging study
   * @param {Object} requestData - The imaging request data
   * @returns {Promise<Object>} - The created imaging request
   */
  async requestImagingStudy(requestData) {
    try {
      // Use mock data in development
      if (this.mockMode) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Create mock imaging request
        const newRequest = {
          id: 'req_' + Date.now(),
          status: 'pending',
          createdAt: new Date().toISOString(),
          scheduledDate: null,
          ...requestData
        };
        
        return newRequest;
      }
      
      // Real API call
      const response = await axios.post(`${this.apiUrl}/imaging/requests`, requestData, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error requesting imaging study:', error);
      throw new Error(`Failed to request imaging study: ${error.message}`);
    }
  }
  
  /**
   * Upload an imaging study
   * @param {string} patientId - The patient's ID
   * @param {File} imageFile - The image file to upload
   * @param {Object} metadata - Additional metadata for the image
   * @returns {Promise<Object>} - The uploaded imaging study
   */
  async uploadImagingStudy(patientId, imageFile, metadata) {
    try {
      // Use mock data in development
      if (this.mockMode) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create mock upload response
        const newImage = {
          id: 'img_' + Date.now(),
          patientId,
          imageUrl: URL.createObjectURL(imageFile),
          thumbnailUrl: URL.createObjectURL(imageFile),
          uploadedAt: new Date().toISOString(),
          status: 'processing',
          ...metadata
        };
        
        return newImage;
      }
      
      // Create form data for multipart upload
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('patientId', patientId);
      formData.append('metadata', JSON.stringify(metadata));
      
      // Real API call
      const response = await axios.post(`${this.apiUrl}/imaging/upload`, formData, {
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading imaging study:', error);
      throw new Error(`Failed to upload imaging study: ${error.message}`);
    }
  }
  
  /**
   * Get available imaging types
   * @returns {Promise<Array>} - List of available imaging types
   */
  async getImagingTypes() {
    try {
      // Use mock data in development
      if (this.mockMode) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Return mock imaging types
        return [
          { id: 'xray', name: 'X-Ray', description: 'Uses radiation to produce images of internal structures' },
          { id: 'mri', name: 'MRI', description: 'Uses magnetic fields and radio waves to create detailed images' },
          { id: 'ct', name: 'CT Scan', description: 'Uses X-rays to create cross-sectional images' },
          { id: 'ultrasound', name: 'Ultrasound', description: 'Uses sound waves to create images of internal organs' },
          { id: 'mammogram', name: 'Mammogram', description: 'X-ray imaging of breast tissue' },
          { id: 'dexa', name: 'DEXA Scan', description: 'Measures bone density using low-dose X-rays' },
          { id: 'pet', name: 'PET Scan', description: 'Uses radioactive tracers to show metabolic activity' }
        ];
      }
      
      // Real API call
      const response = await axios.get(`${this.apiUrl}/imaging/types`, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting imaging types:', error);
      throw new Error(`Failed to get imaging types: ${error.message}`);
    }
  }
  
  /**
   * Get imaging statistics for a patient
   * @param {string} patientId - The patient's ID
   * @returns {Promise<Object>} - Imaging statistics
   */
  async getPatientImagingStats(patientId) {
    try {
      // Use mock data in development
      if (this.mockMode) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Return mock imaging statistics
        return {
          totalStudies: 4,
          studiesByType: {
            'X-Ray': 1,
            'MRI': 1,
            'CT Scan': 1,
            'Ultrasound': 1
          },
          studiesByYear: {
            '2024': 1,
            '2025': 3
          },
          radiationExposure: {
            total: 4.2, // mSv
            lastYear: 2.8, // mSv
            byType: {
              'X-Ray': 0.2, // mSv
              'CT Scan': 4.0 // mSv
            }
          }
        };
      }
      
      // Real API call
      const response = await axios.get(`${this.apiUrl}/imaging/stats/${patientId}`, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting patient imaging stats:', error);
      throw new Error(`Failed to get imaging statistics: ${error.message}`);
    }
  }
  
  /**
   * Share an imaging study with another provider
   * @param {string} imagingId - The imaging study ID
   * @param {Object} shareData - Share details (recipient, message, expiration)
   * @returns {Promise<Object>} - Share confirmation
   */
  async shareImagingStudy(imagingId, shareData) {
    try {
      // Use mock data in development
      if (this.mockMode) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Return mock share confirmation
        return {
          success: true,
          shareId: 'share_' + Date.now(),
          imagingId,
          recipient: shareData.recipient,
          expiresAt: shareData.expiration || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          accessUrl: `https://example.com/imaging/shared/${imagingId}?token=mock_token_${Date.now()}`
        };
      }
      
      // Real API call
      const response = await axios.post(`${this.apiUrl}/imaging/${imagingId}/share`, shareData, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error sharing imaging study:', error);
      throw new Error(`Failed to share imaging study: ${error.message}`);
    }
  }
  
  /**
   * Get authorization headers for API requests
   * @returns {Object} - Headers object with authorization token
   * @private
   */
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    };
  }
  
  /**
   * Clear the imaging cache
   */
  clearCache() {
    imagingCache.clear();
  }
}

// Export singleton instance
export default new ImagingService(); 