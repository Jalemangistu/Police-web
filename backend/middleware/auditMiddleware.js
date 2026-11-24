import AuditLog from '../models/AuditLog.js';

export const audit = (req, action, resourceType, resourceId, changes) => 
  AuditLog.create({ actor: req.user?.id, action, resourceType, resourceId, changes, ipAddress: req.ip }).catch(() => {});
