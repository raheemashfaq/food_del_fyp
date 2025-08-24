import React, { useState, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./ResetPassword.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../Context/StoreContext";

const ResetPassword = () => {
  const { token } = useParams(); // token from URL
  const navigate = useNavigate();
  const { url } = useContext(StoreContext);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long");
      setMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    
    try {
      const response = await axios.post(`${url}/api/user/reset-password/${token}`, {
        password,
      });

      if (response.data.success) {
        setMessage(response.data.message || "Password reset successfully!");
        setMessageType("success");
        
        // Redirect to home page after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setMessage(response.data.message || "Failed to reset password");
        setMessageType("error");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setMessage("Error resetting password. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <form onSubmit={handleReset} className="reset-password-form">
        <div className="reset-password-header">
          <img src={assets.logo} alt="Logo" className="reset-logo" />
          <h2>Reset Your Password</h2>
          <p>Enter your new password below</p>
        </div>
        
        <div className="reset-password-inputs">
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New Password"
              required
              disabled={loading}
              minLength={8}
            />
            <span 
              className="password-toggle-icon"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "👁️" : "🙈"}
            </span>
          </div>
          <div className="password-input-container">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm New Password"
              required
              disabled={loading}
              minLength={8}
            />
            <span 
              className="password-toggle-icon"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              title={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? "👁️" : "🙈"}
            </span>
          </div>
        </div>
        
        {message && (
          <div className={`reset-message ${messageType}`}>
            {message}
          </div>
        )}
        
        <button type="submit" disabled={loading} className="reset-password-btn">
          {loading ? "Resetting..." : "Reset Password"}
        </button>
        
        <div className="reset-password-footer">
          <p>
            Remember your password?{" "}
            <span onClick={() => navigate("/")} className="back-to-home">
              Back to Home
            </span>
          </p>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
