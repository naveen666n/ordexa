const { forbidden } = require('../utils/response');

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return forbidden(res, 'Access denied');
  }

  const userRole = req.user.role ? req.user.role.name : null;
  if (!userRole || !roles.includes(userRole)) {
    return forbidden(res, 'Insufficient permissions');
  }

  next();
};

module.exports = requireRole;
