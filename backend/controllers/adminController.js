import adminModel from "../models/adminModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Admin login
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await adminModel.findOne({ email });
    if (!admin) {
      return res.json({ success: false, message: "Admin does not exist" });
    }

    if (!admin.isActive) {
      return res.json({ success: false, message: "Admin account is deactivated" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = createToken(admin._id);
    res.json({ 
      success: true, 
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error while logging in" });
  }
};

// Admin registration (for initial setup or adding new admins)
const registerAdmin = async (req, res) => {
  const { name, password, email } = req.body;
  try {
    const exists = await adminModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "Admin already exists" });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email" });
    }

    if (password.length < 8) {
      return res.json({ success: false, message: "Please enter a strong password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new adminModel({
      name: name,
      email: email,
      password: hashedPassword,
    });

    const admin = await newAdmin.save();
    const token = createToken(admin._id);

    res.json({
      success: true,
      token,
      message: "Admin registered successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error while registering admin" });
  }
};

// Google login for admin
const googleLoginAdmin = async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    // Check if admin exists with this email
    let admin = await adminModel.findOne({ email });

    if (!admin) {
      return res.json({ 
        success: false, 
        message: "Admin account not found. Please contact system administrator." 
      });
    }

    if (!admin.isActive) {
      return res.json({ success: false, message: "Admin account is deactivated" });
    }

    const authToken = createToken(admin._id);
    res.json({
      success: true,
      token: authToken,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.json({ success: false, message: "Google login failed" });
  }
};



// Admin forgot password
const forgotPasswordAdmin = async (req, res) => {
  const { email } = req.body;
  
  try {
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email" });
    }

    const admin = await adminModel.findOne({ email });
    if (!admin) {
      return res.json({ success: false, message: "Admin with this email does not exist" });
    }

    if (!admin.isActive) {
      return res.json({ success: false, message: "Admin account is deactivated" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Set token and expiration (1 hour from now)
    admin.resetPasswordToken = resetToken;
    admin.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await admin.save();

    // Setup email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetUrl = `http://localhost:3001/reset-password/${resetToken}`;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Admin Password Reset Request - Tomato Food Delivery",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #FF6347; text-align: center;">Admin Password Reset Request</h2>
          <p>Hello ${admin.name},</p>
          <p>You have requested to reset your password for your Tomato Food Delivery admin account.</p>
          <p>Please click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #FF6347; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Admin Password</a>
          </div>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
          <p>Best regards,<br>Tomato Food Delivery Admin Team</p>
        </div>
      `,
    });

    res.json({ 
      success: true, 
      message: "Password reset email sent successfully. Please check your email." 
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error sending password reset email" });
  }
};

// Admin reset password
const resetPasswordAdmin = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    if (!password || password.length < 8) {
      return res.json({ success: false, message: "Please enter a strong password (minimum 8 characters)" });
    }

    const admin = await adminModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.json({ success: false, message: "Invalid or expired reset token" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update admin password and clear reset fields
    admin.password = hashedPassword;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    res.json({ 
      success: true, 
      message: "Password reset successfully. You can now login with your new password." 
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error resetting password" });
  }
};



// Get admin profile
const getAdminProfile = async (req, res) => {
  try {
    const admin = await adminModel.findById(req.body.adminId).select('-password');
    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }
    res.json({ success: true, admin });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching admin profile" });
  }
};

// Update admin profile (email/password)
const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.body.adminId; // From auth middleware
    const { name, email, currentPassword, newPassword } = req.body;

    const admin = await adminModel.findById(adminId);
    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }

    // If updating email, check if it's already taken
    if (email && email !== admin.email) {
      if (!validator.isEmail(email)) {
        return res.json({ success: false, message: "Please enter a valid email" });
      }
      
      const existingAdmin = await adminModel.findOne({ email, _id: { $ne: adminId } });
      if (existingAdmin) {
        return res.json({ success: false, message: "Email already exists" });
      }
      admin.email = email;
    }

    // Update name if provided
    if (name && name.trim()) {
      admin.name = name.trim();
    }

    // If updating password, verify current password first
    if (newPassword) {
      if (!currentPassword) {
        return res.json({ success: false, message: "Current password is required to set new password" });
      }

      if (newPassword.length < 8) {
        return res.json({ success: false, message: "New password must be at least 8 characters long" });
      }

      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return res.json({ success: false, message: "Current password is incorrect" });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(newPassword, salt);
    }

    await admin.save();

    res.json({ 
      success: true, 
      message: "Profile updated successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating profile" });
  }
};

export { loginAdmin, registerAdmin, googleLoginAdmin, forgotPasswordAdmin, resetPasswordAdmin, getAdminProfile, updateAdminProfile };