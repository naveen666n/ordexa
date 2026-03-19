const express = require('express');
const router = express.Router();
const controller = require('./products.controller');
const authenticate = require('../../../middleware/authenticate');
const requireRole = require('../../../middleware/requireRole');
const validation = require('./products.validation');
const { uploadMultipleMiddleware } = require('../../storage/storage.service');
const auditLog = require('../../../middleware/auditLog');
const ordersController = require('../../orders/orders.controller');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const { validationError } = require('../../../utils/response');
    return validationError(res, error.details.map((d) => ({ field: d.context.key, message: d.message })));
  }
  req.body = value;
  next();
};

// All admin product routes require admin role
router.use(authenticate, requireRole('admin'));

router.get('/', controller.listAdmin);
router.get('/:id', controller.getById);
router.post('/', validate(validation.createProduct), auditLog('PRODUCT_CREATE', 'product'), controller.create);
router.put('/:id', validate(validation.updateProduct), auditLog('PRODUCT_UPDATE', 'product'), controller.update);
router.delete('/:id', auditLog('PRODUCT_DELETE', 'product'), controller.destroy);

// Images
router.post('/:id/images', uploadMultipleMiddleware, controller.uploadImages);
router.put('/:id/images/:imgId/primary', controller.setPrimaryImage);
router.delete('/:id/images/:imgId', controller.deleteImage);

// Order history for a product
router.get('/:id/orders', ordersController.getProductOrders);

// Variants
router.post('/:id/variants', validate(validation.createVariant), controller.addVariant);
router.put('/:id/variants/:vid', validate(validation.updateVariant), controller.updateVariant);
router.delete('/:id/variants/:vid', controller.deactivateVariant);

module.exports = router;
