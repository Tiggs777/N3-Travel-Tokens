import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AdminLogin from './components/AdminLogin';
import Admin from './components/Admin';
import Wallet from './components/Wallet';
import Travel from './components/Travel';
import Login from './components/Login';
import Signup from './components/Signup';
import './App.css';

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Travel />} /> {/* Default to Travel packages */}
      </Routes>
    </Router>
  );
};

export default App;