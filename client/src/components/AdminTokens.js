import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import './AdminTokens.css';

const AdminTokens = () => {
  const [tokenName, setTokenName] = useState('');
  const [tokenSupply, setTokenSupply] = useState('');
  const [tokenImage, setTokenImage] = useState('');
  const [tokenDesc, setTokenDesc] = useState('');
  const [tokenTicker, setTokenTicker] = useState('');
  const [tokens, setTokens] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const user = token ? jwtDecode(token) : null;

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    axios.get('http://localhost:3000/api/admin/tokens', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setTokens(res.data)).catch(err => {
      if (err.response?.status === 401) {
        alert('Session expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/admin-login');
      } else {
        console.error('Error fetching tokens:', err);
      }
    });
  }, [user, navigate]);

  const handleCreateToken = async () => {
    if (!tokenName || !tokenSupply || !tokenImage || !tokenDesc || !tokenTicker) return alert('Please fill in all token fields');
    try {
      const res = await axios.post('http://localhost:3000/api/admin/token', {
        name: tokenName,
        supply: parseInt(tokenSupply),
        image_url: tokenImage,
        description: tokenDesc,
        ticker: tokenTicker,
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert(`Token created! Mint: ${res.data.mint}`);
      setTokenName(''); setTokenSupply(''); setTokenImage(''); setTokenDesc(''); setTokenTicker('');
      const updatedTokens = await axios.get('http://localhost:3000/api/admin/tokens', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTokens(updatedTokens.data);
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Session expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/admin-login');
      } else {
        alert('Failed to create token: ' + (error.response?.data?.details || error.message));
      }
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-tokens-container">
      <h2>Token Management</h2>
      <div className="form-section">
        <h3>Create New Token</h3>
        <input value={tokenName} onChange={(e) => setTokenName(e.target.value)} placeholder="Token Name" />
        <input value={tokenSupply} onChange={(e) => setTokenSupply(e.target.value)} placeholder="Supply" type="number" />
        <input value={tokenImage} onChange={(e) => setTokenImage(e.target.value)} placeholder="Image URL" />
        <input value={tokenDesc} onChange={(e) => setTokenDesc(e.target.value)} placeholder="Description" />
        <input value={tokenTicker} onChange={(e) => setTokenTicker(e.target.value)} placeholder="Ticker Symbol (e.g., TKN)" maxLength="10" />
        <button onClick={handleCreateToken}>Create Token</button>
      </div>

      <div className="token-tiles">
        {tokens.map(token => (
          <div key={token.id} className="token-tile">
            <img src={token.image_url} alt={token.name} className="token-image" />
            <h3>{token.name} ({token.ticker})</h3>
            <p>{token.description}</p>
            <p>Supply: {token.supply}</p>
            <p>Mint: {token.mint}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminTokens;