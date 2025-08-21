import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const frontend_url = "http://localhost:5173";

const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address, paymentMethod } = req.body;

    const newOrder = new orderModel({
      userId,
      items,
      amount,
      address,
      paymentMethod,
      payment: paymentMethod === "CashOnDelivery" ? false : undefined
    });

    await newOrder.save();
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    if (paymentMethod === "CashOnDelivery") {
      return res.json({
        success: true,
        message: "Order placed with Cash on Delivery.",
        orderId: newOrder._id
      });
    }

    const line_items = items.map(item => ({
      price_data: {
        currency: "pkr",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity
    }));

    line_items.push({
      price_data: {
        currency: "pkr",
        product_data: { name: "Delivery Charges" },
        unit_amount: 200 * 100,
      },
      quantity: 1
    });

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: 'payment',
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ success: false, message: "Order processing failed." });
  }
};

const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (!orderId) return res.status(400).json({ success: false, message: "Order ID required." });

    if (success === true || success === "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Payment successful." });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Payment failed. Order deleted." });
    }
  } catch (error) {
    console.error("Error verifying order:", error);
    res.status(500).json({ success: false, message: "Verification error." });
  }
};

const markPaid = async (req, res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId, {
      payment: true,
      paymentMethod: "CashOnDelivery"
    });
    res.json({ success: true, message: "COD order marked as paid." });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error marking as paid." });
  }
};

const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.body.userId });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error fetching user orders." });
  }
};

const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error fetching all orders." });
  }
};

const updateStatus = async (req, res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
    res.json({ success: true, message: "Status updated." });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error updating status." });
  }
};

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus, markPaid };
