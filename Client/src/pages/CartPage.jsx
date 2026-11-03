import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { openCart } from '../redux/slices/cartSlice';

/**
 * CartPage:
 * Automatically transitions to the sleek Cart Drawer experience,
 * ensuring the drawer is the primary cart interaction across the site.
 */
const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(openCart());
    navigate('/products', { replace: true });
  }, [dispatch, navigate]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default CartPage;
