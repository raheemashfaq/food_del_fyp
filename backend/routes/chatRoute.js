import express from "express";
import { chatHandler } from "../controllers/chatController.js";
import authMiddleware from "../middleware/auth.js";

const chatRouter = express.Router();

// Apply authMiddleware to decode token and inject userId
chatRouter.post("/", authMiddleware, chatHandler);

export default chatRouter;
