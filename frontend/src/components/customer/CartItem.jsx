import { useState } from 'react';
import { Trash2, Tag, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import { getImageSrc } from '../../lib/utils';

const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect width="80" height="80" fill="%23f3f4f6"/%3E%3C/svg%3E';

/**
 * CartItem — used in both CartDrawer and CartPage.
 *
 * Props:
 *   item        — cart item object from API
 *   onUpdate    — async (variantId, newQty) => void
 *   onRemove    — async (variantId) => void
 *   compact     — boolean, smaller layout for drawer
 */
const CartItem = ({ item, onUpdate, onRemove, compact = false }) => {
  const [updating, setUpdating] = useState(false);
  const [qtyError, setQtyError] = useState('');

  const {
    variant_id,
    product_name,
    variant_name,
    brand,
    image_url,
    unit_price,
    quantity,
    stock_quantity,
    line_total_after_discount,
    offer,
    offer_discount,
  } = item;

  const imgSrc = getImageSrc(image_url) || PLACEHOLDER_IMG;
  const maxQty = stock_quantity || 99;
  const hasOffer = offer && offer_discount > 0;

  const handleQtyChange = async (delta) => {
    const newQty = Math.max(1, Math.min(maxQty, quantity + delta));
    if (newQty === quantity) return;
    setUpdating(true);
    setQtyError('');
    try {
      await onUpdate(variant_id, newQty);
    } catch (err) {
      setQtyError(err?.response?.data?.error?.message || 'Could not update quantity.');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    setUpdating(true);
    try {
      await onRemove(variant_id);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={cn('flex gap-3', updating && 'opacity-60')}>
      {/* Image */}
      <img
        src={imgSrc}
        alt={product_name}
        className={cn('rounded-lg object-cover flex-shrink-0 bg-gray-100', compact ? 'w-16 h-16' : 'w-20 h-20')}
        onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
      />

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            {brand && <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{brand}</p>}
            <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">{product_name}</p>
            {variant_name && (
              <p className="text-xs text-muted-foreground mt-0.5">{variant_name}</p>
            )}
          </div>
          <button
            onClick={handleRemove}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Remove"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {/* Offer badge */}
        {hasOffer && (
          <div className="flex items-center gap-1 mt-1">
            <Tag size={11} className="text-green-600" />
            <span className="text-[10px] text-green-600 font-medium">
              {offer.offer_type === 'PERCENT'
                ? `${offer.discount_value}% OFF`
                : offer.offer_type === 'BXGY'
                ? 'BXGY Offer'
                : `₹${offer.discount_value} OFF`}
              {offer.source && ` (${offer.source})`}
            </span>
          </div>
        )}

        {/* Qty controls + price */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => handleQtyChange(-1)}
              disabled={quantity <= 1 || updating}
              className="px-2 py-1 text-gray-600 hover:bg-gray-50 text-sm disabled:opacity-40"
            >
              −
            </button>
            <span className="px-2.5 py-1 text-sm font-semibold border-x border-gray-200 min-w-[2rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => handleQtyChange(1)}
              disabled={quantity >= maxQty || updating}
              className="px-2 py-1 text-gray-600 hover:bg-gray-50 text-sm disabled:opacity-40"
            >
              +
            </button>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(line_total_after_discount)}
            </p>
            {hasOffer && (
              <p className="text-xs text-muted-foreground line-through">
                {formatCurrency(unit_price * quantity)}
              </p>
            )}
          </div>
        </div>
        {qtyError && (
          <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
            <AlertCircle size={11} /> {qtyError}
          </p>
        )}
      </div>
    </div>
  );
};

export default CartItem;
