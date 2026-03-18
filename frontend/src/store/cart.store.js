import { create } from 'zustand';

const useCartStore = create((set) => ({
  items: [],
  appliedCoupon: null,
  itemCount: 0,
  subtotal: 0,
  isLoading: false,

  // Sync entire cart from API response (cart object from GET /cart or any mutation)
  setCart: (cartData) =>
    set({
      items: cartData.items || [],
      appliedCoupon: cartData.applied_coupon || null,
      itemCount: cartData.item_count || 0,
      subtotal: cartData.subtotal || 0,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () =>
    set({
      items: [],
      appliedCoupon: null,
      itemCount: 0,
      subtotal: 0,
    }),
}));

export default useCartStore;
