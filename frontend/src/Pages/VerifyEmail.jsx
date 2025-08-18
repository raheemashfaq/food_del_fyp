import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const VerifyEmail = () => {
  const { token } = useParams();
  const [message, setMessage] = useState('Verifying...');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/user/verify/${token}`);
        if (res.data.success) {
          setMessage('Email verified successfully! You can now log in.');
        } else {
          setMessage(res.data.message || 'Verification failed.');
        }
      } catch (err) {
        setMessage('Verification failed.');
      }
    };
    verify();
  }, [token]);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>{message}</h2>
    </div>
  );
};

export default VerifyEmail;
