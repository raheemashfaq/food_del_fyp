import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './Cart.css';
import { StoreContext } from '../../Context/StoreContext';
import { formatPKR } from '../../utils/format';
import { toast } from 'react-toastify';

const Cart = ({ setShowLogin }) => {
  const { cartItems, food_list, removeFromCart, getTotalCartAmount, url, token } = useContext(StoreContext);
  const navigate = useNavigate();

  const handleProceedToCheckout = () => {
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

  return (
    <div className="cart">
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p></p>
        </div>
        <br />
        <hr />
        {food_list.map((item) => {
          // Only render items that exist in cart with quantity > 0
          if (cartItems[item._id] && cartItems[item._id] > 0) {
            return (
              <div key={item._id}>
                <div className="cart-items-title cart-items-item">
                  <img src={`${url}/images/${item.image}`} alt={item.name} />
                  <p>{item.name}</p>
                  <p>{formatPKR(item.price)}</p>
                  <p>{cartItems[item._id]}</p>
                  <p>{formatPKR(item.price * cartItems[item._id])}</p>
                  <p onClick={() => removeFromCart(item._id)} className="cross">x</p>
                </div>
                <hr />
              </div>
            );
          }
          return null;
        })}
      </div>

      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>{formatPKR(getTotalCartAmount())}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>{getTotalCartAmount() === 0 ? formatPKR(0) : formatPKR(200)}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>
                {getTotalCartAmount() === 0
                  ? formatPKR(0)
                  : formatPKR(getTotalCartAmount() + 200)}
              </b>
            </div>
          </div>
          <button onClick={handleProceedToCheckout}>Proceed to Checkout</button>
          {!token && (
            <p style={{color: '#ff6347', fontSize: '14px', marginTop: '10px', textAlign: 'center'}}>
              * Please login to proceed with checkout
            </p>
          )}
        </div>

        <div className="cart-promocode">
          <div>
            <p>If you have a promocode enter it here</p>
            <div className="cart-promocode-input">
              <input type="text" placeholder="promocode" />
              <button>Submit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;