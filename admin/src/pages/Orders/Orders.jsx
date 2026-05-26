import React, { useState, useEffect } from 'react';
import './Orders.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../../assets/assets';
import Skeleton from '../../components/Skeleton/Skeleton';

const Orders = () => {
  const url = import.meta.env.VITE_API_URL
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllOrders = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${url}/api/order/list`);
      if (response.data.success) {
        setOrders(response.data.data);
      } else {
        toast.error("Error fetching orders");
      }
    } catch (error) {
      toast.error("Server error");
    } finally {
      setIsLoading(false);
    }
  };

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(`${url}/api/order/status`, {
        orderId,
        status: event.target.value
      });
      if (response.data.success) {
        await fetchAllOrders();
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const filteredOrders = filter
    ? orders.filter(order => order.paymentMethod === filter)
    : orders;

  const codCount = orders.filter(o => o.paymentMethod === "CashOnDelivery").length;
  const stripeCount = orders.filter(o => o.paymentMethod === "Stripe").length;

  return (
    <div className="order add">
      <h3>Order Page</h3>

      {/* 📊 Summary Dashboard */}
      <div className="order-summary">
        <p><b>Total Orders:</b> {orders.length}</p>
        <p><b>COD Orders:</b> {codCount}</p>
        <p><b>Stripe Orders:</b> {stripeCount}</p>
      </div>

      {/* 🔍 Filter Dropdown */}
      <div className="order-filter">
        <label>Filter by Payment Method:</label>
        <select onChange={(e) => setFilter(e.target.value)}>
          <option value="">All</option>
          <option value="CashOnDelivery">Cash on Delivery</option>
          <option value="Stripe">Online (Stripe)</option>
        </select>
      </div>

      <div className="order-list">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className='order-item'>
              <Skeleton width="50px" height="50px" radius="6px" />
              <div>
                <Skeleton width="80%" height="14px" />
                <Skeleton width="50%" height="14px" style={{ marginTop: "10px" }} />
                <Skeleton width="90%" height="12px" style={{ marginTop: "10px" }} />
                <Skeleton width="40%" height="12px" style={{ marginTop: "8px" }} />
              </div>
              <Skeleton width="60px" height="14px" />
              <Skeleton width="70px" height="14px" />
              <Skeleton width="100%" height="14px" />
              <Skeleton width="100%" height="32px" radius="6px" />
            </div>
          ))
        ) : (
          filteredOrders.map((order, index) => (
          <div key={index} className='order-item'>
            <img src={assets.parcel_icon} alt="" />
            <div>
              <p className='ordr-item-food'>
                {order.items.map((item, idx) =>
                  idx === order.items.length - 1
                    ? `${item.name} x ${item.quantity}`
                    : `${item.name} x ${item.quantity}, `
                )}
              </p>
              <p className='order-item-name'>
                {order.address.firstName + " " + order.address.lastName}
              </p>
              <div className='order-item-address'>
                <p>{order.address.street + " , "}</p>
                <p>
                  {order.address.city + " , " + order.address.state + ", " +
                    order.address.country + ", " + order.address.zipcode}
                </p>
              </div>
              <p className='order-item-phone'>{order.address.phone}</p>
            </div>
            <p>Items: {order.items.length}</p>
            <p>Rs. {order.amount}</p>

            {/* ✅ Payment Method Display */}
            <p>
              <b>Payment Method:</b>{" "}
              {order.paymentMethod === "CashOnDelivery"
                ? "Cash on Delivery 💵"
                : "Online (Stripe) 💳"}
            </p>

            <select
              onChange={(event) => statusHandler(event, order._id)}
              value={order.status}
            >
              <option value="Food Processing">Food Processing</option>
              <option value="Out for delivery">Out for delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;
