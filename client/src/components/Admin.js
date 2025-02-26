import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useLocation } from 'react-router-dom';
import './Admin.css';

const Admin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(location.state?.activeMenu || 'tokens');
  const [tokenAction, setTokenAction] = useState('create'); // Default token action
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
  const [selectedUsers, setSelectedUsers] = useState([]); // For multiple user selection
  const [selectedGroup, setSelectedGroup] = useState(''); // For group selection
  const [userGroups, setUserGroups] = useState([]); // For managing user groups
  const [groupName, setGroupName] = useState(''); // For creating/editing groups
  const [groupUsers, setGroupUsers] = useState([]); // For group user selection
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
  const [sortBy, setSortBy] = useState('created_at'); // Sorting option
  const [sortOrder, setSortOrder] = useState('desc'); // Sort direction
  const [startDate, setStartDate] = useState(''); // Date filter start
  const [endDate, setEndDate] = useState(''); // Date filter end
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
  }, [user, navigate, isInitialized, sortBy, sortOrder, startDate, endDate]);

  const initializeData = async () => {
    try {
      await Promise.all([
        fetchUsers(),
        fetchTravelPackages(),
        fetchTokens(),
        fetchUserTokenBalances(),
        fetchUserGroups()
      ]);
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  };

  const fetchUsers = async () => {
    const params = new URLSearchParams({
      sort: sortBy,
      order: sortOrder,
      startDate,
      endDate
    }).toString();
    const res = await axios.get(`http://localhost:3000/api/admin/users/info?${params}`, {
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
    console.log('Fetched admin balances:', res.data.admin);
    console.log('Fetched user balances:', res.data.users);
  };

  const fetchUserGroups = async () => {
    const res = await axios.get('http://localhost:3000/api/admin/user-groups', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUserGroups(res.data);
  };

  const handleTokenAction = async () => {
    switch (tokenAction) {
      case 'create':
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
        break;
      case 'mint':
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
        break;
      case 'airdrop':
        if (!selectedUsers.length && !selectedGroup || !mintAmount) return alert('Please select users or a group and specify an amount');
        try {
          const res = await axios.post('http://localhost:3000/api/admin/airdrop', {
            userIds: selectedUsers.length ? selectedUsers : undefined,
            groupId: selectedGroup || undefined,
            amount: parseInt(mintAmount),
            mint: mintTokenId,
          }, { headers: { Authorization: `Bearer ${token}` } });
          alert(res.data.message);
          setSelectedUsers([]);
          setSelectedGroup('');
          setMintAmount('');
          setMintTokenId('');
          await fetchUsers();
          await fetchUserTokenBalances();
          await fetchTokens();
        } catch (error) {
          alert('Failed to airdrop tokens: ' + (error.response?.data?.error || error.message));
        }
        break;
      case 'transfer':
        if (!selectedUsers.length && !selectedGroup || !mintAmount) return alert('Please select users or a group and specify an amount');
        try {
          const res = await axios.post('http://localhost:3000/api/admin/transfer', {
            userIds: selectedUsers.length ? selectedUsers : undefined,
            groupId: selectedGroup || undefined,
            amount: parseInt(mintAmount),
            mint: mintTokenId,
          }, { headers: { Authorization: `Bearer ${token}` } });
          alert(res.data.message);
          setSelectedUsers([]);
          setSelectedGroup('');
          setMintAmount('');
          setMintTokenId('');
          await fetchUsers();
          await fetchUserTokenBalances();
        } catch (error) {
          alert('Failed to transfer tokens: ' + (error.response?.data?.error || error.message));
        }
        break;
      case 'edit':
        // Placeholder for editing token (e.g., name, description, etc.)
        alert('Editing tokens is not fully implemented yet. Update via database or extend this logic.');
        break;
      case 'delete':
        if (!mintTokenId) return alert('Please select a token to delete');
        try {
          await axios.delete(`http://localhost:3000/api/admin/tokens/${mintTokenId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          alert('Token deleted!');
          setMintTokenId('');
          await fetchTokens();
          await fetchUserTokenBalances();
        } catch (error) {
          alert('Failed to delete token: ' + (error.response?.data?.error || error.message));
        }
        break;
      default:
        alert('Unknown token action');
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

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateUserGroup = async () => {
    if (!groupName) return alert('Please enter a group name');
    try {
      const res = await axios.post('http://localhost:3000/api/admin/user-groups/create', {
        name: groupName,
        userIds: groupUsers,
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert(res.data.message);
      setGroupName('');
      setGroupUsers([]);
      await fetchUserGroups();
    } catch (error) {
      alert('Failed to create user group: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateUserGroup = async () => {
    if (!selectedGroup) return alert('Please select a group to update');
    try {
      const res = await axios.post('http://localhost:3000/api/admin/user-groups/update', {
        groupId: selectedGroup,
        name: groupName,
        userIds: groupUsers,
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert(res.data.message);
      setGroupName('');
      setGroupUsers([]);
      setSelectedGroup('');
      await fetchUserGroups();
    } catch (error) {
      alert('Failed to update user group: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteUserGroup = async () => {
    if (!selectedGroup) return alert('Please select a group to delete');
    try {
      await axios.post('http://localhost:3000/api/admin/user-groups/delete', {
        groupId: selectedGroup,
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('User group deleted!');
      setSelectedGroup('');
      await fetchUserGroups();
    } catch (error) {
      alert('Failed to delete user group: ' + (error.response?.data?.error || error.message));
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
      <div className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <div className="token-actions-nav">
          <select value={tokenAction} onChange={(e) => setTokenAction(e.target.value)} className="token-action-dropdown">
            <option value="create">Create Token</option>
            <option value="mint">Mint More Tokens</option>
            <option value="airdrop">Airdrop Tokens</option>
            <option value="transfer">Transfer Tokens</option>
            <option value="edit">Edit Token</option>
            <option value="delete">Delete Token</option>
          </select>
          <button onClick={handleTokenAction} className="action-button">
            {tokenAction.charAt(0).toUpperCase() + tokenAction.slice(1)}
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          onClick={() => { setActiveMenu('tokens'); navigate('/admin', { state: { activeMenu: 'tokens' } }); }}
          className={activeMenu === 'tokens' ? 'tab active' : 'tab'}
        >
          Token Actions
        </button>
        <button
          onClick={() => { setActiveMenu('users'); navigate('/admin', { state: { activeMenu: 'users' } }); }}
          className={activeMenu === 'users' ? 'tab active' : 'tab'}
        >
          User Management
        </button>
        <button
          onClick={() => { setActiveMenu('groups'); navigate('/admin', { state: { activeMenu: 'groups' } }); }}
          className={activeMenu === 'groups' ? 'tab active' : 'tab'}
        >
          User Groups
        </button>
        <button
          onClick={() => { setActiveMenu('travel'); navigate('/admin', { state: { activeMenu: 'travel' } }); }}
          className={activeMenu === 'travel' ? 'tab active' : 'tab'}
        >
          Travel Packages
        </button>
      </div>

      <div className="admin-content">
        {activeMenu === 'tokens' && (
          <div className="form-section token-actions">
            {tokenAction === 'create' && (
              <div className="token-form">
                <h2>Create Token</h2>
                <input value={tokenName} onChange={(e) => setTokenName(e.target.value)} placeholder="Name" />
                <input value={tokenSupply} onChange={(e) => setTokenSupply(e.target.value)} placeholder="Supply" type="number" />
                <input value={tokenImage} onChange={(e) => setTokenImage(e.target.value)} placeholder="Image URL" />
                <input value={tokenDesc} onChange={(e) => setTokenDesc(e.target.value)} placeholder="Description" />
                <input value={tokenTicker} onChange={(e) => setTokenTicker(e.target.value)} placeholder="Ticker" />
              </div>
            )}

            {tokenAction === 'mint' && (
              <div className="token-form">
                <h2>Mint More Tokens</h2>
                <select value={mintTokenId} onChange={(e) => setMintTokenId(e.target.value)}>
                  <option value="">Select Token</option>
                  {tokens.map(token => (
                    <option key={token.mint} value={token.mint}>
                      {token.name} ({token.ticker}) - Admin Remaining: {getAdminBalanceForToken(token.mint)}
                    </option>
                  ))}
                </select>
                <input value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} placeholder="Amount" type="number" />
              </div>
            )}

            {['airdrop', 'transfer'].includes(tokenAction) && (
              <div className="token-form">
                <h2>{tokenAction === 'airdrop' ? 'Airdrop Tokens' : 'Transfer Tokens'}</h2>
                <div className="user-filters">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="created_at">Creation Date</option>
                    <option value="email">Email</option>
                    <option value="id">ID</option>
                  </select>
                  <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End Date"
                  />
                  <button onClick={fetchUsers}>Filter</button>
                </div>
                <div>
                  <h3>Select Users or Group</h3>
                  <div className="user-selection">
                    {users.map(user => (
                      <label key={user.id}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                        />
                        {user.email} ({user.wallet}) - Created: {new Date(user.created_at).toLocaleDateString()} - Balances: {tokens.map(t => `${t.ticker}: ${getUserBalanceForToken(user.id, t.mint)}`).join(', ')}
                      </label>
                    ))}
                  </div>
                  <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                    <option value="">Select Group</option>
                    {userGroups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name} (Users: {group.user_ids?.join(', ') || 'None'})
                      </option>
                    ))}
                  </select>
                </div>
                <select value={mintTokenId} onChange={(e) => setMintTokenId(e.target.value)}>
                  <option value="">Select Token Mint</option>
                  {tokens.map(token => (
                    <option key={token.mint} value={token.mint}>
                      {token.name} ({token.ticker}) - {tokenAction === 'airdrop' ? `Total Supply: ${token.supply}, Admin Remaining: ${getAdminBalanceForToken(token.mint)}` : `Admin Remaining: ${getAdminBalanceForToken(token.mint)}`}
                    </option>
                  ))}
                </select>
                <input value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} placeholder="Amount" type="number" />
                <button onClick={handleTokenAction}>{tokenAction === 'airdrop' ? 'Airdrop' : 'Transfer'}</button>
              </div>
            )}

            {tokenAction === 'edit' && (
              <div className="token-form">
                <h2>Edit Token</h2>
                <p>Editing tokens is not fully implemented yet. Update via database or extend this logic.</p>
                <select value={mintTokenId} onChange={(e) => setMintTokenId(e.target.value)}>
                  <option value="">Select Token</option>
                  {tokens.map(token => (
                    <option key={token.mint} value={token.mint}>
                      {token.name} ({token.ticker})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {tokenAction === 'delete' && (
              <div className="token-form">
                <h2>Delete Token</h2>
                <select value={mintTokenId} onChange={(e) => setMintTokenId(e.target.value)}>
                  <option value="">Select Token</option>
                  {tokens.map(token => (
                    <option key={token.mint} value={token.mint}>
                      {token.name} ({token.ticker}) - Admin Remaining: {getAdminBalanceForToken(token.mint)}
                    </option>
                  ))}
                </select>
                <button onClick={handleTokenAction}>Delete</button>
              </div>
            )}
          </div>
        )}

        {activeMenu === 'users' && (
          <div className="form-section user-management">
            <h2>User Management</h2>
            <div className="user-filters">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="created_at">Creation Date</option>
                <option value="email">Email</option>
                <option value="id">ID</option>
              </select>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start Date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End Date"
              />
              <button onClick={fetchUsers}>Filter</button>
            </div>
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
                  <th>Created</th>
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
                        <td>{new Date(editingUser.created_at).toLocaleDateString()}</td>
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
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
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

        {activeMenu === 'groups' && (
          <div className="form-section user-groups">
            <h2>User Group Management</h2>
            <div className="user-filters">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="created_at">Creation Date</option>
                <option value="email">Email</option>
                <option value="id">ID</option>
              </select>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start Date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End Date"
              />
              <button onClick={fetchUsers}>Filter</button>
            </div>
            <div className="group-form">
              <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group Name" />
              <div className="user-selection">
                {users.map(user => (
                  <label key={user.id}>
                    <input
                      type="checkbox"
                      checked={groupUsers.includes(user.id)}
                      onChange={() => setGroupUsers(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id])}
                    />
                    {user.email} ({user.wallet}) - Created: {new Date(user.created_at).toLocaleDateString()}
                  </label>
                ))}
              </div>
              <button onClick={handleCreateUserGroup}>Create Group</button>
              <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                <option value="">Select Group to Edit/Delete</option>
                {userGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name} (Users: {group.user_ids?.join(', ') || 'None'})
                  </option>
                ))}
              </select>
              {selectedGroup && (
                <>
                  <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="New Group Name" />
                  <div className="user-selection">
                    {users.map(user => (
                      <label key={user.id}>
                        <input
                          type="checkbox"
                          checked={groupUsers.includes(user.id)}
                          onChange={() => setGroupUsers(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id])}
                        />
                        {user.email} ({user.wallet}) - Created: {new Date(user.created_at).toLocaleDateString()}
                      </label>
                    ))}
                  </div>
                  <button onClick={handleUpdateUserGroup}>Update Group</button>
                  <button onClick={handleDeleteUserGroup}>Delete Group</button>
                </>
              )}
            </div>
          </div>
        )}

        {activeMenu === 'travel' && (
          <div className="form-section travel-packages">
            <h2>Travel Package Management</h2>
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
    </div>
  );
};

export default Admin;