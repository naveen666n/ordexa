'use strict';

const { AppError } = require('../../utils/errors');

// Valid forward transitions for operations
const TRANSITIONS = {
  pending: ['paid', 'cancelled'],
  paid: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

// Statuses from which customers/operations can cancel
const CANCELLABLE_FROM = ['pending', 'paid', 'processing'];

const validateTransition = (fromStatus, toStatus) => {
  const allowed = TRANSITIONS[fromStatus] || [];
  if (!allowed.includes(toStatus)) {
    throw new AppError(
      `Cannot transition order from '${fromStatus}' to '${toStatus}'.`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }
};

const validateCancellable = (status) => {
  if (!CANCELLABLE_FROM.includes(status)) {
    throw new AppError(
      `Order cannot be cancelled from status '${status}'.`,
      400,
      'CANNOT_CANCEL'
    );
  }
};

module.exports = { validateTransition, validateCancellable, CANCELLABLE_FROM };
