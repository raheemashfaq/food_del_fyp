import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import Food from "../models/foodModel.js";
import orderModel from "../models/orderModel.js";

let model = null;
if (process.env.GEMINI_API_KEY) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("✅ Gemini model initialized");
  } catch (err) {
    console.warn("⚠️ Could not initialize Gemini:", err.message);
  }
}

const sessionState = {};

export const chatHandler = async (req, res) => {
  const { message } = req.body;
  const userId = req.body.userId || "guest";
  if (!message) return res.status(400).json({ error: "Message required" });

  const userMsg = message.toLowerCase();
  const state = sessionState[userId] || {};
  let foods = [];

  try {
    foods = await Food.find({}).select("name price category availableCities").lean();
  } catch (err) {
    console.warn("⚠️ DB fetch failed:", err.message);
  }

  if (state.intent === "awaiting_city") {
    sessionState[userId] = {};
    return res.json({ reply: `Estimated delivery time to ${message} is 30–45 minutes.`, source: "followup" });
  }

  if (state.intent === "awaiting_orderId") {
    sessionState[userId] = {};
    try {
      const order = await orderModel.findById(message).lean();
      if (order) {
        const orderReply = `
Order ID: ${order._id}
Status: ${order.status}
Payment: ${order.payment ? "Paid ✅" : "Pending ❌"}
Amount: Rs ${order.amount}
Items: ${order.items.map(i => `${i.name} x${i.quantity}`).join(", ")}
Address: ${order.address.city || order.address.street || "N/A"}
Date: ${new Date(order.date).toLocaleString()}
`;
        return res.json({ reply: orderReply, source: "followup" });
      } else {
        return res.json({ reply: `No order found for ID ${message}.`, source: "followup" });
      }
    } catch (err) {
      return res.json({ reply: `Error fetching order: ${err.message}`, source: "followup" });
    }
  }

  if (userMsg.includes("track my order")) {
    if (userId === "guest") {
      return res.json({
        reply: `🔐 Please sign in to continue. Once you're logged in, I’ll fetch your latest order automatically.`,
        source: "auth"
      });
    }

    try {
      const latestOrder = await orderModel.findOne({ userId }).sort({ date: -1 }).lean();
      if (!latestOrder) {
        return res.json({
          reply: `😕 You don’t have any orders yet. Want help placing one?`,
          source: "no-orders"
        });
      }

      const orderReply = `
🧾 Latest Order:
Order ID: ${latestOrder._id}
Status: ${latestOrder.status}
Payment: ${latestOrder.payment ? "Paid ✅" : "Pending ❌"}
Amount: Rs ${latestOrder.amount}
Items: ${latestOrder.items.map(i => `${i.name} x${i.quantity}`).join(", ")}
Address: ${latestOrder.address.city || latestOrder.address.street || "N/A"}
Date: ${new Date(latestOrder.date).toLocaleString()}
`;

      return res.json({ reply: orderReply, source: "auto-track" });
    } catch (err) {
      return res.json({ reply: `⚠️ Error fetching your order: ${err.message}`, source: "error" });
    }
  }

  if (userMsg.includes("menu")) {
    if (foods.length) {
      const menuList = foods.map(f => `${f.name} (Rs ${f.price})`).join(", ");
      return res.json({ reply: `We have ${menuList}.`, source: "rule" });
    } else {
      return res.json({ reply: "Sorry, the menu is not available right now.", source: "rule" });
    }
  }

  if (userMsg.includes("delivery time")) {
    sessionState[userId] = { intent: "awaiting_city" };
    return res.json({ reply: "Please provide your city so I can estimate delivery time.", source: "rule" });
  }

  const priceMatch = userMsg.match(/under\s+(\d+)/);
  if (priceMatch) {
    const limit = parseInt(priceMatch[1]);
    const filtered = foods.filter(f => f.price < limit);
    if (filtered.length) {
      const list = filtered.map(f => `${f.name} (Rs ${f.price})`).join(", ");
      return res.json({ reply: `Here are items under Rs ${limit}: ${list}.`, source: "rule" });
    } else {
      return res.json({ reply: `Sorry, no items under Rs ${limit} on the menu.`, source: "rule" });
    }
  }

  const requestedFood = foods.find(f => userMsg.includes(f.name.toLowerCase()));
  if (requestedFood) {
    return res.json({ reply: `We have ${requestedFood.name} for Rs ${requestedFood.price}.`, source: "rule" });
  }

  if (model) {
    try {
      const foodSummary = foods.map(f => `${f.name} (Rs ${f.price})`).join(" | ") || "No menu available";
      const prompt = `
You are a Food Ordering Assistant for "MyFoodApp".

Rules:
- Only answer about menu, delivery, or orders.
- NEVER invent new dishes or cities.
- If unrelated → reply: "Sorry, I can only help with food orders, delivery, or menu items."

User Message: "${message}"
Menu: ${foodSummary}
`;

      const result = await model.generateContent([prompt]);
      const textReply = result.response.text().trim();
      return res.json({ reply: textReply, source: "gemini" });
    } catch (err) {
      return res.json({ reply: "Sorry, I can only help with food orders, delivery, or menu items.", source: "fallback" });
    }
  }

  return res.json({ reply: "Sorry, I can only help with food orders, delivery, or menu items.", source: "fallback" });
};
