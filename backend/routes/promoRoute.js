import express from "express";
import authMiddleware from "../middleware/auth.js";
import { createPromo, validatePromo, listPromos, deletePromo, togglePromo, getActivePromos } from "../controllers/promoController.js";

const promoRouter = express.Router();

promoRouter.get("/active", getActivePromos);
promoRouter.post("/validate", authMiddleware, validatePromo);
promoRouter.post("/create", createPromo);
promoRouter.get("/list", listPromos);
promoRouter.post("/delete", deletePromo);
promoRouter.post("/toggle", togglePromo);

export default promoRouter;
