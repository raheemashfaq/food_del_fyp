import express from "express";
import { loginAdmin, registerAdmin, googleLoginAdmin, forgotPasswordAdmin, resetPasswordAdmin, getAdminProfile, updateAdminProfile } from "../controllers/adminController.js";
import authMiddleware from "../middleware/auth.js";


const adminRouter = express.Router();

// Test endpoint
adminRouter.get("/test", (req, res) => {
  res.json({ success: true, message: "Admin routes are working!" });
});

// Create initial admin endpoint (for testing)
adminRouter.post("/create-initial", async (req, res) => {
  try {
    const { registerAdmin } = await import("../controllers/adminController.js");
    // Create admin with predefined credentials
    const adminData = {
      name: "System Administrator",
      email: "admin@fooddelivery.com",
      password: "admin123456"
    };
    
    // Simulate request object
    const mockReq = { body: adminData };
    const mockRes = {
      json: (data) => res.json(data)
    };
    
    await registerAdmin(mockReq, mockRes);
  } catch (error) {
    res.json({ success: false, message: "Error creating admin: " + error.message });
  }
});

adminRouter.post("/login", loginAdmin);
adminRouter.post("/register", registerAdmin);
adminRouter.post("/forgot-password", forgotPasswordAdmin);
adminRouter.post("/reset-password/:token", resetPasswordAdmin);
adminRouter.post("/auth/google", googleLoginAdmin);
adminRouter.get("/profile", authMiddleware, getAdminProfile);
adminRouter.put("/profile", authMiddleware, updateAdminProfile);


export default adminRouter;