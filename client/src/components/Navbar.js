import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './Navbar.css';

const Navbar = () => {
  const token = localStorage.getItem('token');
  const user = token ? jwtDecode(token) : null;
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

    const handleAdminMenu = (menu) => {
    if (user && user.role === 'admin') {
      const viewTab = `${menu}View`; // Default to view tab
      navigate('/admin', { state: { activeMenu: viewTab } });
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-link">Travel Packages</Link>
        {user && <Link to="/wallet" className="navbar-link">Wallet Manager</Link>}
        {user && user.role === 'admin' && (
          <>
            <button onClick={() => handleAdminMenu('tokens')} className="navbar-link">Token Management</button>
            <button onClick={() => handleAdminMenu('users')} className="navbar-link">User Management</button>
            <button onClick={() => handleAdminMenu('travelPackage')} className="navbar-link">Travel Package Management</button>
          </>
        )}
      </div>
      <div className="navbar-right">
        {!user ? (
          <>
            <Link to="/login" className="navbar-button">Login</Link>
            <Link to="/signup" className="navbar-button">Create Account</Link>
            <Link to="/admin-login" className="navbar-button">Admin Login</Link>
          </>
        ) : (
          <>
            <span className="navbar-user">Welcome, Admin</span>
            <button onClick={handleLogout} className="navbar-button logout">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;