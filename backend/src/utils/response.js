const success = (res, data = null, message = null, statusCode = 200) => {
  const payload = { success: true };
  if (message) payload.message = message;
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};

const created = (res, data = null, message = null) => {
  return success(res, data, message, 201);
};

const error = (res, message = 'Something went wrong', statusCode = 500, code = 'INTERNAL_ERROR', details = null) => {
  const payload = {
    success: false,
    error: { code, message },
  };
  if (details) payload.error.details = details;
  return res.status(statusCode).json(payload);
};

const validationError = (res, details) => {
  return error(res, 'Validation failed', 400, 'VALIDATION_ERROR', details);
};

const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404, 'NOT_FOUND');
};

const unauthorized = (res, message = 'Unauthorized') => {
  return error(res, message, 401, 'UNAUTHORIZED');
};

const forbidden = (res, message = 'Forbidden') => {
  return error(res, message, 403, 'FORBIDDEN');
};

const conflict = (res, message = 'Conflict') => {
  return error(res, message, 409, 'CONFLICT');
};

const businessError = (res, message, code = 'BUSINESS_ERROR') => {
  return error(res, message, 422, code);
};

module.exports = {
  success,
  created,
  error,
  validationError,
  notFound,
  unauthorized,
  forbidden,
  conflict,
  businessError,
};
