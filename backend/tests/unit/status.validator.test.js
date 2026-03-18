'use strict';

const { validateTransition, validateCancellable } = require('../../src/modules/orders/status.validator');
const { AppError } = require('../../src/utils/errors');

describe('validateTransition', () => {
  test('pending → paid is valid', () => {
    expect(() => validateTransition('pending', 'paid')).not.toThrow();
  });

  test('paid → processing is valid', () => {
    expect(() => validateTransition('paid', 'processing')).not.toThrow();
  });

  test('processing → shipped is valid', () => {
    expect(() => validateTransition('processing', 'shipped')).not.toThrow();
  });

  test('shipped → delivered is valid', () => {
    expect(() => validateTransition('shipped', 'delivered')).not.toThrow();
  });

  test('pending → shipped is INVALID', () => {
    expect(() => validateTransition('pending', 'shipped'))
      .toThrow(AppError);
  });

  test('delivered → processing is INVALID', () => {
    expect(() => validateTransition('delivered', 'processing'))
      .toThrow(AppError);
  });

  test('cancelled → paid is INVALID', () => {
    expect(() => validateTransition('cancelled', 'paid'))
      .toThrow(AppError);
  });
});

describe('validateCancellable', () => {
  test.each(['pending', 'paid', 'processing'])('%s is cancellable', (status) => {
    expect(() => validateCancellable(status)).not.toThrow();
  });

  test.each(['shipped', 'delivered', 'cancelled'])('%s cannot be cancelled', (status) => {
    expect(() => validateCancellable(status)).toThrow(AppError);
  });
});
