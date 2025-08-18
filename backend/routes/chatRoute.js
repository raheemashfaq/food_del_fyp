// routes/chatRoute.js
import express from "express";
import { chatHandler } from "../controllers/chatController.js";

const chatRouter = express.Router();

// POST /api/chat
chatRouter.post("/", chatHandler);

export default chatRouter;
