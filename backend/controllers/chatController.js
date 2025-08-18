// controllers/chatController.js
import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import Food from "../models/foodModel.js";
import orderModel from "../models/orderModel.js";

// Allowed delivery cities
const deliveryCities = ["Lahore", "Kasur", "Karachi"];

// Create Gemini client
let model = null;
if (process.env.GEMINI_API_KEY) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("✅ Gemini model initialized");
  } catch (err) {
    console.warn("⚠️ Could not initialize Gemini:", err.message);
  }
} else {
  console.warn("⚠️ GEMINI_API_KEY missing in .env");
}

// Simple fallback rule-based reply
function ruleBasedReply(message) {
  const m = message.toLowerCase();
  if (m.includes("deliver"))
    return "We deliver in Lahore, Kasur, and Karachi. Please share your city.";
  if (m.includes("hello") || m.includes("hi"))
    return "Hi! Please tell me your city to get started.";
  return "Sorry, I can only help with food orders, delivery, or menu items.";
}

// Main Chat Handler
export const chatHandler = async (req, res) => {
  const { message, city, orderId } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  let reply = "";
  const msg = message.toLowerCase();

  // If user asks menu but no city given
  if (msg.includes("menu") && !city) {
    return res.json({
      reply: "Please tell me your city first so I can check delivery availability.",
    });
  }

  // If city provided but not in allowed list
  if (city && !deliveryCities.includes(city)) {
    return res.json({
      reply: `Sorry, we do not deliver in ${city}. We currently serve ${deliveryCities.join(
        ", "
      )}.`,
    });
  }

  // If city is valid and user asks menu
  if (msg.includes("menu") && deliveryCities.includes(city)) {
    try {
      const foods = await Food.find({})
        .limit(10)
        .select("name price category")
        .lean();

      if (!foods?.length) {
        reply = "Sorry, the menu is not available right now.";
      } else {
        reply =
          `Here’s our menu for ${city}:\n` +
          foods.map((f) => `${f.name} - Rs ${f.price}`).join("\n");
      }
      return res.json({ reply });
    } catch (err) {
      console.error("Menu fetch error:", err.message);
      return res.json({
        reply: "Unable to fetch menu at the moment. Please try again later.",
      });
    }
  }

  // Order status check
  if (msg.includes("order") && orderId) {
    try {
      const order = await orderModel.findById(orderId).lean();
      if (order) {
        reply = `Order ID: ${order._id}\nStatus: ${order.status}\nPayment: ${
          order.payment ? "Paid ✅" : "Pending ❌"
        }\nAmount: Rs ${order.amount}`;
      } else {
        reply = `No order found for ID ${orderId}`;
      }
      return res.json({ reply });
    } catch (err) {
      return res.json({ reply: `Error fetching order: ${err.message}` });
    }
  }

  // If Gemini is available, use AI for polite fallback
  if (model) {
    try {
      const prompt = `
You are a polite Food Ordering Assistant for "MyFoodApp".

Rules:
- Always ask for the user's city before showing the menu.
- Only answer about menu, delivery, or orders.
- If user asks something outside this scope, politely say:
  "Sorry, I can only help with food orders, delivery, or menu items."

User Message: "${message}"
User City: "${city || "not provided"}"
Delivery Cities: ${deliveryCities.join(", ")}
`;

      const result = await model.generateContent([prompt]);
      reply = result.response.text().trim();
      return res.json({ reply, source: "gemini" });
    } catch (err) {
      console.error("Gemini call failed:", err.message);
      return res.json({ reply: ruleBasedReply(message), source: "fallback" });
    }
  }

  // Fallback if no Gemini
  return res.json({ reply: ruleBasedReply(message), source: "fallback" });
};
