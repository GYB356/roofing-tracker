// src/utils/baaManagement.js
import { encryptData, decryptData } from './hipaaCompliance';
import { createAuditLog, AUDIT_TYPES } from './hipaaAudit';

// Constants for BAA status
export const BAA_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  TERMINATED: 'terminated'
};

// Validate BAA data
const validateBAAData = (businessAssociate, terms, user) => {
  const errors = [];
  
  if (!businessAssociate?.id || !businessAssociate?.name) {
    errors.push('Business Associate information is incomplete');
  }
  
  if (!terms || typeof terms !== 'string' || terms.trim().length === 0) {
    errors.push('BAA terms are required');
  }
  
  if (!user?.id || !user?.role || user.role !== 'admin') {
    errors.push('Unauthorized: Only administrators can create BAAs');
  }
  
  return errors;
};

// Create new Business Associate Agreement
export const createBAA = async (businessAssociate, terms, user) => {
  // Validate input data
  const validationErrors = validateBAAData(businessAssociate, terms, user);
  if (validationErrors.length > 0) {
    throw new Error(`BAA validation failed: ${validationErrors.join(', ')}`);
  }

  const baaDocument = {
    businessAssociateId: businessAssociate.id,
    businessAssociateName: businessAssociate.name,
    effectiveDate: new Date().toISOString(),
    expirationDate: calculateExpirationDate(),
    terms: encryptData(terms),
    status: BAA_STATUS.PENDING,
    createdBy: user.id,
    createdByRole: user.role,
    lastModified: new Date().toISOString(),
    version: 1,
    revisionHistory: [{
      timestamp: new Date().toISOString(),
      action: 'created',
      userId: user.id,
      userRole: user.role
    }]
  };

  try {
    const response = await fetch('/api/hipaa/baa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(baaDocument)
    });

    if (!response.ok) {
      throw new Error('Failed to create BAA');
    }

    const createdBAA = await response.json();

    // Log BAA creation in audit trail
    await createAuditLog('BAA_CREATION', {
      baaId: createdBAA.id,
      businessAssociateId: businessAssociate.id,
      action: 'create'
    }, user);

    return createdBAA;
  } catch (error) {
    console.error('Error creating BAA:', error);
    throw error;
  }
};

// Calculate BAA expiration date (default: 1 year)
const calculateExpirationDate = (years = 1) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString();
};

// Get BAA by ID
export const getBAA = async (baaId, user) => {
  try {
    const response = await fetch(`/api/hipaa/baa/${baaId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch BAA');
    }

    const baa = await response.json();
    
    // Decrypt sensitive information
    return {
      ...baa,
      terms: decryptData(baa.terms)
    };
  } catch (error) {
    console.error('Error fetching BAA:', error);
    throw error;
  }
};

// Validate BAA status transition
const validateStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    [BAA_STATUS.PENDING]: [BAA_STATUS.ACTIVE, BAA_STATUS.TERMINATED],
    [BAA_STATUS.ACTIVE]: [BAA_STATUS.EXPIRED, BAA_STATUS.TERMINATED],
    [BAA_STATUS.EXPIRED]: [BAA_STATUS.TERMINATED],
    [BAA_STATUS.TERMINATED]: []
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

// Update BAA status
export const updateBAAStatus = async (baaId, newStatus, user) => {
  try {
    // Fetch current BAA to validate status transition
    const currentBAA = await getBAA(baaId, user);
    
    if (!validateStatusTransition(currentBAA.status, newStatus)) {
      throw new Error(`Invalid status transition from ${currentBAA.status} to ${newStatus}`);
    }

    // Additional security check for user permissions
    if (!user.role || user.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can update BAA status');
    }

    // Create revision history entry
    const revisionEntry = {
      timestamp: new Date().toISOString(),
      action: 'status_update',
      userId: user.id,
      userRole: user.role,
      previousStatus: currentBAA.status,
      newStatus: newStatus,
      reason: user.updateReason || 'Status update'
    };

    const response = await fetch(`/api/hipaa/baa/${baaId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ 
        status: newStatus,
        updatedBy: user.id,
        updateTimestamp: new Date().toISOString(),
        revisionEntry: revisionEntry,
        version: currentBAA.version + 1
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update BAA status');
    }

    // Log status update in audit trail
    await createAuditLog('BAA_UPDATE', {
      baaId,
      newStatus,
      previousStatus: currentBAA.status,
      version: currentBAA.version + 1,
      action: 'update_status'
    }, user);

    return true;
  } catch (error) {
    console.error('Error updating BAA status:', error);
    throw error;
  }
};

// Check BAA expiration and send notifications
export const checkBAAExpirations = async () => {
  try {
    const response = await fetch('/api/hipaa/baa/check-expirations', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to check BAA expirations');
    }

    const expiringBAAs = await response.json();
    
    // Process expiring BAAs and send notifications
    expiringBAAs.forEach(baa => {
      sendBAAExpirationNotification(baa);
    });

    return expiringBAAs;
  } catch (error) {
    console.error('Error checking BAA expirations:', error);
    throw error;
  }
};

// Send BAA expiration notification
const sendBAAExpirationNotification = async (baa) => {
  const notificationData = {
    type: 'BAA_EXPIRATION',
    businessAssociateId: baa.businessAssociateId,
    baaId: baa.id,
    expirationDate: baa.expirationDate
  };

  try {
    await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(notificationData)
    });
  } catch (error) {
    console.error('Error sending BAA expiration notification:', error);
  }
};

// Terminate BAA
export const terminateBAA = async (baaId, reason, user) => {
  try {
    const response = await fetch(`/api/hipaa/baa/${baaId}/terminate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      throw new Error('Failed to terminate BAA');
    }

    // Log termination in audit trail
    await createAuditLog('BAA_TERMINATION', {
      baaId,
      reason,
      action: 'terminate'
    }, user);

    return true;
  } catch (error) {
    console.error('Error terminating BAA:', error);
    throw error;
  }
};