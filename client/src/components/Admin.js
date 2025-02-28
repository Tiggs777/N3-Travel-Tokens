import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from './Modal';
import './Admin.css';

const Admin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(location.state?.activeMenu || 'tokensView');
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
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [userGroups, setUserGroups] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupUsers, setGroupUsers] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [users, setUsers] = useState([]);
  const [travelPackages, setTravelPackages] = useState([]);
  const [travelPackageGroups, setTravelPackageGroups] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editingToken, setEditingToken] = useState(null);
  const [editingTravel, setEditingTravel] = useState(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [selectedTokens, setSelectedTokens] = useState([]);
  const [userTokenBalances, setUserTokenBalances] = useState([]);
  const [adminTokenBalances, setAdminTokenBalances] = useState({});
  const [systemWalletBalance, setSystemWalletBalance] = useState(null);
  const [systemWalletPublicKey, setSystemWalletPublicKey] = useState(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteAction, setDeleteAction] = useState(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [tokenViewMode, setTokenViewMode] = useState('list');
  const [userViewMode, setUserViewMode] = useState('list'); // New for usersView
  const [travelPackageViewMode, setTravelPackageViewMode] = useState('list'); // New for travelPackageView
  const [selectedToken, setSelectedToken] = useState(null);

  const tokenAuth = localStorage.getItem('token');
  const user = tokenAuth ? jwtDecode(tokenAuth) : null;

  useEffect(() => {
    console.log('travelPackageGroups state updated:', travelPackageGroups);
  }, [travelPackageGroups]);

  useEffect(() => {
    console.log('userGroups state updated:', userGroups);
  }, [userGroups]);

  useEffect(() => {
    console.log('Active tab updated:', location.state?.activeMenu);
    if (location.state?.activeMenu) {
      setActiveTab(location.state.activeMenu);
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
        fetchUserGroups(),
        fetchTravelPackageGroups(),
        fetchSystemWalletBalance(),
        fetchSystemWalletPublicKey(),
      ]);
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  };

  const fetchWithSessionCheck = async (requestFn) => {
    try {
      const res = await requestFn();
      return res;
    } catch (error) {
      if (error.response?.status === 401) {
        setIsSessionExpired(true);
        localStorage.removeItem('token');
      }
      throw error;
    }
  };

  const fetchUsers = async () => {
    const params = new URLSearchParams({ sort: sortBy, order: sortOrder, startDate, endDate }).toString();
    const res = await fetchWithSessionCheck(() =>
      axios.get(process.env.REACT_APP_API_URL + '/api/admin/users/info?' + params, {
        headers: { Authorization: `Bearer ${tokenAuth}` },
      })
    );
    console.log('Fetched users:', res.data);
    setUsers(res.data || []);
  };

  const fetchTravelPackages = async () => {
    const res = await fetchWithSessionCheck(() =>
      axios.get(process.env.REACT_APP_API_URL + '/api/travel', {
        headers: { Authorization: `Bearer ${tokenAuth}` },
      })
    );
    console.log('Fetched travel packages:', res.data);
    setTravelPackages(res.data || []);
  };

  const fetchTokens = async () => {
    const res = await fetchWithSessionCheck(() =>
      axios.get(process.env.REACT_APP_API_URL + '/api/admin/tokens', {
        headers: { Authorization: `Bearer ${tokenAuth}` },
      })
    );
    console.log('Fetched tokens:', res.data);
    setTokens(res.data || []);
  };

  const fetchUserTokenBalances = async () => {
    const res = await fetchWithSessionCheck(() =>
      axios.get(process.env.REACT_APP_API_URL + '/api/admin/user-token-balances', {
        headers: { Authorization: `Bearer ${tokenAuth}` },
      })
    );
    setUserTokenBalances(res.data.users || []);
    setAdminTokenBalances(res.data.admin || {});
    console.log('Fetched admin balances:', res.data.admin);
    console.log('Fetched user balances:', res.data.users);
  };

  const fetchUserGroups = async () => {
    try {
      console.log('Fetching user groups...');
      const res = await fetchWithSessionCheck(() =>
        axios.get(process.env.REACT_APP_API_URL + '/api/admin/user-groups', {
          headers: { Authorization: `Bearer ${tokenAuth}` },
        })
      );
      console.log('API response for user groups:', res.data);
      const groups = Array.isArray(res.data) ? res.data : [];
      const formattedGroups = groups.map(group => ({
        id: group.id,
        name: group.name,
        user_ids: group.user_ids || [],
      }));
      console.log('Formatted user groups:', formattedGroups);
      setUserGroups(formattedGroups);
    } catch (error) {
      console.error('Failed to fetch user groups:', error.response?.status, error.response?.data || error.message);
      setUserGroups([]);
    }
  };

  const fetchTravelPackageGroups = async () => {
    try {
      console.log('Fetching travel package groups...');
      const res = await fetchWithSessionCheck(() =>
        axios.get(process.env.REACT_APP_API_URL + '/api/travel-package-groups', {
          headers: { Authorization: `Bearer ${tokenAuth}` },
        })
      );
      console.log('API response for travel package groups (raw):', res.data);
      const groups = Array.isArray(res.data) ? res.data.map(group => ({
        id: group.id,
        name: group.name,
        packageIds: group.packageIds || [],
      })) : [];
      console.log('Setting travelPackageGroups (formatted):', groups);
      setTravelPackageGroups(groups);
      return groups;
    } catch (error) {
      console.error('Error fetching travel package groups:', error.response?.status, error.response?.data || error.message);
      setTravelPackageGroups([]);
      throw error;
    }
  };

  const fetchSystemWalletBalance = async () => {
    try {
      const res = await fetchWithSessionCheck(() =>
        axios.get(process.env.REACT_APP_API_URL + '/api/admin/system-wallet/balance', {
          headers: { Authorization: `Bearer ${tokenAuth}` },
        })
      );
      console.log('Fetched system wallet balance:', res.data);
      setSystemWalletBalance(res.data.balance);
    } catch (error) {
      console.error('Failed to fetch system wallet balance:', error.response?.status, error.response?.data || error.message);
      setSystemWalletBalance(null);
    }
  };

  const fetchSystemWalletPublicKey = async () => {
    try {
      const res = await fetchWithSessionCheck(() =>
        axios.get(process.env.REACT_APP_API_URL + '/api/admin/system-wallet/public-key', {
          headers: { Authorization: `Bearer ${tokenAuth}` },
        })
      );
      console.log('Fetched system wallet public key:', res.data);
      setSystemWalletPublicKey(res.data.publicKey);
    } catch (error) {
      console.error('Failed to fetch system wallet public key:', error.response?.status, error.response?.data || error.message);
      setSystemWalletPublicKey(null);
    }
  };

  const handleTabChange = (newTab) => {
    console.log('Switching to tab:', newTab);
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to switch?')) {
        return;
      }
      setHasUnsavedChanges(false);
    }
    // Default to "View" tab when switching categories
    if (newTab.startsWith('tokens') && newTab !== 'tokensView') setActiveTab('tokensView');
    else if (newTab.startsWith('users') && newTab !== 'usersView') setActiveTab('usersView');
    else if (newTab.startsWith('wallet') && newTab !== 'walletAdmin') setActiveTab('walletAdmin');
    else if (newTab.startsWith('travelPackage') && newTab !== 'travelPackageView') setActiveTab('travelPackageView');
    else setActiveTab(newTab);
    navigate('/admin', { state: { activeMenu: newTab } });
  };

  const confirmDelete = (action) => {
    setDeleteAction(() => action);
    setIsDeleteModalOpen(true);
  };

  const handleCreateToken = async () => {
    if (!tokenName || !tokenSupply || !tokenImage || !tokenDesc || !tokenTicker)
      return alert('Please fill in all token fields');
    try {
      const res = await fetchWithSessionCheck(() =>
        axios.post(process.env.REACT_APP_API_URL + '/api/admin/token', {
          name: tokenName,
          supply: parseInt(tokenSupply),
          image_url: tokenImage,
          description: tokenDesc,
          ticker: tokenTicker,
        }, { headers: { Authorization: `Bearer ${tokenAuth}` } })
      );
      alert(`Token created! Mint: ${res.data.mint}`);
      setTokenName('');
      setTokenSupply('');
      setTokenImage('');
      setTokenDesc('');
      setTokenTicker('');
      setHasUnsavedChanges(false);
      await fetchTokens();
      await fetchUserTokenBalances();
    } catch (error) {
      alert('Failed to create token: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleMintToken = async () => {
    if (!mintTokenId || !mintAmount) return alert('Please select a token and specify an amount');
    try {
      const res = await fetchWithSessionCheck(() =>
        axios.post(process.env.REACT_APP_API_URL + '/api/admin/token/mint', {
          mint: mintTokenId,
          amount: parseInt(mintAmount),
        }, { headers: { Authorization: `Bearer ${tokenAuth}` } })
      );
      alert(res.data.message);
      setMintTokenId('');
      setMintAmount('');
      setHasUnsavedChanges(false);
      await fetchTokens();
      await fetchUserTokenBalances();
    } catch (error) {
      alert('Failed to mint more tokens: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAirdropTokens = async () => {
    if (!selectedUsers.length && !selectedGroup || !mintAmount)
      return alert('Please select users, a group, or leave default to all users and specify an amount');
    let userIds = selectedUsers;
    if (selectedGroup) {
      const group = userGroups.find(g => g.id === parseInt(selectedGroup));
      userIds = group ? (group.user_ids || []) : [];
    } else {
      userIds = users.map(u => u.id);
    }
    try {
      const res = await fetchWithSessionCheck(() =>
        axios.post(process.env.REACT_APP_API_URL + '/api/admin/airdrop', {
          userIds: userIds.length ? userIds : undefined,
          groupId: selectedGroup || undefined,
          amount: parseInt(mintAmount),
          mint: mintTokenId,
        }, { headers: { Authorization: `Bearer ${tokenAuth}` } })
      );
      alert(res.data.message);
      setSelectedUsers([]);
      setSelectedGroup('');
      setMintAmount('');
      setMintTokenId('');
      setHasUnsavedChanges(false);
      await fetchUsers();
      await fetchUserTokenBalances();
      await fetchTokens();
    } catch (error) {
      alert('Failed to airdrop tokens: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleTransferTokens = async () => {
    if (!selectedUsers.length && !selectedGroup || !mintAmount)
      return alert('Please select users, a group, or leave default to all users and specify an amount');
    let userIds = selectedUsers;
    if (selectedGroup) {
      const group = userGroups.find(g => g.id === parseInt(selectedGroup));
      userIds = group ? (group.user_ids || []) : [];
    } else {
      userIds = users.map(u => u.id);
    }
    try {
      const res = await fetchWithSessionCheck(() =>
        axios.post(process.env.REACT_APP_API_URL + '/api/admin/transfer', {
          userIds: userIds.length ? userIds : undefined,
          groupId: selectedGroup || undefined,
          amount: parseInt(mintAmount),
          mint: mintTokenId,
        }, { headers: { Authorization: `Bearer ${tokenAuth}` } })
      );
      alert(res.data.message);
      setSelectedUsers([]);
      setSelectedGroup('');
      setMintAmount('');
      setMintTokenId('');
      setHasUnsavedChanges(false);
      await fetchUsers();
      await fetchUserTokenBalances();
    } catch (error) {
      alert('Failed to transfer tokens: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEditToken = (token) => {
    setEditingToken({ ...token });
    setHasUnsavedChanges(true);
  };

  const handleSaveToken = async () => {
    if (!editingToken) return;
    try {
      await fetchWithSessionCheck(() =>
        axios.post(process.env.REACT_APP_API_URL + '/api/admin/token/update', {
          mint: editingToken.mint,
          name: editingToken.name,
          supply: parseInt(editingToken.supply),
          image_url: editingToken.image_url,
          description: editingToken.description,
          ticker: editingToken.ticker,
        }, { headers: { Authorization: `Bearer ${tokenAuth}` } })
      );
      alert('Token updated!');
      setEditingToken(null);
      setHasUnsavedChanges(false);
      await fetchTokens();
      await fetchUserTokenBalances();
    } catch (error) {
      alert('Failed to update token: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteToken = async (mint) => {
    confirmDelete(async () => {
      try {
        await fetchWithSessionCheck(() =>
          axios.delete(process.env.REACT_APP_API_URL + '/api/admin/tokens/' + mint, {
            headers: { Authorization: `Bearer ${tokenAuth}` },
          })
        );
        alert('Token deleted!');
        setHasUnsavedChanges(false);
        await fetchTokens();
        await fetchUserTokenBalances();
      } catch (error) {
        alert('Failed to delete token: ' + (error.response?.data?.error || error.message));
      }
    });
  };

  const handleDeleteMultipleTokens = async () => {
    if (selectedTokens.length === 0) return alert('Please select at least one token to delete');
    confirmDelete(async () => {
      try {
        await fetchWithSessionCheck(() =>
          axios.post(process.env.REACT_APP_API_URL + '/api/admin/tokens/delete', { mints: selectedTokens }, {
            headers: { Authorization: `Bearer ${tokenAuth}` },
          })
        );
        alert(`${selectedTokens.length} token(s) deleted!`);
        setSelectedTokens([]);
        setHasUnsavedChanges(false);
        await fetchTokens();
        await fetchUserTokenBalances();
      } catch (error) {
        alert('Failed to delete tokens: ' + (error.response?.data?.error || error.message));
      }
    });
  };

  const handleCreateTravel = async () => {
    if (!travelName || !travelPrice || !travelImage || !travelDesc)
      return alert('Please fill in all travel package fields');
    try {
      const res = await fetchWithSessionCheck(() =>
        axios.post(process.env.REACT_APP_API_URL + '/api/admin/travel', {
          name: travelName,
          price: parseInt(travelPrice),
          image_url: travelImage,
          description: travelDesc,
        }, { headers: { Authorization: `Bearer ${tokenAuth}` } })
      );
      alert('Travel package created!');
      setTravelName('');
      setTravelPrice('');
      setTravelImage('');
      setTravelDesc('');
      setHasUnsavedChanges(false);
      await fetchTravelPackages();
    } catch (error) {
      console.error('Failed to create travel package:', error);
      alert('Failed to create travel package: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateTravel = async () => {
    if (!editingTravel) return;
    try {
      const res = await fetchWithSessionCheck(() =>
        axios.post(process.env.REACT_APP_API_URL + '/api/admin/travel/update', {
          id: editingTravel.id,
          name: editingTravel.name,
          price: parseInt(editingTravel.price),
          image_url: editingTravel.image_url,
          description: editingTravel.description,
        }, { headers: { Authorization: `Bearer ${tokenAuth}` } })
      );
      alert('Travel package updated!');
      setEditingTravel(null);
      setHasUnsavedChanges(false);
      await fetchTravelPackages();
    } catch (error) {
      console.error('Failed to update travel package:', error);
      alert('Failed to update travel package: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteTravel = async (id) => {
    confirmDelete(async () => {
      try {
        await fetchWithSessionCheck(() =>
          axios.post(process.env.REACT_APP_API_URL + '/api/admin/travel/delete', { ids: [id] }, {
            headers: { Authorization: `Bearer ${tokenAuth}` },
          })
        );
        alert('Travel package deleted!');
        setHasUnsavedChanges(false);
        await fetchTravelPackages();
      } catch (error) {
        console.error('Failed to delete travel package:', error);
        alert('Failed to delete travel package: ' + (error.response?.data?.error || error.message));
      }
    });
  };

  const handleDeleteMultipleTravel = async () => {
    if (selectedPackages.length === 0) return alert('Please select at least one travel package to delete');
    confirmDelete(async () => {
      try {
        await fetchWithSessionCheck(() =>
          axios.post(process.env.REACT_APP_API_URL + '/api/admin/travel/delete', { ids: selectedPackages }, {
            headers: { Authorization: `Bearer ${tokenAuth}` },
          })
        );
        alert(`${selectedPackages.length} travel package(s) deleted!`);
        setSelectedPackages([]);
        setHasUnsavedChanges(false);
        await fetchTravelPackages();
      } catch (error) {
        console.error('Failed to delete travel packages:', error);
        alert('Failed to delete travel packages: ' + (error.response?.data?.error || error.message));
      }
    });
  };

  const handleSelectPackage = (id) => {
    setSelectedPackages(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
    setHasUnsavedChanges(true);
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    setHasUnsavedChanges(true);
  };

  const handleSelectToken = (mint) => {
    setSelectedTokens(prev => prev.includes(mint) ? prev.filter(m => m !== mint) : [...prev, mint]);
    setHasUnsavedChanges(true);
  };

  const handleCreateUserGroup = async () => {
    if (!groupName) return alert('Please enter a group name');
    try {
      const res = await fetchWithSessionCheck(() =>
        axios.post(process.env.REACT_APP_API_URL + '/api/admin/user-groups/create', {
          name: groupName,
          userIds: groupUsers,
        }, { headers: { Authorization: `Bearer ${tokenAuth}` } })
      );
      alert(res.data.message);
      setGroupName('');
      setGroupUsers([]);
      setHasUnsavedChanges(false);
      await fetchUserGroups();
    } catch (error) {
      alert('Failed to create user group: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateUserGroup = async () => {
    if (!selectedGroup) return alert('Please select a group to update');
    try {
      const res = await fetchWithSessionCheck(() =>
        axios.post(process.env.REACT_APP_API_URL + '/api/admin/user-groups/update', {
          groupId: selectedGroup,
          name: groupName || userGroups.find(g => g.id === parseInt(selectedGroup))?.name,
          userIds: groupUsers,
        }, { headers: { Authorization: `Bearer ${tokenAuth}` } })
      );
      alert(res.data.message);
      setGroupName('');
      setGroupUsers([]);
      setSelectedGroup('');
      setHasUnsavedChanges(false);
      await fetchUserGroups();
    } catch (error) {
      alert('Failed to update user group: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteUserGroup = async () => {
    if (!selectedGroup) return alert('Please select a group to delete');
    confirmDelete(async () => {
      try {
        await fetchWithSessionCheck(() =>
          axios.post(process.env.REACT_APP_API_URL + '/api/admin/user-groups/delete', {
            groupId: selectedGroup,
          }, { headers: { Authorization: `Bearer ${tokenAuth}` } })
        );
        alert('User group deleted!');
        setSelectedGroup('');
        setHasUnsavedChanges(false);
        await fetchUserGroups();
      } catch (error) {
        alert('Failed to delete user group: ' + (error.response?.data?.error || error.message));
      }
    });
  };

  const handleDeleteMultipleUsers = async () => {
    if (selectedUsers.length === 0) return alert('Please select at least one user to delete');
    confirmDelete(async () => {
      try {
        await fetchWithSessionCheck(() =>
          axios.post(process.env.REACT_APP_API_URL + '/api/admin/users/delete', { userIds: selectedUsers }, {
            headers: { Authorization: `Bearer ${tokenAuth}` },
          })
        );
        alert(`${selectedUsers.length} user(s) deleted!`);
        setSelectedUsers([]);
        setHasUnsavedChanges(false);
        await fetchUsers();
        await fetchUserTokenBalances();
      } catch (error) {
        alert('Failed to delete users: ' + (error.response?.data?.error || error.message));
      }
    });
  };

  const handleCreateTravelPackageGroup = async () => {
    if (!groupName) return alert('Please enter a group name');
    try {
      const res = await fetchWithSessionCheck(() =>
        axios.post(process.env.REACT_APP_API_URL + '/api/travel-package-groups/create', {
          name: groupName,
          packageIds: selectedPackages,
        }, { headers: { Authorization: `Bearer ${tokenAuth}` } })
      );
      alert(res.data.message);
      setGroupName('');
      setSelectedPackages([]);
      setHasUnsavedChanges(false);
      await fetchTravelPackageGroups();
    } catch (error) {
      console.error('Failed to create travel package group:', error.response?.status, error.response?.data || error.message);
      alert('Failed to create travel package group: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateTravelPackageGroup = async () => {
    if (!selectedGroup) return alert('Please select a group to update');
    try {
      const res = await fetchWithSessionCheck(() =>
        axios.post(process.env.REACT_APP_API_URL + '/api/travel-package-groups/update', {
          groupId: selectedGroup,
          name: groupName || travelPackageGroups.find(g => g.id === parseInt(selectedGroup))?.name,
          packageIds: selectedPackages,
        }, { headers: { Authorization: `Bearer ${tokenAuth}` } })
      );
      alert(res.data.message);
      setGroupName('');
      setSelectedPackages([]);
      setSelectedGroup('');
      setHasUnsavedChanges(false);
      await fetchTravelPackageGroups();
    } catch (error) {
      console.error('Failed to update travel package group:', error.response?.status, error.response?.data || error.message);
      alert('Failed to update travel package group: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteTravelPackageGroup = async () => {
    if (!selectedGroup) return alert('Please select a group to delete');
    confirmDelete(async () => {
      try {
        const res = await fetchWithSessionCheck(() =>
          axios.post(process.env.REACT_APP_API_URL + '/api/travel-package-groups/delete', {
            groupId: selectedGroup,
          }, { headers: { Authorization: `Bearer ${tokenAuth}` } })
        );
        alert('Travel package group deleted!');
        setSelectedGroup('');
        setHasUnsavedChanges(false);
        await fetchTravelPackageGroups();
      } catch (error) {
        console.error('Failed to delete travel package group:', error.response?.status, error.response?.data || error.message);
        alert('Failed to delete travel package group: ' + (error.response?.data?.error || error.message));
      }
    });
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) return alert('Please fill in email and password');
    try {
      const res = await fetchWithSessionCheck(() =>
        axios.post(process.env.REACT_APP_API_URL + '/api/admin/users/create', {
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }, { headers: { Authorization: `Bearer ${tokenAuth}` } })
      );
      alert(res.data.message);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      setHasUnsavedChanges(false);
      await fetchUsers();
      await fetchUserTokenBalances();
    } catch (error) {
      alert('Failed to create user: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({ ...user });
    setHasUnsavedChanges(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    try {
      await fetchWithSessionCheck(() =>
        axios.post(process.env.REACT_APP_API_URL + '/api/admin/users/update', {
          userId: editingUser.id,
          email: editingUser.email,
          wallet: editingUser.wallet,
          privateKey: editingUser.private_key,
          role: editingUser.role,
        }, { headers: { Authorization: `Bearer ${tokenAuth}` } })
      );
      alert('User info updated!');
      setEditingUser(null);
      setHasUnsavedChanges(false);
      await fetchUsers();
      await fetchUserTokenBalances();
    } catch (error) {
      alert('Failed to update user: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteUser = async (userId) => {
    confirmDelete(async () => {
      try {
        await fetchWithSessionCheck(() =>
          axios.post(process.env.REACT_APP_API_URL + '/api/admin/users/delete', { userId }, {
            headers: { Authorization: `Bearer ${tokenAuth}` },
          })
        );
        alert('User deleted!');
        setHasUnsavedChanges(false);
        await fetchUsers();
        await fetchUserTokenBalances();
      } catch (error) {
        alert('Failed to delete user: ' + (error.response?.data?.error || error.message));
      }
    });
  };

  const handleImpersonate = async (userId) => {
    try {
      const res = await fetchWithSessionCheck(() =>
        axios.post(process.env.REACT_APP_API_URL + '/api/admin/impersonate', { userId }, {
          headers: { Authorization: `Bearer ${tokenAuth}` },
        })
      );
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
        <h1 className="admin-title">{`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('Crud', ' CRUD').replace('Package', ' Package').replace('Groups', ' Groups')} Dashboard`}</h1>
      </div>

      <div className="admin-tabs">
        {activeTab.startsWith('tokens') && (
          <>
            <button
              onClick={() => handleTabChange('tokensView')}
              className={activeTab === 'tokensView' ? 'tab active' : 'tab'}
            >
              View Tokens
            </button>
            <button
              onClick={() => handleTabChange('tokensMint')}
              className={activeTab === 'tokensMint' ? 'tab active' : 'tab'}
            >
              Mint more Tokens
            </button>
            <button
              onClick={() => handleTabChange('tokensAirdrop')}
              className={activeTab === 'tokensAirdrop' ? 'tab active' : 'tab'}
            >
              Airdrop to Users
            </button>
            <button
              onClick={() => handleTabChange('tokensTransfer')}
              className={activeTab === 'tokensTransfer' ? 'tab active' : 'tab'}
            >
              Transfer to Users
            </button>
            <button
              onClick={() => handleTabChange('tokensCrud')}
              className={activeTab === 'tokensCrud' ? 'tab active' : 'tab'}
            >
              Tokens CRUD Panel
            </button>
          </>
        )}
        {activeTab.startsWith('users') && (
          <>
            <button
              onClick={() => handleTabChange('usersView')}
              className={activeTab === 'usersView' ? 'tab active' : 'tab'}
            >
              View Users
            </button>
            <button
              onClick={() => handleTabChange('usersCrud')}
              className={activeTab === 'usersCrud' ? 'tab active' : 'tab'}
            >
              User CRUD + groups
            </button>
            <button
              onClick={() => handleTabChange('usersGroups')}
              className={activeTab === 'usersGroups' ? 'tab active' : 'tab'}
            >
              User Groups
            </button>
          </>
        )}
        {activeTab.startsWith('wallet') && (
          <>
            <button
              onClick={() => handleTabChange('walletAdmin')}
              className={activeTab === 'walletAdmin' ? 'tab active' : 'tab'}
            >
              System Wallet
            </button>
            <button
              onClick={() => handleTabChange('walletWebsite')}
              className={activeTab === 'walletWebsite' ? 'tab active' : 'tab'}
            >
              Website Wallet
            </button>
            <button
              onClick={() => handleTabChange('walletWeb')}
              className={activeTab === 'walletWeb' ? 'tab active' : 'tab'}
            >
              Web Wallet
            </button>
            <button
              onClick={() => handleTabChange('walletAll')}
              className={activeTab === 'walletAll' ? 'tab active' : 'tab'}
            >
              All Wallets
            </button>
          </>
        )}
        {activeTab.startsWith('travelPackage') && (
          <>
            <button
              onClick={() => handleTabChange('travelPackageView')}
              className={activeTab === 'travelPackageView' ? 'tab active' : 'tab'}
            >
              View Travel Packages
            </button>
            <button
              onClick={() => handleTabChange('travelPackageCrud')}
              className={activeTab === 'travelPackageCrud' ? 'tab active' : 'tab'}
            >
              Travel Package CRUD + groups
            </button>
            <button
              onClick={() => handleTabChange('travelPackageGroups')}
              className={activeTab === 'travelPackageGroups' ? 'tab active' : 'tab'}
            >
              Travel Package Groups
            </button>
          </>
        )}
      </div>

      <div className="admin-work-area">
	  
	          {activeTab === 'tokensView' && (
          <div className="work-section">
            <h2>View Tokens</h2>
            <div className="view-toggle">
              <button
                className={tokenViewMode === 'list' ? 'tab active' : 'tab'}
                onClick={() => setTokenViewMode('list')}
              >
                List
              </button>
              <button
                className={tokenViewMode === 'tiles' ? 'tab active' : 'tab'}
                onClick={() => setTokenViewMode('tiles')}
              >
                Tiles
              </button>
            </div>
            <button onClick={handleDeleteMultipleTokens} className="delete-selected">Delete Selected</button>
            {console.log('Rendering tokensView, tokens:', tokens)}
            {tokens.length === 0 ? (
              <p>No tokens available. Create some in the Tokens CRUD panel.</p>
            ) : tokenViewMode === 'list' ? (
              <table className="token-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Mint</th>
                    <th>Name</th>
                    <th>Ticker</th>
                    <th>Supply</th>
                    <th>Thumbnail</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map(token => (
                    <tr key={token.mint} onClick={() => setSelectedToken(token)} style={{ cursor: 'pointer' }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedTokens.includes(token.mint)}
                          onChange={() => handleSelectToken(token.mint)}
                          onClick={e => e.stopPropagation()}
                        />
                      </td>
                      <td>{token.mint}</td>
                      <td>{token.name}</td>
                      <td>{token.ticker}</td>
                      <td>{token.supply}</td>
                      <td><img src={token.image_url} alt={token.name} className="thumbnail" /></td>
                      <td>{token.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="token-tiles">
                {tokens.map(token => (
                  <div key={token.mint} className="token-tile" onClick={() => setSelectedToken(token)}>
                    <input
                      type="checkbox"
                      checked={selectedTokens.includes(token.mint)}
                      onChange={() => handleSelectToken(token.mint)}
                      onClick={e => e.stopPropagation()}
                    />
                    <img src={token.image_url} alt={token.name} className="token-image" />
                    <h3>{token.name} ({token.ticker})</h3>
                    <p>Supply: {token.supply}</p>
                    <p>{token.description}</p>
                    <p>Mint: {token.mint}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'tokensMint' && (
          <div className="work-section">
            <h2>Mint more Tokens</h2>
            <select value={mintTokenId} onChange={(e) => setMintTokenId(e.target.value)} className="clean-select">
              <option value="">Select Token</option>
              {tokens.map(token => (
                <option key={token.mint} value={token.mint}>
                  {token.name} ({token.ticker}) - Admin Remaining: {getAdminBalanceForToken(token.mint)}
                </option>
              ))}
            </select>
            <input value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} placeholder="Amount" type="number" className="clean-input" />
            <button onClick={handleMintToken} className="clean-button">Mint</button>
          </div>
        )}
        {activeTab === 'tokensAirdrop' && (
          <div className="work-section">
            <h2>Airdrop to Users</h2>
            <div className="user-selection-area">
              <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="clean-select">
                <option value="">All Users</option>
                {userGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Email</th>
                    <th>Wallet</th>
                    <th>Token Balances</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGroup ? (
                    (userGroups.find(g => g.id === parseInt(selectedGroup))?.user_ids || []).map(userId => {
                      const user = users.find(u => u.id === userId);
                      return user ? (
                        <tr key={user.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleSelectUser(user.id)}
                            />
                          </td>
                          <td>{user.email}</td>
                          <td>{user.wallet}</td>
                          <td>{tokens.map(t => `${t.ticker}: ${getUserBalanceForToken(user.id, t.mint)}`).join(', ')}</td>
                        </tr>
                      ) : null;
                    })
                  ) : (
                    users.map(user => (
                      <tr key={user.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                          />
                        </td>
                        <td>{user.email}</td>
                        <td>{user.wallet}</td>
                        <td>{tokens.map(t => `${t.ticker}: ${getUserBalanceForToken(user.id, t.mint)}`).join(', ')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <select value={mintTokenId} onChange={(e) => setMintTokenId(e.target.value)} className="clean-select">
              <option value="">Select Token</option>
              {tokens.map(token => (
                <option key={token.mint} value={token.mint}>
                  {token.name} ({token.ticker})
                </option>
              ))}
            </select>
            <input value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} placeholder="Amount" type="number" className="clean-input" />
            <button onClick={handleAirdropTokens} className="clean-button">Airdrop</button>
          </div>
        )}
        {activeTab === 'tokensTransfer' && (
          <div className="work-section">
            <h2>Transfer to Users</h2>
            <div className="user-selection-area">
              <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="clean-select">
                <option value="">All Users</option>
                {userGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Email</th>
                    <th>Wallet</th>
                    <th>Token Balances</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGroup ? (
                    (userGroups.find(g => g.id === parseInt(selectedGroup))?.user_ids || []).map(userId => {
                      const user = users.find(u => u.id === userId);
                      return user ? (
                        <tr key={user.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleSelectUser(user.id)}
                            />
                          </td>
                          <td>{user.email}</td>
                          <td>{user.wallet}</td>
                          <td>{tokens.map(t => `${t.ticker}: ${getUserBalanceForToken(user.id, t.mint)}`).join(', ')}</td>
                        </tr>
                      ) : null;
                    })
                  ) : (
                    users.map(user => (
                      <tr key={user.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                          />
                        </td>
                        <td>{user.email}</td>
                        <td>{user.wallet}</td>
                        <td>{tokens.map(t => `${t.ticker}: ${getUserBalanceForToken(user.id, t.mint)}`).join(', ')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <select value={mintTokenId} onChange={(e) => setMintTokenId(e.target.value)} className="clean-select">
              <option value="">Select Token</option>
              {tokens.map(token => (
                <option key={token.mint} value={token.mint}>
                  {token.name} ({token.ticker})
                </option>
              ))}
            </select>
            <input value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} placeholder="Amount" type="number" className="clean-input" />
            <button onClick={handleTransferTokens} className="clean-button">Transfer</button>
          </div>
        )}
        {activeTab === 'tokensCrud' && (
          <div className="work-section">
            <h2>Tokens CRUD Panel</h2>
            <div className="crud-controls">
              <div className="user-filters">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="clean-select">
                  <option value="created_at">Creation Date</option>
                  <option value="name">Name</option>
                  <option value="mint">Mint</option>
                </select>
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="clean-select">
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="Start Date" className="clean-input" />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="End Date" className="clean-input" />
                <button onClick={fetchTokens} className="clean-button">Filter</button>
              </div>
              <div className="create-token-form">
                <input value={tokenName} onChange={(e) => setTokenName(e.target.value)} placeholder="Name" className="clean-input" />
                <input value={tokenSupply} onChange={(e) => setTokenSupply(e.target.value)} placeholder="Supply" type="number" className="clean-input" />
                <input value={tokenImage} onChange={(e) => setTokenImage(e.target.value)} placeholder="Image URL" className="clean-input" />
                <input value={tokenDesc} onChange={(e) => setTokenDesc(e.target.value)} placeholder="Description" className="clean-input" />
                <input value={tokenTicker} onChange={(e) => setTokenTicker(e.target.value)} placeholder="Ticker" className="clean-input" />
                <button onClick={handleCreateToken} className="clean-button">Add Token</button>
              </div>
            </div>
            <table className="token-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Mint</th>
                  <th>Name</th>
                  <th>Ticker</th>
                  <th>Supply</th>
                  <th>Thumbnail</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map(token => (
                  <tr key={token.mint}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedTokens.includes(token.mint)}
                        onChange={() => handleSelectToken(token.mint)}
                      />
                    </td>
                    {editingToken && editingToken.mint === token.mint ? (
                      <>
                        <td>{token.mint}</td>
                        <td><input value={editingToken.name} onChange={(e) => setEditingToken({ ...editingToken, name: e.target.value })} className="clean-input" /></td>
                        <td><input value={editingToken.ticker} onChange={(e) => setEditingToken({ ...editingToken, ticker: e.target.value })} className="clean-input" /></td>
                        <td><input value={editingToken.supply} onChange={(e) => setEditingToken({ ...editingToken, supply: e.target.value })} type="number" className="clean-input" /></td>
                        <td><img src={editingToken.image_url} alt={editingToken.name} className="thumbnail" /></td>
                        <td><input value={editingToken.description} onChange={(e) => setEditingToken({ ...editingToken, description: e.target.value })} className="clean-input" /></td>
                        <td>
                          <button onClick={handleSaveToken} className="clean-button">Save</button>
                          <button onClick={() => setEditingToken(null)} className="clean-button">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{token.mint}</td>
                        <td>{token.name}</td>
                        <td>{token.ticker}</td>
                        <td>{token.supply}</td>
                        <td><img src={token.image_url} alt={token.name} className="thumbnail" /></td>
                        <td>{token.description}</td>
                        <td>
                          <button onClick={() => handleEditToken(token)} className="clean-button">Edit</button>
                          <button onClick={() => handleDeleteToken(token.mint)} className="clean-button delete">Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'usersView' && (
          <div className="work-section">
            <h2>View Users</h2>
            <div className="view-toggle">
              <button
                className={userViewMode === 'list' ? 'tab active' : 'tab'}
                onClick={() => setUserViewMode('list')}
              >
                List
              </button>
              <button
                className={userViewMode === 'tiles' ? 'tab active' : 'tab'}
                onClick={() => setUserViewMode('tiles')}
              >
                Tiles
              </button>
            </div>
            <button onClick={handleDeleteMultipleUsers} className="delete-selected">Delete Selected</button>
            {console.log('Rendering usersView, users:', users)}
            {users.length === 0 ? (
              <p>No users available. Create some in the User CRUD panel.</p>
            ) : userViewMode === 'list' ? (
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Wallet</th>
                    <th>Created</th>
                    <th>Role</th>
                    <th>Token Balances</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                        />
                      </td>
                      <td>{user.id}</td>
                      <td>{user.email}</td>
                      <td>{user.wallet || 'N/A'}</td>
                      <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
                      <td>{user.role}</td>
                      <td>{tokens.map(t => `${t.ticker}: ${getUserBalanceForToken(user.id, t.mint)}`).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="user-tiles">
                {users.map(user => (
                  <div key={user.id} className="user-tile">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                    <h3>{user.email}</h3>
                    <p>ID: {user.id}</p>
                    <p>Wallet: {user.wallet || 'N/A'}</p>
                    <p>Created: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                    <p>Role: {user.role}</p>
                    <p>Balances: {tokens.map(t => `${t.ticker}: ${getUserBalanceForToken(user.id, t.mint)}`).join(', ')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'usersCrud' && (
          <div className="work-section">
            <h2>User CRUD + groups</h2>
            <div className="crud-controls">
              <div className="user-filters">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="clean-select">
                  <option value="created_at">Creation Date</option>
                  <option value="email">Email</option>
                  <option value="id">ID</option>
                </select>
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="clean-select">
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="Start Date" className="clean-input" />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="End Date" className="clean-input" />
                <button onClick={fetchUsers} className="clean-button">Filter</button>
              </div>
              <div className="create-user-form">
                <input value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="Email" className="clean-input" />
                <input value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="Password" type="password" className="clean-input" />
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} className="clean-select">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={handleCreateUser} className="clean-button">Add User</button>
              </div>
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
                        <td><input value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} className="clean-input" /></td>
                        <td><input value={editingUser.wallet} onChange={(e) => setEditingUser({ ...editingUser, wallet: e.target.value })} className="clean-input" /></td>
                        <td>{new Date(editingUser.created_at).toLocaleDateString()}</td>
                        <td>
                          <select value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })} className="clean-select">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>{tokens.map(t => `${t.ticker}: ${getUserBalanceForToken(user.id, t.mint)}`).join(', ')}</td>
                        <td>
                          <button onClick={handleSaveUser} className="clean-button">Save</button>
                          <button onClick={() => setEditingUser(null)} className="clean-button">Cancel</button>
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
                          <button onClick={() => handleEditUser(user)} className="clean-button">Edit</button>
                          <button onClick={() => handleDeleteUser(user.id)} className="clean-button delete">Delete</button>
                          <button onClick={() => handleImpersonate(user.id)} className="clean-button">Log in as</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'usersGroups' && (
          <div className="work-section">
            <h2>User Groups</h2>
            <button onClick={handleDeleteMultipleUsers} className="delete-selected">Delete Selected</button>
            <table className="user-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Group ID</th>
                  <th>Name</th>
                  <th>Members</th>
                </tr>
              </thead>
              <tbody>
                {(!userGroups || !Array.isArray(userGroups)) ? (
                  <tr>
                    <td colSpan="4">Loading user groups or an error occurred...</td>
                  </tr>
                ) : userGroups.length === 0 ? (
                  <tr>
                    <td colSpan="4">No user groups found. Create one below.</td>
                  </tr>
                ) : (
                  userGroups.map(group => (
                    <tr key={group.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(group.id)}
                          onChange={() => handleSelectUser(group.id)}
                        />
                      </td>
                      <td>{group.id}</td>
                      <td>{group.name}</td>
                      <td className="truncate-users">
                        {(group.user_ids || []).length === 0 ? (
                          'No members'
                        ) : (
                          <>
                            {(group.user_ids || []).map((userId, index) => {
                              const user = users.find(u => u.id === userId);
                              return (
                                <React.Fragment key={userId}>
                                  {index > 0 && ', '}
                                  {user ? (
                                    <span title={`${user.email} (${user.wallet})`}>
                                      {`${user.email.split('@')[0]}... (${user.wallet.slice(0, 8)}...)`}
                                    </span>
                                  ) : (
                                    `User ${userId} not found`
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="crud-controls">
              <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group Name" className="clean-input" />
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Email</th>
                    <th>Wallet</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={groupUsers.includes(user.id)}
                          onChange={() => setGroupUsers(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id])}
                        />
                      </td>
                      <td>{user.email}</td>
                      <td>{user.wallet}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="button-group">
                <button onClick={handleCreateUserGroup} className="clean-button">Create Group</button>
                <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="clean-select">
                  <option value="">Select Group to Edit/Delete</option>
                  {userGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                {selectedGroup && (
                  <div className="selected-group-details">
                    <h3>Selected Group: {userGroups.find(g => g.id === parseInt(selectedGroup))?.name}</h3>
                    <table className="user-table">
                      <thead>
                        <tr>
                          <th>Select</th>
                          <th>Email</th>
                          <th>Wallet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(userGroups.find(g => g.id === parseInt(selectedGroup))?.user_ids || []).map(userId => {
                          const user = users.find(u => u.id === userId);
                          return user ? (
                            <tr key={user.id}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={groupUsers.includes(user.id)}
                                  onChange={() => setGroupUsers(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id])}
                                />
                              </td>
                              <td>{user.email}</td>
                              <td>{user.wallet}</td>
                            </tr>
                          ) : null;
                        })}
                      </tbody>
                    </table>
                    <div className="button-group">
                      <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="New Group Name" className="clean-input" />
                      <button onClick={handleUpdateUserGroup} className="clean-button">Update Group</button>
                      <button onClick={handleDeleteUserGroup} className="clean-button delete">Delete Group</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'walletAdmin' && (
          <div className="work-section">
            <h2>System Wallet</h2>
            {console.log('Rendering walletAdmin, systemWalletBalance:', systemWalletBalance, 'systemWalletPublicKey:', systemWalletPublicKey, 'adminTokenBalances:', adminTokenBalances)}
            {systemWalletBalance !== null ? (
              <p>SOL Balance: {systemWalletBalance} SOL</p>
            ) : (
              <p>Failed to load SOL balance. Check console for errors.</p>
            )}
            {systemWalletPublicKey ? (
              <p>Public Key: {systemWalletPublicKey}</p>
            ) : (
              <p>Failed to load public key. Check console for errors.</p>
            )}
            <h3>Token Balances</h3>
            {Object.keys(adminTokenBalances).length > 0 ? (
              <ul>
                {Object.entries(adminTokenBalances).map(([mint, balance]) => (
                  <li key={mint}>Token {mint}: {balance} tokens</li>
                ))}
              </ul>
            ) : (
              <p>No token balances available.</p>
            )}
            <h3>Recent Transactions</h3>
            <p>(Placeholder: Add API call for transaction history here)</p>
          </div>
        )}
        {activeTab === 'walletWebsite' && (
          <div className="work-section">
            <h2>Website Wallet</h2>
            <p>Website Wallet Balance: {adminTokenBalances.website || 0} tokens</p>
            <h3>Token Balances</h3>
            <ul>
              {Object.entries(adminTokenBalances).map(([mint, balance]) => (
                <li key={mint}>Token {mint}: {balance} tokens</li>
              ))}
            </ul>
            <h3>Recent Transactions</h3>
            <p>(Placeholder: Add API call for transaction history here)</p>
          </div>
        )}
        {activeTab === 'walletWeb' && (
          <div className="work-section">
            <h2>Web Wallet</h2>
            <p>Web Wallet Balance: {adminTokenBalances.web || 0} tokens</p>
            <h3>Token Balances</h3>
            <ul>
              {Object.entries(adminTokenBalances).map(([mint, balance]) => (
                <li key={mint}>Token {mint}: {balance} tokens</li>
              ))}
            </ul>
            <h3>Recent Transactions</h3>
            <p>(Placeholder: Add API call for transaction history here)</p>
          </div>
        )}
        {activeTab === 'walletAll' && (
          <div className="work-section">
            <h2>All Wallets</h2>
            <p>Total Token Balances: {Object.values(adminTokenBalances).reduce((sum, val) => sum + (val || 0), 0)} tokens</p>
            <h3>Wallet Breakdown</h3>
            <ul>
              <li>System Wallet: {systemWalletBalance !== null ? `${systemWalletBalance} SOL` : 'Loading...'}</li>
              <li>Website Wallet: {adminTokenBalances.website || 0} tokens</li>
              <li>Web Wallet: {adminTokenBalances.web || 0} tokens</li>
            </ul>
            <h3>Recent Transactions</h3>
            <p>(Placeholder: Add API call for aggregate transaction history here)</p>
          </div>
        )}
        {activeTab === 'travelPackageView' && (
          <div className="work-section">
            <h2>View Travel Packages</h2>
            <div className="view-toggle">
              <button
                className={travelPackageViewMode === 'list' ? 'tab active' : 'tab'}
                onClick={() => setTravelPackageViewMode('list')}
              >
                List
              </button>
              <button
                className={travelPackageViewMode === 'tiles' ? 'tab active' : 'tab'}
                onClick={() => setTravelPackageViewMode('tiles')}
              >
                Tiles
              </button>
            </div>
            <button onClick={handleDeleteMultipleTravel} className="delete-selected">Delete Selected</button>
            {console.log('Rendering travelPackageView, travelPackages:', travelPackages)}
            {travelPackages.length === 0 ? (
              <p>No travel packages available. Create some in the Travel Package CRUD panel.</p>
            ) : travelPackageViewMode === 'list' ? (
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
                      <td>{pkg.id}</td>
                      <td>{pkg.name}</td>
                      <td>{pkg.price}</td>
                      <td><img src={pkg.image_url} alt={pkg.name} className="thumbnail" /></td>
                      <td className="truncate">{pkg.image_url}</td>
                      <td>{pkg.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="travel-package-tiles">
                {travelPackages.map(pkg => (
                  <div key={pkg.id} className="travel-package-tile">
                    <input
                      type="checkbox"
                      checked={selectedPackages.includes(pkg.id)}
                      onChange={() => handleSelectPackage(pkg.id)}
                    />
                    <img src={pkg.image_url} alt={pkg.name} className="travel-package-image" />
                    <h3>{pkg.name}</h3>
                    <p>ID: {pkg.id}</p>
                    <p>Price: {pkg.price} tokens</p>
                    <p>{pkg.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'travelPackageCrud' && (
          <div className="work-section">
            <h2>Travel Package CRUD + groups</h2>
            <div className="crud-controls">
              <div className="user-filters">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="clean-select">
                  <option value="created_at">Creation Date</option>
                  <option value="name">Name</option>
                  <option value="id">ID</option>
                </select>
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="clean-select">
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="Start Date" className="clean-input" />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="End Date" className="clean-input" />
                <button onClick={fetchTravelPackages} className="clean-button">Filter</button>
              </div>
              <div className="create-travel-form">
                <input value={travelName} onChange={(e) => setTravelName(e.target.value)} placeholder="Name" className="clean-input" />
                <input value={travelPrice} onChange={(e) => setTravelPrice(e.target.value)} placeholder="Price (Tokens)" type="number" className="clean-input" />
                <input value={travelImage} onChange={(e) => setTravelImage(e.target.value)} placeholder="Image URL" className="clean-input" />
                <input value={travelDesc} onChange={(e) => setTravelDesc(e.target.value)} placeholder="Description" className="clean-input" />
                <button onClick={handleCreateTravel} className="clean-button">Add Travel Package</button>
              </div>
            </div>
            <button onClick={handleDeleteMultipleTravel} className="delete-selected">Delete Selected</button>
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
                        <td><input value={editingTravel.name} onChange={(e) => setEditingTravel({ ...editingTravel, name: e.target.value })} className="clean-input" /></td>
                        <td><input value={editingTravel.price} onChange={(e) => setEditingTravel({ ...editingTravel, price: e.target.value })} type="number" className="clean-input" /></td>
                        <td><img src={editingTravel.image_url} alt="Thumbnail" className="thumbnail" /></td>
                        <td><input value={editingTravel.image_url} onChange={(e) => setEditingTravel({ ...editingTravel, image_url: e.target.value })} className="clean-input" /></td>
                        <td><input value={editingTravel.description} onChange={(e) => setEditingTravel({ ...editingTravel, description: e.target.value })} className="clean-input" /></td>
                        <td>
                          <button onClick={handleUpdateTravel} className="clean-button">Save</button>
                          <button onClick={() => setEditingTravel(null)} className="clean-button">Cancel</button>
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
                          <button onClick={() => setEditingTravel(pkg)} className="clean-button">Edit</button>
                          <button onClick={() => handleDeleteTravel(pkg.id)} className="clean-button delete">Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="user-selection-area">
              <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group Name" className="clean-input" />
              <table className="travel-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Thumbnail</th>
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
                      <td>{pkg.name}</td>
                      <td>{pkg.price}</td>
                      <td><img src={pkg.image_url} alt={pkg.name} className="thumbnail" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="button-group">
                <button onClick={handleCreateTravelPackageGroup} className="clean-button">Create Group</button>
                <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="clean-select">
                  <option value="">Select Group to Edit/Delete</option>
                  {travelPackageGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                {selectedGroup && (
                  <div className="selected-group-details">
                    <h3>Selected Group: {travelPackageGroups.find(g => g.id === parseInt(selectedGroup))?.name || 'No Group Selected'}</h3>
                    <table className="travel-table">
                      <thead>
                        <tr>
                          <th>Select</th>
                          <th>Name</th>
                          <th>Price</th>
                          <th>Thumbnail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(travelPackageGroups.find(g => g.id === parseInt(selectedGroup))?.packageIds || []).map(pkgId => {
                          const pkg = travelPackages.find(p => p.id === pkgId);
                          return pkg ? (
                            <tr key={pkg.id}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedPackages.includes(pkg.id)}
                                  onChange={() => handleSelectPackage(pkg.id)}
                                />
                              </td>
                              <td>{pkg.name}</td>
                              <td>{pkg.price}</td>
                              <td><img src={pkg.image_url} alt={pkg.name} className="thumbnail" /></td>
                            </tr>
                          ) : null;
                        })}
                      </tbody>
                    </table>
                    <div className="button-group">
                      <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="New Group Name" className="clean-input" />
                      <button onClick={handleUpdateTravelPackageGroup} className="clean-button">Update Group</button>
                      <button onClick={handleDeleteTravelPackageGroup} className="clean-button delete">Delete Group</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'travelPackageGroups' && (
          <div className="work-section">
            <h2>Travel Package Groups</h2>
            <button onClick={handleDeleteMultipleTravel} className="delete-selected">Delete Selected</button>
            {console.log('Rendering travelPackageGroups, travelPackageGroups:', travelPackageGroups)}
            {(!travelPackageGroups || !Array.isArray(travelPackageGroups)) ? (
              <p>Loading travel package groups or an error occurred...</p>
            ) : travelPackageGroups.length === 0 ? (
              <p>No travel package groups found. Create one below.</p>
            ) : (
              <table className="travel-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Group ID</th>
                    <th>Name</th>
                    <th>Packages</th>
                  </tr>
                </thead>
                <tbody>
                  {travelPackageGroups.map(group => (
                    <tr key={group.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedPackages.includes(group.id)}
                          onChange={() => handleSelectPackage(group.id)}
                        />
                      </td>
                      <td>{group.id}</td>
                      <td>{group.name}</td>
                      <td className="truncate-packages">
                        {(group.packageIds || []).length === 0 ? (
                          'No packages'
                        ) : (
                          <>
                            {(group.packageIds || []).map((pkgId, index) => {
                              const pkg = travelPackages.find(p => p.id === pkgId || p.id === String(pkgId) || p.id === Number(pkgId));
                              return (
                                <React.Fragment key={pkgId}>
                                  {index > 0 && ', '}
                                  {pkg ? (
                                    <span title={`${pkg.name} (Price: ${pkg.price})`}>
                                      {`${pkg.name.slice(0, 15)}... ($${pkg.price})`}
                                    </span>
                                  ) : (
                                    `Package ${pkgId} not found`
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="crud-controls">
              <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group Name" className="clean-input" />
              <table className="travel-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Thumbnail</th>
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
                      <td>{pkg.name}</td>
                      <td>{pkg.price}</td>
                      <td><img src={pkg.image_url} alt={pkg.name} className="thumbnail" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="button-group">
                <button onClick={handleCreateTravelPackageGroup} className="clean-button">Create Group</button>
                <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="clean-select">
                  <option value="">Select Group to Edit/Delete</option>
                  {(travelPackageGroups || []).map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                {selectedGroup && (
                  <div className="selected-group-details">
                    <h3>Selected Group: {(travelPackageGroups || []).find(g => g.id === parseInt(selectedGroup))?.name || 'No Group Selected'}</h3>
                    <table className="travel-table">
                      <thead>
                        <tr>
                          <th>Select</th>
                          <th>Name</th>
                          <th>Price</th>
                          <th>Thumbnail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(travelPackageGroups.find(g => g.id === parseInt(selectedGroup))?.packageIds || []).map(pkgId => {
                          const pkg = travelPackages.find(p => p.id === pkgId);
                          return pkg ? (
                            <tr key={pkg.id}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedPackages.includes(pkg.id)}
                                  onChange={() => handleSelectPackage(pkg.id)}
                                />
                              </td>
                              <td>{pkg.name}</td>
                              <td>{pkg.price}</td>
                              <td><img src={pkg.image_url} alt={pkg.name} className="thumbnail" /></td>
                            </tr>
                          ) : null;
                        })}
                      </tbody>
                    </table>
                    <div className="button-group">
                      <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="New Group Name" className="clean-input" />
                      <button onClick={handleUpdateTravelPackageGroup} className="clean-button">Update Group</button>
                      <button onClick={handleDeleteTravelPackageGroup} className="clean-button delete">Delete Group</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
      >
        <p>Are you sure you want to delete the selected item(s)? This action cannot be undone.</p>
        <div className="modal-button-group">
          <button
            onClick={() => {
              deleteAction();
              setIsDeleteModalOpen(false);
            }}
            className="clean-button delete"
          >
            Yes, Delete
          </button>
          <button onClick={() => setIsDeleteModalOpen(false)} className="clean-button">
            Cancel
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isSessionExpired}
        onClose={() => {
          setIsSessionExpired(false);
          navigate('/admin-login');
        }}
        title="Session Expired"
      >
        <p>Your session has timed out. Please log in again.</p>
        <div className="modal-button-group">
          <button onClick={() => navigate('/admin-login')} className="clean-button">
            Log In
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedToken}
        onClose={() => setSelectedToken(null)}
        title={selectedToken?.name || 'Token Details'}
      >
        {selectedToken && (
          <div className="token-detail-card">
            <img src={selectedToken.image_url} alt={selectedToken.name} className="token-image" />
            <h3>{selectedToken.name} ({selectedToken.ticker})</h3>
            <p><strong>Supply:</strong> {selectedToken.supply}</p>
            <p><strong>Description:</strong> {selectedToken.description}</p>
            <p><strong>Mint:</strong> {selectedToken.mint}</p>
            <div className="modal-button-group">
              <button onClick={() => setSelectedToken(null)} className="clean-button">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Admin;