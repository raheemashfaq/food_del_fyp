import promoModel from "../models/promoModel.js";

// Admin: Create a promo code
const createPromo = async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxDiscount, usageLimit, expiresAt, applicableProducts, minQuantity } = req.body;

    const existing = await promoModel.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.json({ success: false, message: "Promo code already exists." });
    }

    const promo = new promoModel({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscount: maxDiscount || null,
      usageLimit: usageLimit || null,
      expiresAt: expiresAt || null,
      applicableProducts: applicableProducts || [],
      minQuantity: minQuantity || 0
    });

    await promo.save();
    res.json({ success: true, message: "Promo code created.", data: promo });
  } catch (error) {
    console.error("Error creating promo:", error);
    res.status(500).json({ success: false, message: "Failed to create promo code." });
  }
};

// User: Validate and get discount info for a promo code
const validatePromo = async (req, res) => {
  try {
    const { code, subtotal, cartItems } = req.body;
    // cartItems: [{ _id, quantity, price }] — sent from frontend

    const promo = await promoModel.findOne({ code: code.toUpperCase(), isActive: true });

    if (!promo) {
      return res.json({ success: false, message: "Invalid or inactive promo code." });
    }

    if (promo.expiresAt && new Date() > promo.expiresAt) {
      return res.json({ success: false, message: "Promo code has expired." });
    }

    if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
      return res.json({ success: false, message: "Promo code usage limit reached." });
    }

    if (subtotal < promo.minOrderAmount) {
      return res.json({ success: false, message: `Minimum order amount is Rs. ${promo.minOrderAmount}.` });
    }

    // Product-specific promo logic
    const isProductSpecific = promo.applicableProducts && promo.applicableProducts.length > 0;
    let discountBase = subtotal; // amount to calculate discount on

    if (isProductSpecific && cartItems) {
      const applicableIds = promo.applicableProducts.map(id => id.toString());

      // Calculate total quantity of applicable products in cart
      let applicableQty = 0;
      let applicableSubtotal = 0;
      for (const item of cartItems) {
        if (applicableIds.includes(item._id)) {
          applicableQty += item.quantity;
          applicableSubtotal += item.price * item.quantity;
        }
      }

      if (applicableQty === 0) {
        return res.json({ success: false, message: "This promo requires specific products that are not in your cart." });
      }

      if (promo.minQuantity > 0 && applicableQty < promo.minQuantity) {
        return res.json({ success: false, message: `You need at least ${promo.minQuantity} of the eligible item(s) in your cart.` });
      }

      // Discount applies only to the applicable products' subtotal
      discountBase = applicableSubtotal;
    }

    // Calculate discount
    let discount = 0;
    if (promo.discountType === "percentage") {
      discount = Math.round((discountBase * promo.discountValue) / 100);
      if (promo.maxDiscount && discount > promo.maxDiscount) {
        discount = promo.maxDiscount;
      }
    } else {
      discount = promo.discountValue;
    }

    // Discount can't exceed the discount base
    if (discount > discountBase) {
      discount = discountBase;
    }

    res.json({
      success: true,
      message: isProductSpecific ? "Promo applied on eligible items!" : "Promo code applied!",
      discount,
      promoCode: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      isProductSpecific,
      applicableProducts: isProductSpecific ? promo.applicableProducts : []
    });
  } catch (error) {
    console.error("Error validating promo:", error);
    res.status(500).json({ success: false, message: "Failed to validate promo code." });
  }
};

// Admin: List all promo codes
const listPromos = async (req, res) => {
  try {
    const promos = await promoModel.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: promos });
  } catch (error) {
    console.error("Error listing promos:", error);
    res.status(500).json({ success: false, message: "Failed to fetch promo codes." });
  }
};

// Admin: Delete a promo code
const deletePromo = async (req, res) => {
  try {
    await promoModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Promo code deleted." });
  } catch (error) {
    console.error("Error deleting promo:", error);
    res.status(500).json({ success: false, message: "Failed to delete promo code." });
  }
};

// Admin: Toggle promo code active/inactive
const togglePromo = async (req, res) => {
  try {
    const promo = await promoModel.findById(req.body.id);
    if (!promo) {
      return res.json({ success: false, message: "Promo code not found." });
    }
    promo.isActive = !promo.isActive;
    await promo.save();
    res.json({ success: true, message: `Promo code ${promo.isActive ? "activated" : "deactivated"}.`, data: promo });
  } catch (error) {
    console.error("Error toggling promo:", error);
    res.status(500).json({ success: false, message: "Failed to toggle promo code." });
  }
};

// Public: Get active promo codes for users to see
const getActivePromos = async (req, res) => {
  try {
    const now = new Date();
    const promos = await promoModel.find({
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      $or: [{ usageLimit: null }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }]
    }).select("code discountType discountValue minOrderAmount maxDiscount expiresAt applicableProducts minQuantity").sort({ createdAt: -1 });

    res.json({ success: true, data: promos });
  } catch (error) {
    console.error("Error fetching active promos:", error);
    res.status(500).json({ success: false, message: "Failed to fetch promos." });
  }
};

export { createPromo, validatePromo, listPromos, deletePromo, togglePromo, getActivePromos };
