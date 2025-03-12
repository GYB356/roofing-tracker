import axios from 'axios';
import { createCache } from '../utils/performanceUtils';

// Create cache for prescription data
const prescriptionCache = createCache(30);

/**
 * Service for managing prescriptions and medication
 */
class PrescriptionService {
  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || '/api';
    this.mockMode = process.env.REACT_APP_USE_MOCK_API === 'true';
    
    // Mock prescriptions for development
    this.mockPrescriptions = [
      {
        id: 'rx_001',
        patientId: 'patient_001',
        medication: 'Lisinopril',
        genericName: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        instructions: 'Take by mouth once daily with or without food.',
        startDate: '2025-01-15T00:00:00Z',
        endDate: '2025-07-15T00:00:00Z',
        expirationDate: '2026-01-15T00:00:00Z',
        prescriber: 'Dr. Sarah Johnson',
        prescriberSpecialty: 'Cardiology',
        pharmacy: 'City Pharmacy',
        pharmacyPhone: '555-123-4567',
        refillsTotal: 6,
        refillsRemaining: 4,
        lastFilled: '2025-03-01T00:00:00Z',
        status: 'active',
        isControlled: false,
        controlledClass: null,
        interactions: ['ACE inhibitors', 'Potassium supplements'],
        sideEffects: ['Dizziness', 'Dry cough', 'Headache'],
        adherenceRate: 0.92,
        notes: 'Patient reports occasional dizziness when standing up quickly.'
      }
    ];
  }

  /**
   * Get all prescriptions for a patient
   * @param {string} patientId - The patient ID
   * @param {Object} options - Query options (active, sortBy, etc)
   * @returns {Promise<Array>} List of prescriptions
   */
  async getPatientPrescriptions(patientId, options = {}) {
    const cacheKey = `prescriptions_${patientId}_${JSON.stringify(options)}`;
    
    // Check cache first
    const cachedData = prescriptionCache.get(cacheKey);
    if (cachedData) {
      return Promise.resolve(cachedData);
    }

    try {
      if (this.mockMode) {
        // Filter mock prescriptions
        let prescriptions = this.mockPrescriptions.filter(p => p.patientId === patientId);
        
        // Apply filters
        if (options.active === true) {
          const now = new Date().toISOString();
          prescriptions = prescriptions.filter(p => 
            p.status === 'active' && 
            p.startDate <= now && 
            (p.endDate >= now || !p.endDate)
          );
        }
        
        // Apply sorting
        if (options.sortBy) {
          prescriptions.sort((a, b) => {
            if (options.sortDirection === 'desc') {
              return b[options.sortBy] > a[options.sortBy] ? 1 : -1;
            }
            return a[options.sortBy] > b[options.sortBy] ? 1 : -1;
          });
        }
        
        // Cache the result
        prescriptionCache.set(cacheKey, prescriptions);
        return Promise.resolve(prescriptions);
      } else {
        // Real API call
        const response = await axios.get(`${this.apiUrl}/patients/${patientId}/prescriptions`, {
          params: options
        });
        
        // Cache the result
        prescriptionCache.set(cacheKey, response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      throw error;
    }
  }

  /**
   * Get a specific prescription by ID
   * @param {string} prescriptionId - The prescription ID
   * @returns {Promise<Object>} Prescription details
   */
  async getPrescriptionById(prescriptionId) {
    const cacheKey = `prescription_${prescriptionId}`;
    
    // Check cache
    const cachedData = prescriptionCache.get(cacheKey);
    if (cachedData) {
      return Promise.resolve(cachedData);
    }

    try {
      if (this.mockMode) {
        const prescription = this.mockPrescriptions.find(p => p.id === prescriptionId);
        if (!prescription) {
          throw new Error('Prescription not found');
        }
        prescriptionCache.set(cacheKey, prescription);
        return Promise.resolve(prescription);
      } else {
        const response = await axios.get(`${this.apiUrl}/prescriptions/${prescriptionId}`);
        prescriptionCache.set(cacheKey, response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching prescription:', error);
      throw error;
    }
  }

  /**
   * Create a new prescription
   * @param {Object} prescriptionData - The prescription data
   * @returns {Promise<Object>} Created prescription
   */
  async createPrescription(prescriptionData) {
    try {
      if (this.mockMode) {
        // Generate new ID
        const newId = `rx_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        const newPrescription = {
          id: newId,
          ...prescriptionData,
          createdAt: new Date().toISOString(),
          status: 'active'
        };
        
        this.mockPrescriptions.push(newPrescription);
        
        // Invalidate patient prescriptions cache
        this.invalidatePatientCache(prescriptionData.patientId);
        
        return Promise.resolve(newPrescription);
      } else {
        const response = await axios.post(`${this.apiUrl}/prescriptions`, prescriptionData);
        
        // Invalidate patient prescriptions cache
        this.invalidatePatientCache(prescriptionData.patientId);
        
        return response.data;
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      throw error;
    }
  }

  /**
   * Update an existing prescription
   * @param {string} prescriptionId - The prescription ID
   * @param {Object} updates - The updates to apply
   * @returns {Promise<Object>} Updated prescription
   */
  async updatePrescription(prescriptionId, updates) {
    try {
      if (this.mockMode) {
        const index = this.mockPrescriptions.findIndex(p => p.id === prescriptionId);
        if (index === -1) {
          throw new Error('Prescription not found');
        }
        
        // Apply updates
        const updatedPrescription = {
          ...this.mockPrescriptions[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        
        this.mockPrescriptions[index] = updatedPrescription;
        
        // Invalidate caches
        prescriptionCache.delete(`prescription_${prescriptionId}`);
        this.invalidatePatientCache(updatedPrescription.patientId);
        
        return Promise.resolve(updatedPrescription);
      } else {
        const response = await axios.patch(`${this.apiUrl}/prescriptions/${prescriptionId}`, updates);
        
        // Invalidate caches
        prescriptionCache.delete(`prescription_${prescriptionId}`);
        this.invalidatePatientCache(response.data.patientId);
        
        return response.data;
      }
    } catch (error) {
      console.error('Error updating prescription:', error);
      throw error;
    }
  }

  /**
   * Request a refill for a prescription
   * @param {string} prescriptionId - The prescription ID
   * @param {Object} refillData - Additional data for the refill request
   * @returns {Promise<Object>} Refill request confirmation
   */
  async requestRefill(prescriptionId, refillData = {}) {
    try {
      if (this.mockMode) {
        const prescription = this.mockPrescriptions.find(p => p.id === prescriptionId);
        if (!prescription) {
          throw new Error('Prescription not found');
        }
        
        if (prescription.refillsRemaining <= 0) {
          throw new Error('No refills remaining');
        }
        
        // Create refill confirmation
        const refillConfirmation = {
          prescriptionId,
          requestedAt: new Date().toISOString(),
          estimatedReadyDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          pharmacy: prescription.pharmacy,
          pharmacyPhone: prescription.pharmacyPhone,
          status: 'pending',
          ...refillData
        };
        
        return Promise.resolve(refillConfirmation);
      } else {
        const response = await axios.post(`${this.apiUrl}/prescriptions/${prescriptionId}/refill`, refillData);
        return response.data;
      }
    } catch (error) {
      console.error('Error requesting refill:', error);
      throw error;
    }
  }

  /**
   * Record a refill of the prescription
   * @param {string} prescriptionId - The prescription ID
   * @param {Object} refillDetails - Details about the refill
   * @returns {Promise<Object>} Updated prescription
   */
  async recordRefill(prescriptionId, refillDetails) {
    try {
      if (this.mockMode) {
        const index = this.mockPrescriptions.findIndex(p => p.id === prescriptionId);
        if (index === -1) {
          throw new Error('Prescription not found');
        }
        
        const prescription = this.mockPrescriptions[index];
        
        if (prescription.refillsRemaining <= 0) {
          throw new Error('No refills remaining');
        }
        
        // Update prescription with new refill data
        const updatedPrescription = {
          ...prescription,
          refillsRemaining: prescription.refillsRemaining - 1,
          lastFilled: new Date().toISOString(),
          refillHistory: [
            ...(prescription.refillHistory || []),
            {
              date: new Date().toISOString(),
              pharmacy: refillDetails.pharmacy || prescription.pharmacy,
              quantity: refillDetails.quantity,
              notes: refillDetails.notes
            }
          ]
        };
        
        this.mockPrescriptions[index] = updatedPrescription;
        
        // Invalidate caches
        prescriptionCache.delete(`prescription_${prescriptionId}`);
        this.invalidatePatientCache(updatedPrescription.patientId);
        
        return Promise.resolve(updatedPrescription);
      } else {
        const response = await axios.post(`${this.apiUrl}/prescriptions/${prescriptionId}/refills`, refillDetails);
        
        // Invalidate caches
        prescriptionCache.delete(`prescription_${prescriptionId}`);
        this.invalidatePatientCache(response.data.patientId);
        
        return response.data;
      }
    } catch (error) {
      console.error('Error recording refill:', error);
      throw error;
    }
  }

  /**
   * Discontinue a prescription
   * @param {string} prescriptionId - The prescription ID
   * @param {Object} reason - Reason for discontinuation
   * @returns {Promise<Object>} Updated prescription
   */
  async discontinuePrescription(prescriptionId, reason) {
    try {
      if (this.mockMode) {
        const index = this.mockPrescriptions.findIndex(p => p.id === prescriptionId);
        if (index === -1) {
          throw new Error('Prescription not found');
        }
        
        // Update prescription status
        const updatedPrescription = {
          ...this.mockPrescriptions[index],
          status: 'discontinued',
          discontinuedReason: reason.text,
          discontinuedBy: reason.by,
          discontinuedDate: new Date().toISOString()
        };
        
        this.mockPrescriptions[index] = updatedPrescription;
        
        // Invalidate caches
        prescriptionCache.delete(`prescription_${prescriptionId}`);
        this.invalidatePatientCache(updatedPrescription.patientId);
        
        return Promise.resolve(updatedPrescription);
      } else {
        const response = await axios.post(`${this.apiUrl}/prescriptions/${prescriptionId}/discontinue`, reason);
        
        // Invalidate caches
        prescriptionCache.delete(`prescription_${prescriptionId}`);
        this.invalidatePatientCache(response.data.patientId);
        
        return response.data;
      }
    } catch (error) {
      console.error('Error discontinuing prescription:', error);
      throw error;
    }
  }

  /**
   * Check for potential drug interactions
   * @param {Array} medications - List of medications to check
   * @returns {Promise<Array>} Potential interactions
   */
  async checkInteractions(medications) {
    try {
      if (this.mockMode) {
        // Mock interaction data
        const mockInteractions = {
          'Lisinopril': ['Potassium supplements', 'NSAIDs', 'Lithium'],
          'Metformin': ['Alcohol', 'Contrast dyes', 'Corticosteroids'],
          'Atorvastatin': ['Grapefruit juice', 'Macrolide antibiotics', 'Cyclosporine']
        };
        
        // Find potential interactions
        const interactions = [];
        for (let i = 0; i < medications.length; i++) {
          const med1 = medications[i];
          const interactsWith = mockInteractions[med1] || [];
          
          for (let j = 0; j < medications.length; j++) {
            if (i !== j) {
              const med2 = medications[j];
              if (interactsWith.includes(med2)) {
                interactions.push({
                  medications: [med1, med2],
                  severity: 'moderate',
                  description: `Potential interaction between ${med1} and ${med2}`
                });
              }
            }
          }
        }
        
        return Promise.resolve(interactions);
      } else {
        const response = await axios.post(`${this.apiUrl}/medications/interactions`, { medications });
        return response.data;
      }
    } catch (error) {
      console.error('Error checking interactions:', error);
      throw error;
    }
  }

  /**
   * Get medication information
   * @param {string} medicationName - Medication name
   * @returns {Promise<Object>} Medication details
   */
  async getMedicationInfo(medicationName) {
    const cacheKey = `medication_${medicationName}`;
    
    // Check cache
    const cachedData = prescriptionCache.get(cacheKey);
    if (cachedData) {
      return Promise.resolve(cachedData);
    }

    try {
      if (this.mockMode) {
        // Mock medication database
        const medications = {
          'Lisinopril': {
            name: 'Lisinopril',
            genericName: 'Lisinopril',
            drugClass: 'ACE Inhibitor',
            usedFor: ['Hypertension', 'Heart failure', 'Post-myocardial infarction'],
            sideEffects: ['Dry cough', 'Dizziness', 'Headache', 'Fatigue'],
            contraindications: ['Pregnancy', 'History of angioedema'],
            dosageForms: ['Tablet: 2.5mg, 5mg, 10mg, 20mg, 30mg, 40mg'],
            interactions: ['Potassium-sparing diuretics', 'Potassium supplements', 'Lithium'],
            patientInstructions: 'Take at the same time each day with or without food.'
          },
          'Metformin': {
            name: 'Metformin',
            genericName: 'Metformin',
            drugClass: 'Biguanide',
            usedFor: ['Type 2 diabetes'],
            sideEffects: ['Nausea', 'Diarrhea', 'Abdominal discomfort', 'Metallic taste'],
            contraindications: ['Kidney disease', 'Liver disease', 'Metabolic acidosis'],
            dosageForms: ['Tablet: 500mg, 850mg, 1000mg', 'Extended-release: 500mg, 750mg, 1000mg'],
            interactions: ['Alcohol', 'Iodinated contrast agents', 'Certain diuretics'],
            patientInstructions: 'Take with meals to reduce stomach upset.'
          }
        };
        
        const medicationInfo = medications[medicationName];
        if (!medicationInfo) {
          throw new Error('Medication information not found');
        }
        
        prescriptionCache.set(cacheKey, medicationInfo);
        return Promise.resolve(medicationInfo);
      } else {
        const response = await axios.get(`${this.apiUrl}/medications/${encodeURIComponent(medicationName)}`);
        prescriptionCache.set(cacheKey, response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching medication info:', error);
      throw error;
    }
  }

  /**
   * Track patient adherence to medication
   * @param {string} prescriptionId - The prescription ID
   * @param {Object} adherenceData - Adherence tracking data
   * @returns {Promise<Object>} Updated adherence statistics
   */
  async trackAdherence(prescriptionId, adherenceData) {
    try {
      if (this.mockMode) {
        const prescription = this.mockPrescriptions.find(p => p.id === prescriptionId);
        if (!prescription) {
          throw new Error('Prescription not found');
        }
        
        // Calculate new adherence rate
        const adherenceHistory = prescription.adherenceHistory || [];
        adherenceHistory.push(adherenceData);
        
        const totalDoses = adherenceHistory.length;
        const takenDoses = adherenceHistory.filter(record => record.taken).length;
        const adherenceRate = takenDoses / totalDoses;
        
        // Update prescription with new adherence data
        const index = this.mockPrescriptions.findIndex(p => p.id === prescriptionId);
        this.mockPrescriptions[index] = {
          ...prescription,
          adherenceHistory,
          adherenceRate: parseFloat(adherenceRate.toFixed(2))
        };
        
        // Invalidate caches
        prescriptionCache.delete(`prescription_${prescriptionId}`);
        this.invalidatePatientCache(prescription.patientId);
        
        return Promise.resolve({
          prescriptionId,
          adherenceRate: parseFloat(adherenceRate.toFixed(2)),
          totalDoses,
          takenDoses
        });
      } else {
        const response = await axios.post(`${this.apiUrl}/prescriptions/${prescriptionId}/adherence`, adherenceData);
        return response.data;
      }
    } catch (error) {
      console.error('Error tracking adherence:', error);
      throw error;
    }
  }

  /**
   * Get a prescription PDF
   * @param {string} prescriptionId - The prescription ID
   * @returns {Promise<Blob>} PDF blob
   */
  async getPrescriptionPdf(prescriptionId) {
    try {
      if (this.mockMode) {
        throw new Error('PDF generation not available in mock mode');
      } else {
        const response = await axios.get(`${this.apiUrl}/prescriptions/${prescriptionId}/pdf`, {
          responseType: 'blob'
        });
        return response.data;
      }
    } catch (error) {
      console.error('Error generating prescription PDF:', error);
      throw error;
    }
  }

  /**
   * Send prescription to pharmacy
   * @param {string} prescriptionId - The prescription ID
   * @param {Object} pharmacyData - Pharmacy details
   * @returns {Promise<Object>} Confirmation
   */
  async sendToPharmacy(prescriptionId, pharmacyData) {
    try {
      if (this.mockMode) {
        const prescription = this.mockPrescriptions.find(p => p.id === prescriptionId);
        if (!prescription) {
          throw new Error('Prescription not found');
        }
        
        // Update prescription with pharmacy info
        const index = this.mockPrescriptions.findIndex(p => p.id === prescriptionId);
        this.mockPrescriptions[index] = {
          ...prescription,
          pharmacy: pharmacyData.name,
          pharmacyPhone: pharmacyData.phone,
          pharmacyAddress: pharmacyData.address,
          sentToPharmacy: true,
          sentToPharmacyDate: new Date().toISOString()
        };
        
        // Invalidate caches
        prescriptionCache.delete(`prescription_${prescriptionId}`);
        this.invalidatePatientCache(prescription.patientId);
        
        return Promise.resolve({
          success: true,
          prescriptionId,
          pharmacy: pharmacyData.name,
          sentAt: new Date().toISOString(),
          estimatedReadyTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        });
      } else {
        const response = await axios.post(`${this.apiUrl}/prescriptions/${prescriptionId}/send`, pharmacyData);
        return response.data;
      }
    } catch (error) {
      console.error('Error sending to pharmacy:', error);
      throw error;
    }
  }

  /**
   * Invalidate patient cache entries
   * @param {string} patientId - The patient ID
   * @private
   */
  invalidatePatientCache(patientId) {
    // Get all cache keys
    const keys = prescriptionCache.keys();
    
    // Find and invalidate all cache entries for this patient
    keys.forEach(key => {
      if (key.startsWith(`prescriptions_${patientId}`)) {
        prescriptionCache.delete(key);
      }
    });
  }

  /**
   * Get prescription statistics for a patient
   * @param {string} patientId - The patient ID
   * @returns {Promise<Object>} Statistics
   */
  async getPatientPrescriptionStats(patientId) {
    try {
      const prescriptions = await this.getPatientPrescriptions(patientId);
      
      const now = new Date();
      
      // Calculate statistics
      const stats = {
        total: prescriptions.length,
        active: prescriptions.filter(p => 
          p.status === 'active' && 
          new Date(p.startDate) <= now && 
          (!p.endDate || new Date(p.endDate) >= now)
        ).length,
        expiringSoon: prescriptions.filter(p => {
          if (p.status !== 'active') return false;
          const expDate = new Date(p.expirationDate);
          const thirtyDaysFromNow = new Date(now);
          thirtyDaysFromNow.setDate(now.getDate() + 30);
          return expDate <= thirtyDaysFromNow && expDate >= now;
        }).length,
        needingRefill: prescriptions.filter(p => 
          p.status === 'active' && p.refillsRemaining <= 1
        ).length,
        averageAdherence: prescriptions
          .filter(p => p.adherenceRate !== undefined)
          .reduce((sum, p) => sum + p.adherenceRate, 0) / 
          prescriptions.filter(p => p.adherenceRate !== undefined).length || 0
      };
      
      return stats;
    } catch (error) {
      console.error('Error calculating prescription stats:', error);
      throw error;
    }
  }
}

export default PrescriptionService; 