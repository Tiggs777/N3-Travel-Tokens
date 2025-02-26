import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './Header.css';

const Header = () => {
  const token = localStorage.getItem('token');
  const user = token ? jwtDecode(token) : null;
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    alert('Logged out successfully!');
    navigate('/');
  };

  return (
    <header className="header">
      <h1>Travel Token DApp</h1>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/wallet">Wallet</Link>
        <Link to="/travel">Travel Packages</Link>
        {user?.role === 'admin' && <Link to="/admin">Admin Dashboard</Link>}
        {user?.role === 'admin' && <Link to="/admin-tokens">Tokens</Link>}
        {!user && <Link to="/admin-login">Admin Login</Link>}
        {user && (
          <div className="user-info">
            <span>{user.email} ({user.role})</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;