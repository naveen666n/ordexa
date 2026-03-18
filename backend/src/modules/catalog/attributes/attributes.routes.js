const express = require('express');
const router = express.Router();
const controller = require('./attributes.controller');
const authenticate = require('../../../middleware/authenticate');
const requireRole = require('../../../middleware/requireRole');
const validation = require('./attributes.validation');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const { validationError } = require('../../../utils/response');
    return validationError(res, error.details.map((d) => ({ field: d.context.key, message: d.message })));
  }
  next();
};

// All attribute routes are admin-only
router.use(authenticate, requireRole('admin'));

router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.post('/', validate(validation.createAttribute), controller.create);
router.put('/:id', validate(validation.updateAttribute), controller.update);
router.delete('/:id', controller.destroy);

// Attribute values
router.post('/:id/values', validate(validation.createValue), controller.addValue);
router.put('/:id/values/:vid', validate(validation.updateValue), controller.updateValue);
router.delete('/:id/values/:vid', controller.deleteValue);

module.exports = router;
