const morgan = require('morgan');

const httpLogger = morgan(':method :url :status :res[content-length] - :response-time ms');

module.exports = { httpLogger };
