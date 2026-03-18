'use strict';

const { AuditLog } = require('../models');

/**
 * Middleware factory: logs an action to the audit_logs table on response finish.
 * Usage: router.put('/...', auditLog('ORDER_STATUS_UPDATE', 'order'), controller.updateStatus)
 *
 * The controller should attach req.auditData = { entityId, oldValue, newValue } for rich logging.
 */
const auditLog = (action, entityType) => (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const { entityId, oldValue, newValue } = req.auditData || {};
      AuditLog.create({
        user_id: req.user?.id || null,
        action,
        entity_type: entityType,
        entity_id: entityId || req.params?.orderNumber || req.params?.id || null,
        old_value: oldValue || null,
        new_value: newValue || null,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
      }).catch(() => {}); // fire and forget — never block the response
    }
  });
  next();
};

module.exports = auditLog;
