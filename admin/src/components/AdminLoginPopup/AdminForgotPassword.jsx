import React, { useState, useContext } from 'react';
import axios from 'axios';
import './AdminForgotPassword.css';
import { AdminContext } from '../../Context/AdminContext';

const AdminForgotPassword = ({ setShowLogin, setShowForgotPassword }) => {
  const { url } = useContext(AdminContext);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('Please enter your admin email address');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post(`${url}/api/admin/forgot-password`, { 
        email: email.trim() 
      });
      
      if (response.data.success) {
        setMessage(response.data.message);
        setMessageType('success');
        setEmail('');
      } else {
        setMessage(response.data.message || 'Failed to send reset email');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Admin forgot password error:', error);
      const errorMessage = error.response?.data?.message || 'Error sending reset email. Please try again.';
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
  };

  return (
    <form onSubmit={handleForgotPassword} className="admin-login-popup-container">
      <div className="admin-login-popup-title">
        <h2>Reset Admin Password</h2>
        <span
          onClick={() => setShowForgotPassword(false)}
          className="close-btn"
        >
          ✕
        </span>
      </div>
      
      <div className="admin-forgot-password-content">
        <p className="admin-forgot-password-description">
          Enter your admin email address and we'll send you a link to reset your password.
        </p>
        
        <div className="admin-login-popup-inputs">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your admin email address"
            required
            disabled={loading}
            autoFocus
          />
        </div>
        
        {message && (
          <div className={`admin-message ${messageType}`}>
            {message}
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={loading || !email.trim()}
          className="admin-forgot-password-btn"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
        
        <div className="admin-forgot-password-footer">
          <p>
            Remember your password?{' '}
            <span onClick={handleBackToLogin} className="admin-back-to-login">
              Back to Login
            </span>
          </p>
        </div>
      </div>
    </form>
  );
};

export default AdminForgotPassword;