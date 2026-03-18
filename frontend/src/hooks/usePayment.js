import { useState, useCallback } from 'react';
import paymentsApi from '../api/payments.api';

/**
 * Loads the Razorpay checkout.js script on demand.
 * Returns a Promise that resolves once the script is ready.
 */
const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script.'));
    document.head.appendChild(script);
  });

/**
 * usePayment — unified payment flow for both mock and real Razorpay gateway.
 *
 * @param {Object} options
 *   onSuccess(orderNumber)  — called when payment is captured
 *   onCancel()              — called when user explicitly cancels
 *
 * Returns:
 *   pay(paymentInitiation, order, user, config) — kick off the payment
 *   status    — 'idle' | 'processing' | 'success' | 'failed'
 *   error     — string error message (or null)
 *   retry     — function to re-run with the same args (set after first call)
 */
const usePayment = ({ onSuccess, onCancel }) => {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [_lastArgs, setLastArgs] = useState(null);

  const pay = useCallback(async (paymentInitiation, order, user, config) => {
    if (!paymentInitiation) {
      setError('Payment data not available. Please try again.');
      setStatus('failed');
      return;
    }

    setLastArgs({ paymentInitiation, order, user, config });
    setError(null);
    setStatus('processing');

    const { gateway_order_id, key_id, amount, currency } = paymentInitiation;

    // ── Mock gateway ──────────────────────────────────────────────────────────
    if (key_id === 'mock') {
      try {
        await paymentsApi.mockConfirm(gateway_order_id);
        setStatus('success');
        onSuccess(order.order_number);
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Mock payment failed.');
        setStatus('failed');
      }
      return;
    }

    // ── Real Razorpay gateway ─────────────────────────────────────────────────
    try {
      await loadRazorpayScript();
    } catch {
      setError('Could not load payment processor. Check your connection and retry.');
      setStatus('failed');
      return;
    }

    return new Promise((resolve) => {
      const options = {
        key: key_id,
        amount,
        currency: currency || 'INR',
        order_id: gateway_order_id,
        name: config?.site?.name || 'Store',
        description: `Order ${order.order_number}`,
        theme: { color: config?.theme?.primary_color || '#4F46E5' },
        prefill: {
          name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        handler: async (response) => {
          // Razorpay success — verify server-side
          try {
            await paymentsApi.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setStatus('success');
            onSuccess(order.order_number);
            resolve();
          } catch (err) {
            setError(err.response?.data?.error?.message || 'Payment verification failed. Contact support.');
            setStatus('failed');
            resolve();
          }
        },
        modal: {
          ondismiss: () => {
            // User closed the modal without paying
            setError('Payment was cancelled. You can retry from your order page.');
            setStatus('failed');
            resolve();
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setError(response.error?.description || 'Payment failed. Please retry.');
        setStatus('failed');
        resolve();
      });
      rzp.open();
    });
  }, [onSuccess]);

  const retry = useCallback(() => {
    if (_lastArgs) {
      const { paymentInitiation, order, user, config } = _lastArgs;
      pay(paymentInitiation, order, user, config);
    }
  }, [_lastArgs, pay]);

  return { pay, status, error, retry };
};

export default usePayment;
