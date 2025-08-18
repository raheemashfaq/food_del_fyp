import express from "express";
import { loginUser, registerUser, verifyUser, googleLogin } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/verify/:token", verifyUser);
userRouter.post("/auth/google", googleLogin);

export default userRouter;
