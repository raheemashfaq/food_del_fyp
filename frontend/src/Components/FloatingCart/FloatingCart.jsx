import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FloatingCart.css';
import { StoreContext } from '../../Context/StoreContext';
import { formatPKR } from '../../utils/format';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';

const FloatingCart = ({ setShowLogin }) => {
  const { cartItems, getTotalCartAmount, token, food_list } = useContext(StoreContext);
  const [isVisible, setIsVisible] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  // Calculate total items in cart
  useEffect(() => {
    // Make sure cartItems is an object
    if (typeof cartItems !== 'object' || cartItems === null) {
      setIsVisible(false);
      setCartCount(0);
      return;
    }
    
    // Filter out items with quantity 0 or less
    const validCartItems = Object.fromEntries(
      Object.entries(cartItems).filter(([itemId, quantity]) => {
        // Ensure quantity is a valid number greater than 0
        const numQuantity = Number(quantity);
        return !isNaN(numQuantity) && numQuantity > 0;
      })
    );
    
    // Calculate total items from valid cart items only
    const totalItems = Object.values(validCartItems).reduce((sum, quantity) => {
      const numQuantity = Number(quantity);
      return sum + (isNaN(numQuantity) ? 0 : numQuantity);
    }, 0);
    
    setCartCount(totalItems);
    
    // Only show floating cart when there are actual items with valid quantities
    const shouldShow = totalItems > 0 && Object.keys(validCartItems).length > 0;
    setIsVisible(shouldShow);
  }, [cartItems]);

  const handleViewCart = () => {
    navigate('/cart');
  };

  const handleCheckout = () => {
    if (!token) {
      toast.warning("Please login first before proceeding to checkout!", {
        position: "top-center",
        autoClose: 4000,
      });
      setShowLogin(true);
      return;
    }
    
    if (getTotalCartAmount() === 0) {
      toast.error("Your cart is empty! Please add some items before checkout.", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    
    navigate('/order');
  };

  if (!isVisible) return null;

  return (
    <div className="floating-cart">
      <div className="floating-cart-content">
        <div className="cart-info">
          <div className="cart-icon-section">
            <img src={assets.basket_icon} alt="Cart" className="cart-icon" />
            <span className="cart-count">{cartCount}</span>
          </div>
          <div className="cart-details">
            <p className="cart-items-text">{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
            <p className="cart-total-text">{formatPKR(getTotalCartAmount())}</p>
          </div>
        </div>
        
        <div className="cart-actions">
          <button className="view-cart-btn" onClick={handleViewCart}>
            View Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingCart;