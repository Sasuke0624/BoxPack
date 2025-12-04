const { body, param, query, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Auth validation rules
const authValidation = {
  signUp: [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('full_name').trim().notEmpty(),
    body('company_name').optional().trim(),
    body('phone').optional().trim(),
    validate
  ],
  signIn: [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate
  ]
};

// Order validation rules
const orderValidation = {
  create: [
    body('items').isArray({ min: 1 }),
    body('total_amount').isNumeric(),
    body('shipping_address').isObject(),
    body('shipping_address.postal_code').trim().notEmpty(),
    body('shipping_address.prefecture').trim().notEmpty(),
    body('shipping_address.city').trim().notEmpty(),
    body('shipping_address.address_line').trim().notEmpty(),
    body('shipping_address.recipient_name').trim().notEmpty(),
    body('shipping_address.phone').trim().notEmpty(),
    body('payment_method').isIn(['credit_card', 'bank_transfer', 'invoice']),
    validate
  ],
  updateStatus: [
    param('id').isUUID(),
    body('status').isIn(['pending', 'confirmed', 'manufacturing', 'shipped', 'delivered']),
    validate
  ]
};

// Material validation rules
const materialValidation = {
  create: [
    body('name').trim().notEmpty(),
    body('description').optional().trim(),
    body('image_url').optional().trim(),
    body('base_price').isNumeric({ min: 0 }),
    body('is_active').optional().isBoolean(),
    body('sort_order').optional().isInt({ min: 0 }),
    validate
  ],
  update: [
    param('id').isUUID(),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('image_url').optional().trim(),
    body('base_price').optional().isNumeric({ min: 0 }),
    body('is_active').optional().isBoolean(),
    body('sort_order').optional().isInt({ min: 0 }),
    validate
  ]
};

// Common validation rules
const commonValidation = {
  idParam: [
    param('id').isUUID(),
    validate
  ],
  uuidParam: (paramName) => [
    param(paramName).isUUID(),
    validate
  ]
};

module.exports = {
  validate,
  authValidation,
  orderValidation,
  materialValidation,
  commonValidation
};

