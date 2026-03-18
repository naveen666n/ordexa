const { error } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const details = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return error(res, 'Validation failed', 400, 'VALIDATION_ERROR', details);
  }

  // Sequelize unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    return error(res, `${field} already exists`, 409, 'CONFLICT');
  }

  // Sequelize foreign key constraint
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return error(res, 'Related resource not found', 400, 'FOREIGN_KEY_ERROR');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return error(res, 'Invalid token', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return error(res, 'Token expired', 401, 'TOKEN_EXPIRED');
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return error(res, 'File too large. Maximum size is 10MB', 400, 'FILE_TOO_LARGE');
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return error(res, 'Too many files', 400, 'TOO_MANY_FILES');
  }

  // Custom app errors
  if (err.statusCode) {
    return error(res, err.message, err.statusCode, err.code || 'APP_ERROR');
  }

  // Default 500
  return error(res, 'Internal server error', 500, 'INTERNAL_ERROR');
};

module.exports = errorHandler;
