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

// Default statuses from which customers can cancel (used as fallback)
const DEFAULT_CANCELLABLE_FROM = ['pending', 'paid', 'processing'];

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

const validateCancellable = (status, cancellableStatuses = DEFAULT_CANCELLABLE_FROM) => {
  if (!cancellableStatuses.includes(status)) {
    throw new AppError(
      `Order cannot be cancelled from status '${status}'.`,
      400,
      'CANNOT_CANCEL'
    );
  }
};

module.exports = { validateTransition, validateCancellable, DEFAULT_CANCELLABLE_FROM };
