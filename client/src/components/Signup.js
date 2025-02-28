import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Signup.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      const res = await axios.post(process.env.REACT_APP_API_URL+'/api/signup', { email, password });
      localStorage.setItem('token', res.data.token);
      navigate('/wallet');
    } catch (error) {
      alert('Signup failed: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="signup-container">
      <h2>Create Account</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button onClick={handleSignup}>Sign Up</button>
    </div>
  );
};

export default Signup;