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

// Restaurant location configuration
const RESTAURANT_LOCATION = {
  name: "Tomato Food Restaurant",
  address: "Block A, Johar Town, Lahore",
  lat: 31.582045,
  lng: 74.329376,
  area: "Johar Town"
};

// Lahore city boundaries (approximate)
const LAHORE_BOUNDS = {
  north: 31.6963,
  south: 31.3884,
  east: 74.5133,
  west: 74.1866
};

// Function to check if coordinates are within Lahore
const isWithinLahore = (lat, lng) => {
  return lat >= LAHORE_BOUNDS.south && lat <= LAHORE_BOUNDS.north &&
         lng >= LAHORE_BOUNDS.west && lng <= LAHORE_BOUNDS.east;
};

// Function to calculate delivery time based on distance from restaurant
const calculateDeliveryTime = (userLat, userLng) => {
  const restaurantLat = RESTAURANT_LOCATION.lat;
  const restaurantLng = RESTAURANT_LOCATION.lng;
  
  // Calculate distance using Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = (userLat - restaurantLat) * Math.PI / 180;
  const dLng = (userLng - restaurantLng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(restaurantLat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  // Base time 15 minutes + 2 minutes per km
  const estimatedTime = Math.round(15 + (distance * 2));
  const finalTime = Math.min(Math.max(estimatedTime, 20), 45); // Between 20-45 minutes
  
  return {
    time: finalTime,
    distance: Math.round(distance * 10) / 10, // Round to 1 decimal
    restaurantName: RESTAURANT_LOCATION.name,
    restaurantArea: RESTAURANT_LOCATION.area
  };
};

export const chatHandler = async (req, res) => {
  const { message, coordinates } = req.body;
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

  // Handle location pinning
  if (coordinates && coordinates.lat && coordinates.lng) {
    const { lat, lng, name } = coordinates;
    
    if (!isWithinLahore(lat, lng)) {
      sessionState[userId] = {};
      return res.json({ 
        reply: "Sorry, we only deliver within Lahore. Please select a location within Lahore city limits.", 
        source: "location_validation",
        needsLocation: false
      });
    }
    
    const deliveryInfo = calculateDeliveryTime(lat, lng);
    const locationName = name || "Selected Location";
    sessionState[userId] = { 
      selectedLocation: { lat, lng, name: locationName },
      deliveryInfo: deliveryInfo
    };
    
    return res.json({ 
      reply: `Perfect! Delivery to ${locationName} will take approximately ${deliveryInfo.time} minutes from our Johar Town restaurant. 🚀\n\n📏 **Distance:** ${deliveryInfo.distance} km\n🕰️ **Delivery Time:** ${deliveryInfo.time} minutes\n\n🚚 Ready to order! Browse our menu and place your order.`, 
      source: "delivery_estimate",
      needsLocation: false
    });
  }

  // Handle order tracking requests (BEFORE order placement detection)
  if (userMsg.includes("track my order") || userMsg.includes("order status") || userMsg.includes("my orders")) {
    if (userId === "guest") {
      return res.json({
        reply: `🔐 Please sign in to track your orders.\n\nOnce you're logged in, I'll fetch your latest order automatically and show you the status, delivery progress, and order details.`,
        source: "auth_required"
      });
    }

    try {
      const latestOrder = await orderModel.findOne({ userId }).sort({ date: -1 }).lean();
      if (!latestOrder) {
        return res.json({
          reply: `😕 You don't have any orders yet.\n\n🛒 Would you like to place your first order? I can show you our menu to get started!`,
          source: "no_orders"
        });
      }

      const orderReply = `📦 **Your Latest Order:**\n\n🆔 **Order ID:** ${latestOrder._id}\n📊 **Status:** ${latestOrder.status}\n💳 **Payment:** ${latestOrder.payment ? "Paid ✅" : "Pending ❌"}\n💰 **Amount:** Rs ${latestOrder.amount}\n🍽️ **Items:** ${latestOrder.items.map(i => `${i.name} x${i.quantity}`).join(", ")}\n📍 **Address:** ${latestOrder.address.city || latestOrder.address.street || "N/A"}\n📅 **Date:** ${new Date(latestOrder.date).toLocaleString()}\n\n❓ Need help with anything else?`;

      return res.json({ reply: orderReply, source: "order_tracking" });
    } catch (err) {
      return res.json({ reply: `⚠️ Error fetching your order details. Please try again or contact support.\n\nError: ${err.message}`, source: "error" });
    }
  }

  // Handle casual greetings and conversations (BEFORE location-specific queries)
  const casualGreetings = ["hi", "hello", "hey", "assalam", "salam", "assalamualaikum", "walaikum", "how are you", "how's you", "how r u", "good morning", "good evening", "good afternoon"];
  const isCasualGreeting = casualGreetings.some(greeting => userMsg.includes(greeting.toLowerCase()));
  
  if (isCasualGreeting && !userMsg.includes("delivery") && !userMsg.includes("location") && !userMsg.includes("where")) {
    // Reset session state for fresh conversation
    sessionState[userId] = {};
    
    let casualReply = "";
    if (userMsg.includes("assalam") || userMsg.includes("salam")) {
      casualReply = "Wa alaykum assalam! 🤝 Welcome to our food delivery service! 🍕\n\n";
    } else if (userMsg.includes("how")) {
      casualReply = "I'm doing great, thank you for asking! 😊 Ready to help you with delicious food! 🍽️\n\n";
    } else {
      casualReply = "Hello there! 👋 Welcome to our food delivery service! 🍕\n\n";
    }
    
    casualReply += "We deliver throughout Lahore from our Johar Town location. How can I help you today?\n\n🍽️ Show menu | 🛒 Order now | 📍 Delivery info";
    
    return res.json({ 
      reply: casualReply, 
      source: "casual_greeting",
      needsLocation: false
    });
  }

  // Handle ordering intents (AFTER casual greetings are handled)
  if ((userMsg.includes("order") && !userMsg.includes("track") && !userMsg.includes("my order")) || 
      userMsg.includes("buy") || userMsg.includes("purchase") || 
      userMsg.includes("add to cart") || userMsg.includes("yeah order") || userMsg.includes("order now")) {
    return res.json({ 
      reply: "Great! I'd love to help you place an order! 🛒\n\nTo place your order:\n1️⃣ Browse our menu below or visit our main page\n2️⃣ Add items to your cart\n3️⃣ Proceed to checkout\n\nWould you like me to show you our menu by categories?", 
      source: "order_guidance",
      showOrderOptions: true
    });
  }

  // Handle location/delivery specific queries (AFTER casual greetings)
  if (userMsg.includes("delivery") || userMsg.includes("where") || userMsg.includes("location")) {
    sessionState[userId] = { intent: "awaiting_location" };
    return res.json({ 
      reply: "We deliver throughout Lahore from our Johar Town location. Please pin your delivery location on the map so we can calculate your delivery time. 📍", 
      source: "location_inquiry",
      needsLocation: true
    });
  }
  
  if (state.intent === "awaiting_location") {
    return res.json({ 
      reply: "Please pin your delivery location on the map so I can calculate delivery time from our Johar Town restaurant. 📍", 
      source: "location_prompt",
      needsLocation: true
    });
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

  if (userMsg.includes("menu") || userMsg.includes("food") || userMsg.includes("categories")) {
    if (foods.length) {
      // Group foods by category for better display
      const categories = {};
      foods.forEach(food => {
        const category = food.category || 'Other';
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(food);
      });

      let menuReply = "🍽️ **Our Menu** 🍽️\n\n";
      Object.keys(categories).forEach(category => {
        menuReply += `**${category.toUpperCase()}:**\n`;
        categories[category].forEach(food => {
          menuReply += `• ${food.name} - Rs ${food.price}\n`;
        });
        menuReply += "\n";
      });
      
      menuReply += "💡 **To order:** Type the name of any item or say 'order now' to start placing your order!";
      
      return res.json({ reply: menuReply, source: "categorized_menu" });
    } else {
      return res.json({ reply: "Sorry, the menu is not available right now. Please try again later.", source: "rule" });
    }
  }

  if (userMsg.includes("delivery time") || userMsg.includes("how long") || userMsg.includes("time")) {
    sessionState[userId] = { intent: "awaiting_location" };
    return res.json({ 
      reply: "We deliver only in Lahore from our Johar Town location. Please pin your delivery location on the map so I can calculate your delivery time. 📍", 
      source: "delivery_inquiry",
      needsLocation: true
    });
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

  // Enhanced search functionality - by product name AND category
  const searchByNameAndCategory = (searchTerm) => {
    const term = searchTerm.toLowerCase();
    
    // Define category aliases for better search
    const categoryAliases = {
      'rice': ['biryani', 'pulao'],
      'sweet': ['cake', 'deserts', 'dessert', 'ice cream', 'icecream'],
      'bread': ['sandwich', 'rolls'],
      'healthy': ['salad', 'pure veg', 'veg'],
      'spicy': ['biryani', 'rolls'],
      'cold': ['ice cream', 'icecream'],
      'hot': ['biryani', 'sandwich'],
      'vegetarian': ['pure veg', 'veg', 'salad'],
      'non-veg': ['biryani', 'chicken'],
      'snack': ['rolls', 'sandwich'],
      'main course': ['biryani'],
      'dessert': ['cake', 'deserts', 'ice cream']
    };
    
    // First, search by exact product name
    const exactNameMatch = foods.find(f => f.name.toLowerCase().includes(term));
    if (exactNameMatch) {
      return {
        type: 'product',
        items: [exactNameMatch],
        searchTerm: term
      };
    }
    
    // Search by category aliases
    for (const [alias, categories] of Object.entries(categoryAliases)) {
      if (term.includes(alias) || alias.includes(term)) {
        const aliasMatches = foods.filter(f => {
          const category = (f.category || 'other').toLowerCase();
          return categories.some(cat => category.includes(cat) || cat.includes(category));
        });
        
        if (aliasMatches.length > 0) {
          return {
            type: 'category_alias',
            items: aliasMatches,
            searchTerm: term,
            alias: alias
          };
        }
      }
    }
    
    // Then search by actual category
    const categoryMatches = foods.filter(f => {
      const category = (f.category || 'other').toLowerCase();
      return category.includes(term) || term.includes(category);
    });
    
    if (categoryMatches.length > 0) {
      return {
        type: 'category',
        items: categoryMatches,
        searchTerm: term,
        category: categoryMatches[0].category
      };
    }
    
    // Finally, partial name search
    const partialMatches = foods.filter(f => {
      return f.name.toLowerCase().includes(term) || term.includes(f.name.toLowerCase());
    });
    
    if (partialMatches.length > 0) {
      return {
        type: 'partial',
        items: partialMatches,
        searchTerm: term
      };
    }
    
    return null;
  };
  
  // Enhanced food item recognition with category search
  const searchResult = searchByNameAndCategory(userMsg);
  if (searchResult) {
    if (searchResult.type === 'product') {
      const food = searchResult.items[0];
      return res.json({ 
        reply: `✅ **${food.name}** - Rs ${food.price}\n\n🛒 To add this to your cart:\n1️⃣ Visit our main page\n2️⃣ Find "${food.name}" in the ${food.category || 'menu'} section\n3️⃣ Click "Add to Cart"\n\nOr ask me to show you more items from our menu!`, 
        source: "food_item_with_guidance" 
      });
    } else if (searchResult.type === 'category_alias') {
      const alias = searchResult.alias;
      let aliasReply = `🍽️ **${alias.charAt(0).toUpperCase() + alias.slice(1)} Items:**\n\n`;
      
      // Group by actual categories
      const groupedByCategory = {};
      searchResult.items.forEach(food => {
        const category = food.category || 'Other';
        if (!groupedByCategory[category]) {
          groupedByCategory[category] = [];
        }
        groupedByCategory[category].push(food);
      });
      
      Object.keys(groupedByCategory).forEach(category => {
        aliasReply += `**${category.toUpperCase()}:**\n`;
        groupedByCategory[category].forEach(food => {
          aliasReply += `• **${food.name}** - Rs ${food.price}\n`;
        });
        aliasReply += "\n";
      });
      
      aliasReply += `💡 **To order:** Type the specific name of any item above!`;
      
      return res.json({ 
        reply: aliasReply, 
        source: "category_alias_search_results" 
      });
    } else if (searchResult.type === 'category') {
      const category = searchResult.category;
      let categoryReply = `🍽️ **${category.toUpperCase()} Items:**\n\n`;
      
      searchResult.items.forEach(food => {
        categoryReply += `• **${food.name}** - Rs ${food.price}\n`;
      });
      
      categoryReply += `\n💡 **To order:** Type the specific name of any item above or visit our main page to add items to your cart!`;
      
      return res.json({ 
        reply: categoryReply, 
        source: "category_search_results" 
      });
    } else if (searchResult.type === 'partial') {
      let partialReply = `🔍 **Found ${searchResult.items.length} item(s) matching "${searchResult.searchTerm}":**\n\n`;
      
      searchResult.items.slice(0, 5).forEach(food => {
        partialReply += `• **${food.name}** (${food.category}) - Rs ${food.price}\n`;
      });
      
      if (searchResult.items.length > 5) {
        partialReply += `\n... and ${searchResult.items.length - 5} more items.\n`;
      }
      
      partialReply += `\n💡 **To order:** Type the specific name of any item or visit our main page!`;
      
      return res.json({ 
        reply: partialReply, 
        source: "partial_search_results" 
      });
    }
  }

  // Handle requests for help with ordering process
  if (userMsg.includes("how to order") || userMsg.includes("place order") || userMsg.includes("checkout")) {
    return res.json({ 
      reply: "📋 **How to Place an Order:**\n\n1️⃣ **Browse Menu** - Ask me 'show menu' or visit our main page\n2️⃣ **Select Items** - Choose what you'd like to eat\n3️⃣ **Add to Cart** - Click the + button next to items\n4️⃣ **Review Cart** - Check your selections\n5️⃣ **Checkout** - Provide delivery details and payment\n\n🚀 Ready to start? Say 'show menu' or 'order now'!", 
      source: "order_instructions" 
    });
  }

  if (model) {
    try {
      const foodSummary = foods.map(f => `${f.name} (Rs ${f.price})`).join(" | ") || "No menu available";
      const prompt = `
You are a Customer Support Chatbot for a food delivery app in Lahore, Pakistan.

Rules:
- We deliver ONLY in Lahore, Pakistan
- Always be polite, helpful, and professional
- Keep responses short and friendly
- For delivery inquiries, ask users to pin their location on the map
- For ordering help, guide users to the main page to add items to cart
- Only answer about menu, delivery, orders, or general app support
- If someone wants to order, explain they need to use the main website interface
- If unrelated → reply: "I can help with food orders, delivery, menu, or app support."

User Message: "${message}"
Menu Available: ${foods.length > 0 ? 'Yes' : 'No'}

Context: Help users understand how to order food through the main app interface.
`;

      const result = await model.generateContent([prompt]);
      const textReply = result.response.text().trim();
      return res.json({ reply: textReply, source: "gemini" });
    } catch (err) {
      return res.json({ reply: "I can help with food orders, delivery, menu, or app support. We deliver only in Lahore!", source: "fallback" });
    }
  }

  return res.json({ reply: "I can help with food orders, delivery, menu, or app support. We deliver only in Lahore!", source: "fallback" });
};
