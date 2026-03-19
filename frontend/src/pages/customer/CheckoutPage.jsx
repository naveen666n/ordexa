import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Plus, Loader2, AlertCircle, CheckCircle2, CreditCard, RotateCcw, XCircle } from 'lucide-react';
import cartApi from '../../api/cart.api';
import ordersApi from '../../api/orders.api';
import addressesApi from '../../api/addresses.api';
import useCartStore from '../../store/cart.store';
import useAuthStore from '../../store/auth.store';
import usePayment from '../../hooks/usePayment';
import { useConfig } from '../../context/ConfigContext';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { formatCurrency } from '../../lib/formatters';
import { getImageSrc } from '../../lib/utils';

// ─── Add Address Form ─────────────────────────────────────────────────────────

const AddressForm = ({ onSaved, onCancel }) => {
  const [form, setForm] = useState({
    full_name: '', phone: '', address_line1: '', address_line2: '',
    city: '', state: '', postal_code: '', country: 'India', label: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await addressesApi.create(form);
      onSaved(res.data.data.address);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  const field = (label, key, required, placeholder = '') => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle size={14} /> {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        {field('Full Name', 'full_name', true)}
        {field('Phone', 'phone', false)}
      </div>
      {field('Address Line 1', 'address_line1', true)}
      {field('Address Line 2', 'address_line2', false, 'Apartment, suite, etc.')}
      <div className="grid grid-cols-3 gap-3">
        {field('City', 'city', true)}
        {field('State', 'state', true)}
        {field('Postal Code', 'postal_code', true)}
      </div>
      {field('Label', 'label', false, 'Home / Office')}
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
          Save Address
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
};

// ─── Address Card ─────────────────────────────────────────────────────────────

const AddressCard = ({ address, selected, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(address.id)}
    className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
      selected ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white hover:border-gray-200'
    }`}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 text-sm space-y-0.5">
        <p className="font-semibold text-gray-900">
          {address.full_name}
          {address.label && (
            <span className="ml-2 text-[10px] font-medium text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full uppercase">
              {address.label}
            </span>
          )}
          {address.is_default && (
            <span className="ml-2 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">
              Default
            </span>
          )}
        </p>
        {address.phone && <p className="text-gray-500">{address.phone}</p>}
        <p className="text-gray-600">
          {address.address_line1}{address.address_line2 ? `, ${address.address_line2}` : ''}
        </p>
        <p className="text-gray-600">{address.city}, {address.state} – {address.postal_code}</p>
        <p className="text-gray-500">{address.country}</p>
      </div>
      {selected && <CheckCircle2 size={18} className="text-primary flex-shrink-0 mt-0.5" />}
    </div>
  </button>
);

// ─── Order Summary Panel ──────────────────────────────────────────────────────

const OrderSummaryPanel = ({ summary, summaryLoading, cart }) => {
  const subtotal = summary?.subtotal || cart?.subtotal || 0;
  const discount = summary?.discount_amount || 0;
  const discountSource = summary?.discount_source || '';
  const shipping = summary?.shipping_amount ?? null;
  const tax = summary?.tax_amount ?? null;
  const total = summary?.total_amount || subtotal;

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 p-6 space-y-4">
      <h2 className="font-semibold text-gray-900">Order Summary</h2>

      {cart?.items?.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {cart.items.map((item) => (
            <div key={item.variant_id} className="flex items-center gap-3 text-sm">
              {item.image_url && (
                <img src={getImageSrc(item.image_url)} alt={item.product_name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-gray-800">{item.product_name}</p>
                <p className="text-muted-foreground text-xs">Qty: {item.quantity}</p>
              </div>
              <span className="font-medium text-gray-900">{formatCurrency(item.line_total)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t pt-3 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="truncate pr-2">{discountSource || 'Discount'}</span>
            <span>−{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          {summaryLoading || shipping === null ? <Skeleton className="h-4 w-12" /> : (
            <span>{shipping === 0 ? <span className="text-green-600">Free</span> : formatCurrency(shipping)}</span>
          )}
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax</span>
          {summaryLoading || tax === null ? <Skeleton className="h-4 w-12" /> : (
            <span>{formatCurrency(tax)}</span>
          )}
        </div>
      </div>

      <div className="border-t pt-3 flex justify-between font-bold text-gray-900">
        <span>Total</span>
        {summaryLoading ? <Skeleton className="h-5 w-20" /> : <span>{formatCurrency(total)}</span>}
      </div>
    </div>
  );
};

// ─── Payment Step ─────────────────────────────────────────────────────────────

const PaymentStep = ({ order, paymentInitiation, onCancel }) => {
  const { user } = useAuthStore();
  const config = useConfig();

  const { pay, status, error, retry } = usePayment({
    onSuccess: (orderNumber) => {
      // navigate is not available here; we use window.location for simplicity
      // after payment, go to confirmation
      window.location.replace(`/order-confirmation/${orderNumber}`);
    },
    onCancel,
  });

  const isMock = paymentInitiation?.key_id === 'mock';
  const isProcessing = status === 'processing';
  const isFailed = status === 'failed';

  return (
    <div className="space-y-4">
      {/* Order created banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <CheckCircle2 size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">
            Order <span className="font-mono">{order.order_number}</span> created
          </p>
          <p className="text-xs text-blue-600 mt-0.5">
            Complete payment to confirm your order.
          </p>
        </div>
      </div>

      {/* Mock gateway notice */}
      {isMock && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
          <p className="font-semibold text-amber-800">Test / Mock Payment Mode</p>
          <p className="text-amber-700 text-xs mt-0.5">
            No real money will be charged. Click below to simulate a successful payment.
          </p>
        </div>
      )}

      {/* Error state */}
      {isFailed && error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Amount */}
      <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center justify-between">
        <span className="text-sm text-gray-600">Amount to pay</span>
        <span className="text-xl font-bold text-gray-900">
          {formatCurrency(order.total_amount)}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        {!isFailed ? (
          <Button
            size="lg"
            className="w-full"
            disabled={isProcessing}
            onClick={() => pay(paymentInitiation, order, user, config)}
          >
            {isProcessing ? (
              <><Loader2 size={16} className="animate-spin mr-2" />Processing…</>
            ) : isMock ? (
              <><CreditCard size={16} className="mr-2" />Simulate Payment</>
            ) : (
              <><CreditCard size={16} className="mr-2" />Pay {formatCurrency(order.total_amount)}</>
            )}
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full"
            onClick={retry}
          >
            <RotateCcw size={16} className="mr-2" />Retry Payment
          </Button>
        )}

        <Button
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel — Go to my orders
        </Button>
      </div>
    </div>
  );
};

// ─── CheckoutPage ─────────────────────────────────────────────────────────────

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { reset: resetCart } = useCartStore();

  // checkout step: 'form' | 'payment'
  const [step, setStep] = useState('form');
  const [placedOrder, setPlacedOrder] = useState(null);
  const [paymentInitiation, setPaymentInitiation] = useState(null);

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState('');

  const { data: cartData, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get().then((r) => r.data.data.cart),
    staleTime: 0,
  });

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['cart-summary'],
    queryFn: () => cartApi.getSummary().then((r) => r.data.data.summary),
    enabled: (cartData?.items?.length || 0) > 0,
    staleTime: 0,
  });

  const { data: addressesData, isLoading: addressesLoading, refetch: refetchAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesApi.list().then((r) => r.data.data.addresses),
  });

  const addresses = addressesData || [];
  const cart = cartData || { items: [], item_count: 0, subtotal: 0, applied_coupon: null };
  const effectiveAddressId = selectedAddressId ?? (addresses.find((a) => a.is_default)?.id ?? null);

  const handleAddressSaved = (address) => {
    refetchAddresses();
    setSelectedAddressId(address.id);
    setShowAddForm(false);
  };

  const handlePlaceOrder = async () => {
    setPlaceError('');
    setPlacing(true);
    try {
      const res = await ordersApi.create({
        address_id: effectiveAddressId || undefined,
        notes: notes.trim() || undefined,
      });
      const { order, payment_initiation } = res.data.data;
      resetCart();
      setPlacedOrder(order);
      setPaymentInitiation(payment_initiation);
      setStep('payment');
    } catch (err) {
      setPlaceError(err.response?.data?.error?.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-7 w-32 mb-8" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40 rounded-xl" /><Skeleton className="h-40 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!cart.items?.length && step === 'form') {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">Your cart is empty.</p>
        <Button onClick={() => navigate('/catalog')}>Start Shopping</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb steps */}
      <div className="flex items-center gap-2 text-sm mb-8">
        <span className={step === 'form' ? 'font-semibold text-primary' : 'text-muted-foreground'}>
          1. Order Details
        </span>
        <span className="text-gray-300">›</span>
        <span className={step === 'payment' ? 'font-semibold text-primary' : 'text-muted-foreground'}>
          2. Payment
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left panel */}
        <div className="lg:col-span-2 space-y-6">

          {step === 'form' ? (
            <>
              {/* Delivery Address */}
              <section className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin size={16} className="text-primary" />
                    Delivery Address
                  </h2>
                  {!showAddForm && (
                    <button onClick={() => setShowAddForm(true)}
                      className="flex items-center gap-1 text-sm text-primary hover:underline">
                      <Plus size={14} /> Add New
                    </button>
                  )}
                </div>

                {showAddForm ? (
                  <AddressForm onSaved={handleAddressSaved} onCancel={() => setShowAddForm(false)} />
                ) : addressesLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" />
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    <p className="mb-3">No saved addresses. Add one to continue.</p>
                    <Button size="sm" onClick={() => setShowAddForm(true)}>
                      <Plus size={14} className="mr-1" /> Add Address
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <AddressCard key={address.id} address={address}
                        selected={effectiveAddressId === address.id}
                        onSelect={setSelectedAddressId} />
                    ))}
                  </div>
                )}
              </section>

              {/* Order Notes */}
              <section className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-3">Order Notes</h2>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions? (optional)"
                  rows={3} maxLength={500}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </section>

              {placeError && (
                <p className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
                  <AlertCircle size={15} /> {placeError}
                </p>
              )}

              <Button className="w-full" size="lg" onClick={handlePlaceOrder}
                disabled={placing || (!effectiveAddressId && addresses.length > 0 && !showAddForm)}>
                {placing ? (
                  <><Loader2 size={16} className="animate-spin mr-2" />Placing Order…</>
                ) : (
                  `Review & Pay · ${formatCurrency(summaryData?.total_amount || cart.subtotal)}`
                )}
              </Button>
            </>
          ) : (
            /* Payment step */
            <section className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-5">
                <CreditCard size={16} className="text-primary" />
                Complete Payment
              </h2>
              <PaymentStep
                order={placedOrder}
                paymentInitiation={paymentInitiation}
                onCancel={() => navigate('/orders')}
              />
            </section>
          )}
        </div>

        {/* Right — Order Summary */}
        <div className="lg:sticky lg:top-24">
          <OrderSummaryPanel
            summary={summaryData}
            summaryLoading={step === 'form' ? summaryLoading : false}
            cart={step === 'form' ? cart : { items: placedOrder?.items || [] }}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
