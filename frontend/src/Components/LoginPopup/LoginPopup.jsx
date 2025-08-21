import React, { useContext, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import './LoginPopup.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../Context/StoreContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';   // ✅ Import useNavigate

const LoginPopup = ({ setShowLogin }) => {
  const { url, setToken } = useContext(StoreContext);
  const navigate = useNavigate();   // ✅ Initialize navigation

  const [currState, setCurrState] = useState('Login');
  const [data, setData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prevData) => ({ ...prevData, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();
    const endpoint =
      currState === 'Login' ? '/api/user/login' : '/api/user/register';
    const newUrl = `${url}${endpoint}`;

    try {
      const response = await axios.post(newUrl, data);
      if (currState === 'Login') {
        if (response.data.success && response.data.token) {
          setToken(response.data.token);
          localStorage.setItem('token', response.data.token);
          setShowLogin(false);

          navigate('/');   // ✅ Redirect after login
        } else {
          alert(response.data.message);
        }
      } else {
        if (response.data.success) {
          alert(
            response.data.message ||
              'Registration successful! Please check your email to verify your account.'
          );
          setShowLogin(false);
        } else {
          alert(response.data.message);
        }
      }
    } catch (error) {
      console.error('An error occurred during login:', error);
      alert('An error occurred. Please try again later.');
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post(`${url}/api/user/auth/google`, {
        token: credentialResponse.credential,
      });

      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
        setShowLogin(false);

        navigate('/');   // ✅ Redirect after Google login
      } else {
        alert(response.data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Google login failed');
    }
  };

  const handleGoogleLoginError = () => {
    alert('Google login failed');
  };

  return (
    <div className="login-popup">
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
          <input
            name="password"
            onChange={onChangeHandler}
            value={data.password}
            type="password"
            placeholder="Password"
            required
          />
        </div>
        <button type="submit">
          {currState === 'Sign Up' ? 'Create account' : 'Login'}
        </button>

        <div style={{ margin: '16px 0', textAlign: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={handleGoogleLoginError}
          />
        </div>

        <div className="login-popup-condition">
          <label>
            <input type="checkbox" required />
            By continuing, I agree to the terms of use & privacy policy
          </label>
        </div>
        {currState === 'Login' ? (
          <p>
            Create a New Account?{' '}
            <span onClick={() => setCurrState('Sign Up')}>Click here</span>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <span onClick={() => setCurrState('Login')}>Login here</span>
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginPopup;
