import React, { useState, useContext, useEffect } from 'react';
import './PlaceOrder.css';
import { StoreContext } from '../../Context/StoreContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatPKR } from '../../utils/format';

const PlaceOrder = () => {
  const { getTotalCartAmount, token, food_list, cartItems, url } = useContext(StoreContext);
  const navigate = useNavigate();

  const [data, setData] = useState({
    firstName: "", lastName: "", email: "", street: "",
    city: "", state: "", zipcode: "", country: "", phone: ""
  });

  const [paymentMethod, setPaymentMethod] = useState("Stripe"); // 🆕 Payment toggle

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    try {
      let orderItems = [];
      food_list.forEach((item) => {
        if (cartItems[item._id] > 0) {
          orderItems.push({ ...item, quantity: cartItems[item._id] });
        }
      });

      let orderData = {
        address: data,
        items: orderItems,
        amount: getTotalCartAmount() + 200,
        paymentMethod // 🆕 Include payment method
      };

      const response = await axios.post(`${url}/api/order/place`, orderData, {
        headers: { token }
      });

      if (response.data.success) {
        if (paymentMethod === "Stripe") {
          window.location.replace(response.data.session_url);
        } else {
          navigate(`/verify?success=true&orderId=${response.data.orderId}`);
        }
      } else {
        alert("Order placement failed. Please try again.");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("An error occurred while placing the order. Please try again later.");
    }
  };

  useEffect(() => {
    if (!token || getTotalCartAmount() === 0) {
      navigate('/cart');
    }
  }, [token, navigate, getTotalCartAmount]);

  return (
    <form onSubmit={placeOrder} className='place-order'>
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="multi-fields">
          <input required name='firstName' onChange={onChangeHandler} value={data.firstName} type="text" placeholder='First name'/>
          <input required name='lastName' onChange={onChangeHandler} value={data.lastName} type="text" placeholder='Last name'/>
        </div>
        <input required name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Email address'/>
        <input required name='street' onChange={onChangeHandler} value={data.street} type="text" placeholder='Street'/>
        <div className="multi-fields">
          <input required name='city' onChange={onChangeHandler} value={data.city} type="text" placeholder='City'/>  
          <input required name='state' onChange={onChangeHandler} value={data.state} type="text" placeholder='State'/>
        </div>
        <div className="multi-fields">
          <input required name='zipcode' onChange={onChangeHandler} value={data.zipcode} type="text" placeholder='Zip code'/>  
          <input required name='country' onChange={onChangeHandler} value={data.country} type="text" placeholder='Country'/>
        </div>
        <input required name='phone' onChange={onChangeHandler} value={data.phone} type='text' placeholder='Phone' />

        {/* 🆕 Payment Method Toggle */}
        <div className="payment-method">
          <p className="title">Select Payment Method</p>
          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="Stripe"
              checked={paymentMethod === "Stripe"}
              onChange={() => setPaymentMethod("Stripe")}
            />
            Pay Online (Stripe)
          </label>
          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="CashOnDelivery"
              checked={paymentMethod === "CashOnDelivery"}
              onChange={() => setPaymentMethod("CashOnDelivery")}
            />
            Cash on Delivery
          </label>
        </div>
      </div>

      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div className="cart-total-details">
            <p>Subtotal</p>
            <p>{formatPKR(getTotalCartAmount())}</p>
          </div>
          <hr/>
          <div className="cart-total-details">
            <p>Delivery Fee</p>
            <p>{getTotalCartAmount() === 0 ? formatPKR(0) : formatPKR(200)}</p>
          </div>
          <hr/>
          <div className="cart-total-details">
            <b>Total</b>
            <b>
              {getTotalCartAmount() === 0
                ? formatPKR(0)
                : formatPKR(getTotalCartAmount() + 200)}
            </b>
          </div>
          <button type='submit'>
            {paymentMethod === "Stripe" ? "Proceed to Payment" : "Place COD Order"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
