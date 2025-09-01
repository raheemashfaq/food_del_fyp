import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Verifying...');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        // Use the correct backend URL instead of hardcoded localhost:5000
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
        const res = await axios.get(`${baseUrl}/api/user/verify/${token}`);
        if (res.data.success) {
          setMessage('Email verified successfully! You can now log in.');
          setIsVerified(true);
        } else {
          setMessage(res.data.message || 'Verification failed.');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setMessage('Verification failed.');
      }
    };
    verify();
  }, [token]);

  const handleNavigateToLogin = () => {
    // Navigate to home page and open login popup
    navigate('/');
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', padding: '20px', maxWidth: '500px', margin: '50px auto' }}>
      <h2>{message}</h2>
      {isVerified && (
        <div style={{ marginTop: '20px' }}>
          <p>Your email has been successfully verified. You can now log in to your account.</p>
          <button 
            onClick={handleNavigateToLogin}
            style={{
              marginTop: '20px',
              padding: '12px 30px',
              backgroundColor: '#FF6347',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Go to Login Page
          </button>
        </div>
      )}
      {!isVerified && (
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => navigate('/')}
            style={{
              marginTop: '20px',
              padding: '12px 30px',
              backgroundColor: '#FF6347',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Back to Home
          </button>
        </div>
      )}
    </div>
  );
};

export default VerifyEmail;