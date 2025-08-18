import express from "express";
import { OAuth2Client } from "google-auth-library";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

const router = express.Router();
const client = new OAuth2Client('78746459454-c6428b4dgmpker8omk3uf1jalst5vnua.apps.googleusercontent.com'); // Replace with your Google Client ID

router.post('/google', async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: '78746459454-c6428b4dgmpker8omk3uf1jalst5vnua.apps.googleusercontent.com', // Replace with your Google Client ID
    });
    const payload = ticket.getPayload();
    const { email, name, sub } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email,
        name,
        googleId: sub,
      });
      await user.save();
    }
  // Generate JWT token
  const jwtToken = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || "mysecret", { expiresIn: '7d' });
  res.json({ success: true, token: jwtToken, user });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid Google token', error: err.message });
  }
});

export default router;
