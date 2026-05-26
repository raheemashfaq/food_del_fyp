import mongoose from "mongoose";

const promoSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ["percentage", "fixed"], required: true },
  discountValue: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: null }, // cap for percentage discounts
  usageLimit: { type: Number, default: null }, // null = unlimited
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null }, // null = no expiry
  // Product-specific promo fields
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "food" }], // empty = all products
  minQuantity: { type: Number, default: 0 }, // min qty of applicable products needed (0 = no minimum)
  createdAt: { type: Date, default: Date.now }
});

const promoModel = mongoose.models.promo || mongoose.model("promo", promoSchema);
export default promoModel;
