import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../Context/StoreContext';

const ForgotPassword = ({ setShowLogin, setShowForgotPassword }) => {
  const { url } = useContext(StoreContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email address');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post(`${url}/api/user/forgot-password`, { email });
      
      if (response.data.success) {
        setMessage(response.data.message);
        setMessageType('success');
        setEmail(''); // Clear email field
      } else {
        setMessage(response.data.message || 'Failed to send reset email');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setMessage('Error sending reset email. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    // setShowLogin(true); // Remove this since we're staying in the same popup
  };

  return (
    <form onSubmit={handleForgotPassword} className="login-popup-container">
      <div className="login-popup-title">
        <h2>Forgot Password</h2>
        <img
          onClick={() => setShowForgotPassword(false)}
          src={assets.cross_icon}
          alt="Close"
          className="close-icon"
        />
      </div>
      
      <div className="forgot-password-content">
        <p className="forgot-password-description">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <div className="login-popup-inputs">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            disabled={loading}
          />
        </div>
        
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={loading}
          className="forgot-password-btn"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
        
        <div className="forgot-password-footer">
          <p>
            Remember your password?{' '}
            <span onClick={handleBackToLogin} className="back-to-login">
              Back to Login
            </span>
          </p>
        </div>
      </div>
    </form>
  );
};

export default ForgotPassword;