import useCartStore from '../store/cart.store';

const useCart = () => {
  const { items, coupon, itemCount, subtotal, setCart, reset } = useCartStore();

  return {
    items,
    coupon,
    itemCount,
    subtotal,
    setCart,
    reset,
    isEmpty: items.length === 0,
  };
};

export default useCart;
