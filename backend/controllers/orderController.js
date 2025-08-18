import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Place Order (PKR native)
const placeOrder = async (req, res) => {
  const frontend_url = "http://localhost:5173";

  try {
    const newOrder = new orderModel({
      userId: req.body.userId,
      items: req.body.items,
      amount: req.body.amount, // Rs total including delivery
      address: req.body.address
    });
    await newOrder.save();

    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

    const line_items = req.body.items.map(item => ({
      price_data: {
        currency: "pkr",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100), // Rs → paisa
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
    res.status(500).json({
      success: false,
      message: "Order processing failed. Please try again later."
    });
  }
};

const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required." });
    }
    if (success === true || success === "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Payment successful. Order marked as paid." });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Payment failed. Order deleted." });
    }
  } catch (error) {
    console.error("Error verifying order:", error);
    res.status(500).json({ success: false, message: "Internal server error during order verification." });
  }
};

const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.body.userId });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

const updateStatus = async (req, res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus };
