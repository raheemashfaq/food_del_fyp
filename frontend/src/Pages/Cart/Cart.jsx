import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Cart.css';
import { StoreContext } from '../../Context/StoreContext';
import { formatPKR } from '../../utils/format';
import { toast } from 'react-toastify';
import axios from 'axios';

const Cart = ({ setShowLogin }) => {
  const { cartItems, food_list, removeFromCart, getTotalCartAmount, url, token,
    promoCode, setPromoCode, promoDiscount, appliedPromo, applyPromoCode, removePromoCode
  } = useContext(StoreContext);
  const navigate = useNavigate();
  const [promoLoading, setPromoLoading] = useState(false);
  const [availablePromos, setAvailablePromos] = useState([]);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const res = await axios.get(`${url}/api/promo/active`);
        if (res.data.success) {
          setAvailablePromos(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching promos:", err);
      }
    };
    fetchPromos();
  }, [url]);

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
          <p>Remove</p>
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
            {promoDiscount > 0 && (
              <>
                <div className="cart-total-details cart-discount">
                  <p>Discount ({appliedPromo})</p>
                  <p>-{formatPKR(promoDiscount)}</p>
                </div>
                <hr />
              </>
            )}
            <div className="cart-total-details">
              <b>Total</b>
              <b>
                {getTotalCartAmount() === 0
                  ? formatPKR(0)
                  : formatPKR(getTotalCartAmount() + 200 - promoDiscount)}
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
            <p>If you have a promo code, enter it here</p>
            {appliedPromo ? (
              <div className="cart-promo-applied">
                <div className="promo-applied-info">
                  <span className="promo-tag">{appliedPromo}</span>
                  <span className="promo-saving">You save {formatPKR(promoDiscount)}</span>
                </div>
                <button onClick={removePromoCode} className="promo-remove-btn">Remove</button>
              </div>
            ) : (
              <div className="cart-promocode-input">
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  disabled={promoLoading}
                />
                <button
                  onClick={async () => {
                    if (!promoCode.trim()) {
                      toast.warning("Please enter a promo code.");
                      return;
                    }
                    if (getTotalCartAmount() === 0) {
                      toast.warning("Add items to cart first.");
                      return;
                    }
                    setPromoLoading(true);
                    const result = await applyPromoCode(promoCode);
                    setPromoLoading(false);
                    if (result.success) {
                      toast.success(result.message);
                    } else {
                      toast.error(result.message);
                    }
                  }}
                  disabled={promoLoading}
                >
                  {promoLoading ? "Applying..." : "Submit"}
                </button>
              </div>
            )}

            {/* Available Promo Codes */}
            {!appliedPromo && availablePromos.length > 0 && (
              <div className="available-promos">
                <p className="available-promos-title">Available Offers</p>
                {availablePromos.map((promo) => {
                  const subtotal = getTotalCartAmount();
                  const isEligible = subtotal >= promo.minOrderAmount && subtotal > 0;
                  const needsMore = promo.minOrderAmount > 0 && subtotal < promo.minOrderAmount;

                  // Product-specific promo eligibility
                  const isProductSpecific = promo.applicableProducts && promo.applicableProducts.length > 0;
                  let productName = '';
                  let applicableQtyInCart = 0;
                  let needsMoreQty = false;

                  if (isProductSpecific) {
                    const pid = promo.applicableProducts[0];
                    const food = food_list.find(f => f._id === pid);
                    if (food) productName = food.name;
                    applicableQtyInCart = cartItems[pid] || 0;
                    if (promo.minQuantity > 0 && applicableQtyInCart < promo.minQuantity) {
                      needsMoreQty = true;
                    }
                  }

                  const productEligible = !isProductSpecific || (applicableQtyInCart > 0 && !needsMoreQty);
                  const finalEligible = isEligible && productEligible;

                  return (
                    <div key={promo._id} className={`promo-card ${finalEligible ? '' : 'promo-card-disabled'}`}>
                      <div className="promo-card-left">
                        <span className="promo-card-code">{promo.code}</span>
                        <span className="promo-card-desc">
                          {promo.discountType === 'percentage'
                            ? `${promo.discountValue}% OFF${promo.maxDiscount ? ` (up to ${formatPKR(promo.maxDiscount)})` : ''}`
                            : `${formatPKR(promo.discountValue)} OFF`}
                          {isProductSpecific && <span style={{color: '#e67e22'}}> on {productName}</span>}
                        </span>
                        {isProductSpecific && promo.minQuantity > 0 && (
                          <span className="promo-card-min" style={{color: needsMoreQty ? '#dc3545' : '#28a745'}}>
                            Buy {promo.minQuantity}+ to unlock
                            {needsMoreQty && ` (you have ${applicableQtyInCart})`}
                          </span>
                        )}
                        {promo.minOrderAmount > 0 && (
                          <span className="promo-card-min">
                            Min order: {formatPKR(promo.minOrderAmount)}
                            {needsMore && <span className="promo-card-add"> - Add {formatPKR(promo.minOrderAmount - subtotal)} more</span>}
                          </span>
                        )}
                        {promo.expiresAt && (
                          <span className="promo-card-expiry">
                            Expires: {new Date(promo.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <button
                        className={`promo-card-apply ${finalEligible ? '' : 'promo-card-apply-disabled'}`}
                        disabled={!finalEligible || promoLoading}
                        onClick={async () => {
                          setPromoLoading(true);
                          setPromoCode(promo.code);
                          const result = await applyPromoCode(promo.code);
                          setPromoLoading(false);
                          if (result.success) {
                            toast.success(result.message);
                          } else {
                            toast.error(result.message);
                          }
                        }}
                      >
                        {finalEligible ? 'Apply' : 'Not Eligible'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;