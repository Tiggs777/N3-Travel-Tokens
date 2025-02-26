import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useLocation } from 'react-router-dom';
import './Admin.css';

const Admin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(location.state?.activeMenu || 'tokens');
  const [travelName, setTravelName] = useState('');
  const [travelPrice, setTravelPrice] = useState('');
  const [travelImage, setTravelImage] = useState('');
  const [travelDesc, setTravelDesc] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [tokenSupply, setTokenSupply] = useState('');
  const [tokenImage, setTokenImage] = useState('');
  const [tokenDesc, setTokenDesc] = useState('');
  const [tokenTicker, setTokenTicker] = useState('');
  const [mintTokenId, setMintTokenId] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [airdropUserId, setAirdropUserId] = useState('');
  const [airdropAmount, setAirdropAmount] = useState('');
  const [airdropMint, setAirdropMint] = useState('');
  const [tokens, setTokens] = useState([]);
  const [users, setUsers] = useState([]);
  const [travelPackages, setTravelPackages] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editingTravel, setEditingTravel] = useState(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [userTokenBalances, setUserTokenBalances] = useState([]);
  const [adminTokenBalances, setAdminTokenBalances] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  

  const token = localStorage.getItem('token');
  const user = token ? jwtDecode(token) : null;

  useEffect(() => {
    if (location.state?.activeMenu) {
      setActiveMenu(location.state.activeMenu);
    }
  }, [location.state]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    if (!isInitialized) {
      initializeData();
      setIsInitialized(true);
    }
  }, [user, navigate, isInitialized]);

  const initializeData = async () => {
    try {
      await Promise.all([
        fetchUsers(),
        fetchTravelPackages(),
        fetchTokens(),
        fetchUserTokenBalances()
      ]);
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  };

  const fetchUsers = async () => {
    const res = await axios.get('http://localhost:3000/api/admin/users/info', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers(res.data);
  };

  const fetchTravelPackages = async () => {
    const res = await axios.get('http://localhost:3000/api/travel', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setTravelPackages(res.data);
  };

  const fetchTokens = async () => {
    const res = await axios.get('http://localhost:3000/api/admin/tokens', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setTokens(res.data);
  };

  const fetchUserTokenBalances = async () => {
    const res = await axios.get('http://localhost:3000/api/admin/user-token-balances', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUserTokenBalances(res.data.users);
    setAdminTokenBalances(res.data.admin);
  };

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
      await fetchTokens();
      await fetchUserTokenBalances();
    } catch (error) {
      alert('Failed to create token: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteToken = async (mint) => {
    try {
      await axios.delete(`http://localhost:3000/api/admin/tokens/${mint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Token deleted!');
      await fetchTokens();
      await fetchUserTokenBalances();
    } catch (error) {
      alert('Failed to delete token: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleMintMoreTokens = async () => {
    if (!mintTokenId || !mintAmount) return alert('Please select a token and specify an amount');
    try {
      const res = await axios.post('http://localhost:3000/api/admin/token/mint', {
        mint: mintTokenId,
        amount: parseInt(mintAmount),
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert(res.data.message);
      setMintTokenId(''); setMintAmount('');
      await fetchTokens();
      await fetchUserTokenBalances();
    } catch (error) {
      alert('Failed to mint more tokens: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCreateTravel = async () => {
    if (!travelName || !travelPrice || !travelImage || !travelDesc) return alert('Please fill in all travel package fields');
    try {
      await axios.post('http://localhost:3000/api/admin/travel', {
        name: travelName,
        price: parseInt(travelPrice),
        image_url: travelImage,
        description: travelDesc,
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Travel package created!');
      setTravelName(''); setTravelPrice(''); setTravelImage(''); setTravelDesc('');
      await fetchTravelPackages();
    } catch (error) {
      alert('Failed to create travel package: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateTravel = async () => {
    if (!editingTravel) return;
    try {
      await axios.post('http://localhost:3000/api/admin/travel/update', {
        id: editingTravel.id,
        name: editingTravel.name,
        price: parseInt(editingTravel.price),
        image_url: editingTravel.image_url,
        description: editingTravel.description,
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Travel package updated!');
      setEditingTravel(null);
      await fetchTravelPackages();
    } catch (error) {
      alert('Failed to update travel package: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteTravel = async (id) => {
    try {
      await axios.post('http://localhost:3000/api/admin/travel/delete', { ids: [id] }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Travel package deleted!');
      await fetchTravelPackages();
    } catch (error) {
      alert('Failed to delete travel package: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteMultipleTravel = async () => {
    if (selectedPackages.length === 0) return alert('Please select at least one travel package to delete');
    try {
      await axios.post('http://localhost:3000/api/admin/travel/delete', { ids: selectedPackages }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(`${selectedPackages.length} travel package(s) deleted!`);
      setSelectedPackages([]);
      await fetchTravelPackages();
    } catch (error) {
      alert('Failed to delete travel packages: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSelectPackage = (id) => {
    setSelectedPackages(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const handleAirdrop = async () => {
    if (!airdropUserId || !airdropAmount || !airdropMint) return alert('Please fill in all airdrop fields');
    try {
      const res = await axios.post('http://localhost:3000/api/admin/airdrop', {
        userId: parseInt(airdropUserId),
        amount: parseInt(airdropAmount),
        mint: airdropMint,
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert(res.data.message);
      setAirdropUserId(''); setAirdropAmount(''); setAirdropMint('');
      await fetchUsers();
      await fetchUserTokenBalances();
    } catch (error) {
      alert('Failed to airdrop tokens: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) return alert('Please fill in email and password');
    try {
      const res = await axios.post('http://localhost:3000/api/admin/users/create', {
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert(res.data.message);
      setNewUserEmail(''); setNewUserPassword(''); setNewUserRole('user');
      await fetchUsers();
      await fetchUserTokenBalances();
    } catch (error) {
      alert('Failed to create user: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({ ...user });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    try {
      await axios.post('http://localhost:3000/api/admin/users/update', {
        userId: editingUser.id,
        email: editingUser.email,
        wallet: editingUser.wallet,
        privateKey: editingUser.private_key,
        role: editingUser.role,
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('User info updated!');
      setEditingUser(null);
      await fetchUsers();
      await fetchUserTokenBalances();
    } catch (error) {
      alert('Failed to update user: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.post('http://localhost:3000/api/admin/users/delete', { userId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('User deleted!');
      await fetchUsers();
      await fetchUserTokenBalances();
    } catch (error) {
      alert('Failed to delete user: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleImpersonate = async (userId) => {
    try {
      const res = await axios.post('http://localhost:3000/api/admin/impersonate', { userId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.setItem('token', res.data.token);
      navigate('/wallet');
    } catch (error) {
      alert('Failed to impersonate user: ' + (error.response?.data?.error || error.message));
    }
  };

  const getUserBalanceForToken = (userId, mint) => {
    const userBalance = userTokenBalances.find(b => b.userId === userId);
    return userBalance ? userBalance.tokens[mint] || 0 : 0;
  };

  const getAdminBalanceForToken = (mint) => {
    return adminTokenBalances[mint] || 0;
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <h2>Admin Dashboard</h2>
      <div className="admin-menu">
        <button onClick={() => setActiveMenu('tokens')} className={activeMenu === 'tokens' ? 'active' : ''}>Token Management</button>
        <button onClick={() => setActiveMenu('airdrop')} className={activeMenu === 'airdrop' ? 'active' : ''}>Airdrop Tokens</button>
        <button onClick={() => setActiveMenu('users')} className={activeMenu === 'users' ? 'active' : ''}>User Management</button>
        <button onClick={() => setActiveMenu('travel')} className={activeMenu === 'travel' ? 'active' : ''}>Travel Packages</button>
      </div>

      {activeMenu === 'tokens' && (
        <div className="form-section">
          <h3>Create Token</h3>
          <input value={tokenName} onChange={(e) => setTokenName(e.target.value)} placeholder="Name" />
          <input value={tokenSupply} onChange={(e) => setTokenSupply(e.target.value)} placeholder="Supply" type="number" />
          <input value={tokenImage} onChange={(e) => setTokenImage(e.target.value)} placeholder="Image URL" />
          <input value={tokenDesc} onChange={(e) => setTokenDesc(e.target.value)} placeholder="Description" />
          <input value={tokenTicker} onChange={(e) => setTokenTicker(e.target.value)} placeholder="Ticker" />
          <button onClick={handleCreateToken}>Create Token</button>

          <h3>Mint More Tokens</h3>
          <select value={mintTokenId} onChange={(e) => setMintTokenId(e.target.value)}>
            <option value="">Select Token</option>
            {tokens.map(token => (
              <option key={token.mint} value={token.mint}>{token.name} ({token.ticker}) - Remaining: {getAdminBalanceForToken(token.mint)}</option>
            ))}
          </select>
          <input value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} placeholder="Amount" type="number" />
          <button onClick={handleMintMoreTokens}>Mint More</button>

          <h3>Existing Tokens</h3>
          <table className="token-table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Ticker</th>
      <th>Mint</th>
      <th>Total Supply</th> {/* Renamed for clarity */}
      <th>Admin Remaining</th> {/* Renamed for clarity */}
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {tokens.map(token => (
      <tr key={token.mint}>
        <td>{token.name}</td>
        <td>{token.ticker}</td>
        <td className="truncate">{token.mint}</td>
        <td>{token.supply}</td>
        <td>{getAdminBalanceForToken(token.mint)}</td>
        <td>
          <button onClick={() => handleDeleteToken(token.mint)}>Delete</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
        </div>
      )}
      {activeMenu === 'airdrop' && (
        <div className="form-section">
          <h3>Airdrop Tokens</h3>
          <select value={airdropUserId} onChange={(e) => setAirdropUserId(e.target.value)}>
            <option value="">Select User</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.email} ({user.wallet}) - Balances: {tokens.map(t => `${t.ticker}: ${getUserBalanceForToken(user.id, t.mint)}`).join(', ')}
              </option>
            ))}
          </select>
          <input value={airdropAmount} onChange={(e) => setAirdropAmount(e.target.value)} placeholder="Amount" type="number" />
          <select value={airdropMint} onChange={(e) => setAirdropMint(e.target.value)}>
  <option value="">Select Token Mint</option>
  {tokens.map(token => (
    <option key={token.mint} value={token.mint}>
      {token.name} ({token.ticker}) - Admin Remaining: {getAdminBalanceForToken(token.mint)}
    </option>
  ))}
</select><button onClick={handleAirdrop}>Airdrop</button>
        </div>
      )}

      {activeMenu === 'users' && (
        <div className="form-section">
          <h3>User Management</h3>
          <div className="create-user">
            <input value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="Email" />
            <input value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="Password" type="password" />
            <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={handleCreateUser}>Add User</button>
          </div>
          <table className="user-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Wallet</th>
                <th>Private Key</th>
                <th>Role</th>
                <th>Token Balances</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  {editingUser && editingUser.id === user.id ? (
                    <>
                      <td>{user.id}</td>
                      <td><input value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} /></td>
                      <td><input value={editingUser.wallet} onChange={(e) => setEditingUser({ ...editingUser, wallet: e.target.value })} /></td>
                      <td><input value={editingUser.private_key} onChange={(e) => setEditingUser({ ...editingUser, private_key: e.target.value })} /></td>
                      <td>
                        <select value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}>
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>{tokens.map(t => `${t.ticker}: ${getUserBalanceForToken(user.id, t.mint)}`).join(', ')}</td>
                      <td>
                        <button onClick={handleSaveUser}>Save</button>
                        <button onClick={() => setEditingUser(null)}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{user.id}</td>
                      <td>{user.email}</td>
                      <td>{user.wallet}</td>
                      <td>{user.private_key ? `${user.private_key.slice(0, 10)}...` : 'N/A'}</td>
                      <td>{user.role}</td>
                      <td>{tokens.map(t => `${t.ticker}: ${getUserBalanceForToken(user.id, t.mint)}`).join(', ')}</td>
                      <td>
                        <button onClick={() => handleEditUser(user)}>Edit</button>
                        <button onClick={() => handleDeleteUser(user.id)}>Delete</button>
                        <button onClick={() => handleImpersonate(user.id)}>Log in as</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeMenu === 'travel' && (
        <div className="form-section">
          <h3>Travel Package Management</h3>
          <div className="create-travel">
            <input value={travelName} onChange={(e) => setTravelName(e.target.value)} placeholder="Name" />
            <input value={travelPrice} onChange={(e) => setTravelPrice(e.target.value)} placeholder="Price (Tokens)" type="number" />
            <input value={travelImage} onChange={(e) => setTravelImage(e.target.value)} placeholder="Image URL" />
            <input value={travelDesc} onChange={(e) => setTravelDesc(e.target.value)} placeholder="Description" />
            <button onClick={handleCreateTravel}>Add Travel Package</button>
            <button onClick={handleDeleteMultipleTravel} className="delete-selected">Delete Selected</button>
          </div>
          <table className="travel-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Thumbnail</th>
                <th>Image URL</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {travelPackages.map(pkg => (
                <tr key={pkg.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedPackages.includes(pkg.id)}
                      onChange={() => handleSelectPackage(pkg.id)}
                    />
                  </td>
                  {editingTravel && editingTravel.id === pkg.id ? (
                    <>
                      <td>{pkg.id}</td>
                      <td><input value={editingTravel.name} onChange={(e) => setEditingTravel({ ...editingTravel, name: e.target.value })} /></td>
                      <td><input value={editingTravel.price} onChange={(e) => setEditingTravel({ ...editingTravel, price: e.target.value })} type="number" /></td>
                      <td><img src={editingTravel.image_url} alt="Thumbnail" className="thumbnail" /></td>
                      <td><input value={editingTravel.image_url} onChange={(e) => setEditingTravel({ ...editingTravel, image_url: e.target.value })} /></td>
                      <td><input value={editingTravel.description} onChange={(e) => setEditingTravel({ ...editingTravel, description: e.target.value })} /></td>
                      <td>
                        <button onClick={handleUpdateTravel}>Save</button>
                        <button onClick={() => setEditingTravel(null)}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{pkg.id}</td>
                      <td>{pkg.name}</td>
                      <td>{pkg.price}</td>
                      <td><img src={pkg.image_url} alt="Thumbnail" className="thumbnail" /></td>
                      <td className="truncate">{pkg.image_url}</td>
                      <td>{pkg.description}</td>
                      <td>
                        <button onClick={() => setEditingTravel(pkg)}>Edit</button>
                        <button onClick={() => handleDeleteTravel(pkg.id)}>Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Admin;