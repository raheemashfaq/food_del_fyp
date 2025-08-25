import React, { useContext, useState, useEffect } from 'react';
import './AdminLoginPopup.css';
import { AdminContext } from '../../Context/AdminContext';
import axios from 'axios';
import AdminForgotPassword from './AdminForgotPassword';

const AdminLoginPopup = ({ setShowLogin }) => {
  const { url, setToken } = useContext(AdminContext);

  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [data, setData] = useState({
    email: '',
    password: '',
  });

  // Reset forgot password state when component mounts
  useEffect(() => {
    setShowForgotPassword(false);
  }, []);

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prevData) => ({ ...prevData, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();
    const newUrl = `${url}/api/admin/login`;
    
    try {
      const response = await axios.post(newUrl, data);
      if (response.data.success && response.data.token) {
        setToken(response.data.token);
        localStorage.setItem('adminToken', response.data.token);
        setShowLogin(false);
      } else {
        alert(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      alert(`Login error: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="admin-login-popup">
      {!showForgotPassword ? (
        <form onSubmit={onLogin} className="admin-login-popup-container">
          <div className="admin-login-popup-title">
            <h2>Admin Login</h2>
            <span
              onClick={() => setShowLogin(false)}
              className="close-btn"
            >
              ✕
            </span>
          </div>
          
          <div className="admin-login-popup-inputs">
            <input
              name="email"
              onChange={onChangeHandler}
              value={data.email}
              type="email"
              placeholder="Admin email"
              required
            />
            <div className="password-input-container">
              <input
                name="password"
                onChange={onChangeHandler}
                value={data.password}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
              />
              <span 
                className="password-toggle-icon"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "🙈"}
              </span>
            </div>
          </div>
          
          <button type="submit">
            Login to Admin Panel
          </button>

          {/* Forgot Password Link */}
          <div className="admin-forgot-password-link">
            <span 
              onClick={() => setShowForgotPassword(true)}
              className="admin-forgot-password-text"
            >
              Forgot Password?
            </span>
          </div>

          <div className="admin-login-popup-condition">
            <label>
              <input type="checkbox" required />
              I confirm I am an authorized administrator
            </label>
          </div>
        </form>
      ) : (
        <AdminForgotPassword 
          setShowLogin={setShowLogin}
          setShowForgotPassword={setShowForgotPassword}
        />
      )}
    </div>
  );
};

export default AdminLoginPopup;