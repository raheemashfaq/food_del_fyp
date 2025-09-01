import React, { useContext, useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import './LoginPopup.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../Context/StoreContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';   // ✅ Import useNavigate
import ForgotPassword from './ForgotPassword';

const LoginPopup = ({ setShowLogin }) => {
  const { url, setToken } = useContext(StoreContext);
  const navigate = useNavigate();   // ✅ Initialize navigation

  const [currState, setCurrState] = useState('Login'); // Default to Login state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [data, setData] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Reset forgot password state when component mounts to avoid Google OAuth conflicts
  useEffect(() => {
    setShowForgotPassword(false);
    // Default to Login state when popup opens
    setCurrState('Login');
  }, []);

  // Password validation function
  const validatePassword = (password) => {
    if (password.length === 0) {
      return '';
    }
    
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    
    // Check for only zeros
    if (/^0+$/.test(password)) {
      return 'Password cannot contain only zeros';
    }
    
    // Check for repeated characters
    if (/^(.)\1*$/.test(password)) {
      return 'Password cannot contain only repeated characters';
    }
    
    // Check for common weak patterns
    const weakPatterns = [
      { pattern: /^12345678/, message: 'Password cannot be "12345678"' },
      { pattern: /^password/i, message: 'Password cannot contain "password"' },
      { pattern: /^qwerty/i, message: 'Password cannot be "qwerty"' },
      { pattern: /^abc123/i, message: 'Password cannot be "abc123"' },
      { pattern: /^123abc/i, message: 'Password cannot be "123abc"' }
    ];
    
    for (const { pattern, message } of weakPatterns) {
      if (pattern.test(password)) {
        return message;
      }
    }
    
    // Require at least one letter and one number
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return 'Password must contain at least one letter and one number';
    }
    
    return ''; // Password is valid
  };

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prevData) => ({ ...prevData, [name]: value }));
    
    // Validate password in real-time for registration
    if (name === 'password' && currState === 'Sign Up') {
      const error = validatePassword(value);
      setPasswordError(error);
    }
  };

  const onLogin = async (event) => {
    event.preventDefault();
    
    // Frontend validation before submission
    if (currState === 'Sign Up') {
      const passwordValidationError = validatePassword(data.password);
      if (passwordValidationError) {
        setPasswordError(passwordValidationError);
        alert(passwordValidationError);
        return;
      }
    }
    
    const endpoint =
      currState === 'Login' ? '/api/user/login' : '/api/user/register';
    const newUrl = `${url}${endpoint}`;

    console.log('Login attempt:', { url: newUrl, data: { email: data.email, password: '***' } });

    try {
      const response = await axios.post(newUrl, data);
      console.log('Login response:', response.data);
      
      if (currState === 'Login') {
        if (response.data.success && response.data.token) {
          setToken(response.data.token);
          localStorage.setItem('token', response.data.token);
          setShowLogin(false);
          console.log('Login successful, token stored');
          navigate('/');   // ✅ Redirect after login
        } else {
          console.error('Login failed:', response.data.message);
          alert(response.data.message || 'Login failed');
        }
      } else {
        if (response.data.success) {
          alert(
            response.data.message ||
              'Registration successful! Please check your email to verify your account.'
          );
          setShowLogin(false);
        } else {
          console.error('Registration failed:', response.data.message);
          alert(response.data.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('Login/Register error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: newUrl
      });
      
      if (error.code === 'ERR_NETWORK') {
        alert('Cannot connect to server. Please make sure the backend is running on port 4000.');
      } else if (error.response?.status === 404) {
        alert('Login endpoint not found. Please check the backend configuration.');
      } else {
        alert(`Error: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    console.log('Google login attempt:', { url: `${url}/api/user/auth/google` });
    
    try {
      const response = await axios.post(`${url}/api/user/auth/google`, {
        token: credentialResponse.credential,
      });
      
      console.log('Google login response:', response.data);

      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
        setShowLogin(false);
        console.log('Google login successful, token stored');
        navigate('/');   // ✅ Redirect after Google login
      } else {
        console.error('Google login failed:', response.data.message);
        alert(response.data.message || 'Google login failed');
      }
    } catch (error) {
      console.error('Google login error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      if (error.code === 'ERR_NETWORK') {
        alert('Cannot connect to server. Please make sure the backend is running on port 4000.');
      } else {
        alert(`Google login error: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleGoogleLoginError = () => {
    alert('Google login failed');
  };

  return (
    <div className="login-popup">
      {!showForgotPassword ? (
        <form onSubmit={onLogin} className="login-popup-container">
          <div className="login-popup-title">
            <h2>{currState}</h2>
            <img
              onClick={() => setShowLogin(false)}
              src={assets.cross_icon}
              alt="Close"
            />
          </div>
          <div className="login-popup-inputs">
            {currState !== 'Login' && (
              <input
                name="name"
                onChange={onChangeHandler}
                value={data.name}
                type="text"
                placeholder="Your name"
                required
              />
            )}
            <input
              name="email"
              onChange={onChangeHandler}
              value={data.email}
              type="email"
              placeholder="Your email"
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
                minLength={8}
                pattern={currState === 'Sign Up' ? "^(?=.*[a-zA-Z])(?=.*\\d).+$" : undefined}
                title={currState === 'Sign Up' ? "Password must be at least 8 characters long and contain at least one letter and one number" : undefined}
              />
              <span 
                className="password-toggle-icon"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "🙈"}
              </span>
            </div>
            {/* Password error message */}
            {currState === 'Sign Up' && passwordError && (
              <div className="password-error-message">
                ❌ {passwordError}
              </div>
            )}
            {/* Password strength indicator */}
            {currState === 'Sign Up' && data.password && !passwordError && (
              <div className="password-success-message">
                ✅ Password looks good!
              </div>
            )}
          </div>
          <button 
            type="submit"
            disabled={currState === 'Sign Up' && passwordError}
            className={currState === 'Sign Up' && passwordError ? 'disabled-button' : ''}
          >
            {currState === 'Sign Up' ? 'Create account' : 'Login'}
          </button>

          {currState === 'Login' && (
            <div style={{ margin: '16px 0', textAlign: 'center' }}>
              <GoogleLogin
                key={`google-login-${currState}`}
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
              />
            </div>
          )}

          <div className="login-popup-condition">
            <label>
              <input type="checkbox" required />
              By continuing, I agree to the terms of use & privacy policy
            </label>
          </div>
          
          {/* Forgot Password Link - only show in Login mode */}
          {currState === 'Login' && (
            <div className="forgot-password-link">
              <span 
                onClick={() => {
                  setShowForgotPassword(true);
                  // Don't close the login popup, just show forgot password
                }}
                className="forgot-password-text"
              >
                Forgot Password?
              </span>
            </div>
          )}
          
          {currState === 'Login' ? (
            <p>
              Create a New Account?{' '}
              <span onClick={() => {
                setCurrState('Sign Up');
                setPasswordError(''); // Clear password error when switching
              }}>Click here</span>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <span onClick={() => {
                setCurrState('Login');
                setPasswordError(''); // Clear password error when switching
              }}>Login here</span>
            </p>
          )}
        </form>
      ) : (
        /* Show ForgotPassword component when needed */
        <ForgotPassword 
          setShowLogin={setShowLogin}
          setShowForgotPassword={setShowForgotPassword}
        />
      )}
    </div>
  );
};

export default LoginPopup;