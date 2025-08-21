import express from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/userModel.js";

const router = express.Router();
const client = new OAuth2Client(
  "78746459454-c6428b4dgmpker8omk3uf1jalst5vnua.apps.googleusercontent.com"
);

// Helper: Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET || "mysecret",
    { expiresIn: "7d" }
  );
};

// ================== Manual Signup (with email verification) ==================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    user = new User({
      name,
      email,
      password: hashedPassword,
      verified: false,
      verificationToken,
    });

    await user.save();

    // Setup email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const verifyUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;

    await transporter.sendMail({
      to: email,
      subject: "Verify your email",
      html: `<p>Hello ${name},</p>
             <p>Please verify your account by clicking 
             <a href="${verifyUrl}">here</a>.</p>`,
    });

    res.json({
      success: true,
      message: "Signup successful! Please check your email to verify your account.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================== Verify Email ==================
router.get("/verify/:token", async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.verified = true;
    user.verificationToken = "";
    await user.save();

    res.json({ success: true, message: "Email verified successfully. You can now log in." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================== Manual Login ==================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!user.verified) {
      return res.status(400).json({ message: "Please verify your email before logging in" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    res.json({
      success: true,
      token: generateToken(user),
      user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================== Google Login ==================
router.post("/google", async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience:
        "78746459454-c6428b4dgmpker8omk3uf1jalst5vnua.apps.googleusercontent.com",
    });

    const payload = ticket.getPayload();
    const { email, name, sub } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email,
        name,
        password: "",
        googleId: sub,
        verified: true, // Google users are auto-verified
      });
      await user.save();
    }

    res.json({
      success: true,
      token: generateToken(user),
      user,
    });
  } catch (err) {
    res
      .status(401)
      .json({ success: false, message: "Invalid Google token", error: err.message });
  }
});

export default router;
