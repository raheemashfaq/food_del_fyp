import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminResetPassword.css';

const AdminResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const url = "http://localhost:4000";

  useEffect(() => {
    if (!token) {
      setMessage('Invalid reset link');
      setMessageType('error');
    }
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.password || !formData.confirmPassword) {
      setMessage('Please fill in all fields');
      setMessageType('error');
      return;
    }

    if (formData.password.length < 8) {
      setMessage('Password must be at least 8 characters long');
      setMessageType('error');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${url}/api/admin/reset-password/${token}`, {
        password: formData.password
      });

      if (response.data.success) {
        setMessage('Password reset successfully! Redirecting to login...');
        setMessageType('success');
        
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setMessage(response.data.message || 'Failed to reset password');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      const errorMessage = error.response?.data?.message || 'Error resetting password. Please try again.';
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-reset-password">
      <div className="admin-reset-password-container">
        <div className="admin-reset-password-header">
          <h2>Reset Admin Password</h2>
          <p>Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-reset-password-form">
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter new password (min 8 characters)"
                required
                disabled={loading}
              />
              <span 
                className="password-toggle-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your new password"
                required
                disabled={loading}
              />
              <span 
                className="password-toggle-icon"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </span>
            </div>
          </div>

          {message && (
            <div className={`admin-message ${messageType}`}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !formData.password || !formData.confirmPassword}
            className="admin-reset-password-btn"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="admin-reset-password-footer">
          <p>
            Remember your password?{' '}
            <a href="/" className="back-to-login-link">
              Back to Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminResetPassword;