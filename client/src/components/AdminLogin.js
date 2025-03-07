// client/src/components/AdminLogin.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post(process.env.REACT_APP_API_URL+'/api/admin/login', { email, password });
      localStorage.setItem('token', res.data.token);
      navigate('/admin');
    } catch (error) {
      alert('Admin login failed: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="admin-login-container">
      <h2>Admin Login</h2>
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
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default AdminLogin;