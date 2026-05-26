import React, { useContext, useState, useEffect } from 'react';
import './MyOrders.css';
import { StoreContext } from '../../Context/StoreContext';
import axios from 'axios';
import { assets } from '../../assets/assets';
import { formatPKR } from '../../utils/format';
import Skeleton from '../../Components/Skeleton/Skeleton';

const MyOrders = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { url, token } = useContext(StoreContext);
const fetchAllOrders = async () => {
    try {
      const response = await axios.get(`${url}/api/order/list`);
      if (response.data.success) {
        setOrders(response.data.data);
      } else {
        toast.error("Error fetching orders");
      }
    } catch (error) {
      toast.error("Server error");
    }
  };
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${url}/api/order/userorders`, {}, {
        headers: { token }
      });
      setData(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  return (
    <div className="my-orders">
      <h2>My Orders</h2>
      <div className="container">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="my-orders-order">
              <Skeleton width="50px" height="50px" radius="50%" />
              <Skeleton width="90%" height="14px" />
              <Skeleton width="60px" height="14px" />
              <Skeleton width="50px" height="14px" />
              <Skeleton width="80px" height="14px" />
              <Skeleton width="70px" height="14px" />
              <div className="order-buttons">
                <Skeleton width="100%" height="32px" radius="6px" />
              </div>
            </div>
          ))
        ) : data.length === 0 ? (
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
