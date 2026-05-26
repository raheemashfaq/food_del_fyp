import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import promoModel from "../models/promoModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const frontend_url = "http://localhost:5173";

const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address, paymentMethod, promoCode, discount } = req.body;

    // Verify promo code and discount on server side
    let verifiedDiscount = 0;
    let verifiedPromoCode = null;

    if (promoCode) {
      const promo = await promoModel.findOne({ code: promoCode.toUpperCase(), isActive: true });
      if (promo) {
        const isExpired = promo.expiresAt && new Date() > promo.expiresAt;
        const isOverLimit = promo.usageLimit !== null && promo.usedCount >= promo.usageLimit;

        // Calculate subtotal from items
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        if (!isExpired && !isOverLimit && subtotal >= promo.minOrderAmount) {
          const isProductSpecific = promo.applicableProducts && promo.applicableProducts.length > 0;
          let discountBase = subtotal;

          if (isProductSpecific) {
            const applicableIds = promo.applicableProducts.map(id => id.toString());
            let applicableQty = 0;
            let applicableSubtotal = 0;
            for (const item of items) {
              if (applicableIds.includes(item._id)) {
                applicableQty += item.quantity;
                applicableSubtotal += item.price * item.quantity;
              }
            }
            // Skip promo if min quantity not met or no applicable items
            if (applicableQty === 0 || (promo.minQuantity > 0 && applicableQty < promo.minQuantity)) {
              discountBase = 0;
            } else {
              discountBase = applicableSubtotal;
            }
          }

          if (discountBase > 0) {
            if (promo.discountType === "percentage") {
              verifiedDiscount = Math.round((discountBase * promo.discountValue) / 100);
              if (promo.maxDiscount && verifiedDiscount > promo.maxDiscount) {
                verifiedDiscount = promo.maxDiscount;
              }
            } else {
              verifiedDiscount = promo.discountValue;
            }
            if (verifiedDiscount > discountBase) verifiedDiscount = discountBase;
            verifiedPromoCode = promo.code;

            // Increment usage count
            promo.usedCount += 1;
            await promo.save();
          }
        }
      }
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const finalAmount = subtotal - verifiedDiscount + 200; // subtotal - discount + delivery

    const newOrder = new orderModel({
      userId,
      items,
      amount: finalAmount,
      address,
      paymentMethod,
      promoCode: verifiedPromoCode,
      discount: verifiedDiscount,
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

    // Add discount as negative line item if promo applied
    if (verifiedDiscount > 0) {
      line_items.push({
        price_data: {
          currency: "pkr",
          product_data: { name: `Discount (${verifiedPromoCode})` },
          unit_amount: Math.round(verifiedDiscount * 100),
        },
        quantity: 1,
      });
    }

    const sessionConfig = {
      line_items,
      mode: 'payment',
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
    };

    // Apply discount as a Stripe coupon
    if (verifiedDiscount > 0) {
      // Remove the negative line item approach, use Stripe discounts instead
      line_items.pop(); // remove the discount line item we just added
      const coupon = await stripe.coupons.create({
        amount_off: verifiedDiscount * 100,
        currency: "pkr",
        duration: "once",
        name: `Promo: ${verifiedPromoCode}`
      });
      sessionConfig.discounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

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
    const orders = await orderModel.find({ userId: req.body.userId }).sort({ date: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error fetching user orders." });
  }
};

const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}).sort({ date: -1 });
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
