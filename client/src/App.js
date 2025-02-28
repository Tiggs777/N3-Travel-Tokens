import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Navbar from './components/Navbar';
import AdminLogin from './components/AdminLogin';
import Admin from './components/Admin';
import Wallet from './components/Wallet';
import Travel from './components/Travel';
import Login from './components/Login';
import Signup from './components/Signup';
import './App.css';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  const user = jwtDecode(token);
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="app-content">
          <Routes>
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<Travel />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;