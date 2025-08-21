import React, { useContext, useState, useEffect } from 'react';
import './MyOrders.css';
import { StoreContext } from '../../Context/StoreContext';
import axios from 'axios';
import { assets } from '../../assets/assets';
import { formatPKR } from '../../utils/format';

const MyOrders = () => {
  const [data, setData] = useState([]);
  const { url, token } = useContext(StoreContext);

  const fetchOrders = async () => {
    try {
      const response = await axios.post(`${url}/api/order/userorders`, {}, {
        headers: { token }
      });
      setData(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  return (
    <div className="my-orders">
      <h2>My Orders</h2>
      <div className="container">
        {data.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          data.map((order, index) => (
            <div key={index} className="my-orders-order">
              <img src={assets.parcel_icon} alt="Parcel Icon" />
              <p>
                {order.items.map((item, i) => (
                  <span key={i}>
                    {item.name} x {item.quantity}
                    {i < order.items.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
              <p>{formatPKR(order.amount)}</p>
              <p>Items: {order.items.length}</p>

              {/* ✅ Payment Method Display */}
              <p>
                <b>Payment:</b>{' '}
                {order.paymentMethod === 'CashOnDelivery'
                  ? 'COD 💵'
                  : 'Online 💳'}
              </p>

              <p>
                <span>&#x25cf;</span> <b>{order.status}</b>
              </p>
              <div className="order-buttons">
                <button
                  onClick={() => navigator.clipboard.writeText(order._id)}
                  title="Copy Order ID"
                >
                  Copy ID
                </button>
                <button onClick={fetchOrders}>Track Order</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyOrders;
