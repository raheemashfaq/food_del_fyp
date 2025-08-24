import express from "express";
import { loginUser, registerUser, verifyUser, googleLogin, forgotPassword, resetPassword } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/verify/:token", verifyUser);
userRouter.post("/auth/google", googleLogin);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password/:token", resetPassword);

export default userRouter;
