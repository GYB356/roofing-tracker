import { v4 as uuidv4 } from 'uuid';
import AuditLog from '../models/AuditLog';
import { redactPHI } from '../utils/phiUtils';

const auditLogger = async (req, res, next) => {
  const start = Date.now();
  const auditId = uuidv4();
  
  const auditData = {
    timestamp: new Date(),
    userId: req.user?.id,
    userRole: req.user?.role,
    endpoint: req.originalUrl,
    method: req.method,
    patientId: req.params.patientId || req.body?.patientId,
    actionType: req.get('X-Action-Type') || 'access',
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    requestBody: redactPHI(req.body),
    statusCode: null,
    responseTime: null,
    metadata: {
      auditId,
      correlationId: req.headers['x-correlation-id'],
      serviceVersion: process.env.npm_package_version
    }
  };

  const originalSend = res.send;
  res.send = function(body) {
    auditData.statusCode = res.statusCode;
    auditData.responseTime = Date.now() - start;
    auditData.responseBody = redactPHI(body);

    // Async log creation to avoid blocking
    AuditLog.create(auditData)
      .catch(err => console.error('Audit log creation error:', err));

    return originalSend.apply(res, arguments);
  };

  next();
};

export default auditLogger;