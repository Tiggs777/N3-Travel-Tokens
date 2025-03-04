import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useLocation } from 'react-router-dom';
import './Admin.css';
import Modal from './Modal';
import TravelPackages from './admin/TravelPackages';
import WalletManager from './admin/WalletManager';
import TokenManagement from './admin/TokenManagement';
import UserManagement from './admin/UserManagement';
import TravelPackageManagement from './admin/TravelPackageManagement';

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
  const [selectedToken, setSelectedToken] = useState(null);
  const [userViewMode, setUserViewMode] = useState('list');
  const [travelPackageViewMode, setTravelPackageViewMode] = useState('list');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTravelPackage, setSelectedTravelPackage] = useState(null);
  const tokenAuth = localStorage.getItem('token');
  const user = tokenAuth ? jwtDecode(tokenAuth) : null;

  useEffect(() => {
    const deleteButtons = document.querySelectorAll('.clean-button.delete, .delete-selected');
    deleteButtons.forEach((btn) =>
      console.log('Button:', btn.textContent, 'Width:', btn.offsetWidth)
    );
  }, [activeTab]);

  useEffect(() => {
    console.log('travelPackageGroups state updated:', travelPackageGroups);
  }, [travelPackageGroups]);

  useEffect(() => {
    console.log('userGroups state updated:', userGroups);
  }, [userGroups]);

  useEffect(() => {
    if (selectedGroup) {
      const group = userGroups.find((g) => g.id === parseInt(selectedGroup));
      if (group && group.user_ids) {
        setSelectedUsers([...group.user_ids]);
      } else {
        setSelectedUsers([]);
      }
    } else {
      setSelectedUsers([]);
    }
  }, [selectedGroup, userGroups]);

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

  const confirmDelete = (action) => {
    setDeleteAction(() => action);
    setIsDeleteModalOpen(true);
  };

  const initializeData = async () => {
    try {
      await Promise.all([
        fetchUsers(),
        fetchTravelPackages(),
        fetchTokens(),
        fetchUserTokenBalances(),
        fetchUserGroups(),
        fetchTravelPackageGroups().catch((error) => {
          console.error(
            'Failed to fetch travel package groups:',
            error.response?.status,
            error.response?.data || error.message
          );
          setTravelPackageGroups([]);
        }),
      ]);
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  };

  const fetchUsers = async () => {
    const params = new URLSearchParams({ sort: sortBy, order: sortOrder, startDate, endDate }).toString();
    const res = await axios.get(process.env.REACT_APP_API_URL + '/api/admin/users/info?' + params, {
      headers: { Authorization: `Bearer ${tokenAuth}` },
    });
    setUsers(res.data || []);
  };

  const fetchTravelPackages = async () => {
    const res = await axios.get(process.env.REACT_APP_API_URL + '/api/travel', {
      headers: { Authorization: `Bearer ${tokenAuth}` },
    });
    console.log('Fetched travel packages:', res.data);
    setTravelPackages(res.data || []);
  };

  const fetchTokens = async () => {
    const res = await axios.get(process.env.REACT_APP_API_URL + '/api/admin/tokens', {
      headers: { Authorization: `Bearer ${tokenAuth}` },
    });
    setTokens(res.data || []);
  };

  const fetchUserTokenBalances = async () => {
    try {
      const res = await axios.get(process.env.REACT_APP_API_URL + '/api/admin/user-token-balances', {
        headers: { Authorization: `Bearer ${tokenAuth}` },
      });
      const decodedUser = jwtDecode(tokenAuth);
      const usersBalances = res.data.users || [];
      let adminBalances = { ...res.data.admin } || {};
      usersBalances.forEach((user) => {
        const userTokens = user.tokens || {};
        Object.keys(userTokens).forEach((mint) => {
          if (adminBalances[mint] !== undefined) {
            adminBalances[mint] = Math.max(0, adminBalances[mint] - (userTokens[mint] || 0));
            if (user.userId === decodedUser.id && adminBalances[mint] > 0) {
              adminBalances[mint] = 0;
            }
          }
        });
      });
      setUserTokenBalances(usersBalances);
      setAdminTokenBalances(adminBalances);
    } catch (error) {
      console.error('Failed to fetch user token balances:', error.response?.data || error.message);
      setUserTokenBalances([]);
      setAdminTokenBalances({});
    }
  };

  const fetchUserGroups = async () => {
    try {
      const res = await axios.get(process.env.REACT_APP_API_URL + '/api/admin/user-groups', {
        headers: { Authorization: `Bearer ${tokenAuth}` },
      });
      const groups = Array.isArray(res.data) ? res.data : [];
      const formattedGroups = groups.map((group) => ({
        id: group.id,
        name: group.name,
        user_ids: group.user_ids || [],
      }));
      setUserGroups(formattedGroups);
    } catch (error) {
      console.error(
        'Failed to fetch user groups:',
        error.response?.status,
        error.response?.data || error.message
      );
      setUserGroups([]);
    }
  };

  const fetchTravelPackageGroups = async () => {
    try {
      const res = await axios.get(process.env.REACT_APP_API_URL + '/api/travel-package-groups', {
        headers: { Authorization: `Bearer ${tokenAuth}` },
      });
      const groups = Array.isArray(res.data)
        ? res.data.map((group) => ({
            id: group.id,
            name: group.name,
            packageIds: group.packageids || [],
          }))
        : [];
      setTravelPackageGroups(groups);
      return groups;
    } catch (error) {
      console.error(
        'Error fetching travel package groups:',
        error.response?.status,
        error.response?.data || error.message
      );
      setTravelPackageGroups([]);
      throw error;
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
    setActiveTab(newTab);
    navigate('/admin', { state: { activeMenu: newTab } });
  };

  const handleCreateToken = async () => {
    if (!tokenName || !tokenSupply || !tokenImage || !tokenDesc || !tokenTicker)
      return alert('Please fill in all token fields');
    try {
      const res = await axios.post(
        process.env.REACT_APP_API_URL + '/api/admin/token',
        {
          name: tokenName,
          supply: parseInt(tokenSupply),
          image_url: tokenImage,
          description: tokenDesc,
          ticker: tokenTicker,
        },
        { headers: { Authorization: `Bearer ${tokenAuth}` } }
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
      const res = await axios.post(
        process.env.REACT_APP_API_URL + '/api/admin/token/mint',
        {
          mint: mintTokenId,
          amount: parseInt(mintAmount),
        },
        { headers: { Authorization: `Bearer ${tokenAuth}` } }
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
    if (!mintTokenId || !mintAmount)
      return alert('Please select a token and specify an amount');
    if (!selectedUsers.length)
      return alert('Please select at least one user to airdrop to');
    try {
      const res = await axios.post(
        process.env.REACT_APP_API_URL + '/api/admin/airdrop',
        {
          userIds: selectedUsers,
          amount: parseInt(mintAmount),
          mint: mintTokenId,
        },
        { headers: { Authorization: `Bearer ${tokenAuth}` } }
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
    if (!mintTokenId || !mintAmount)
      return alert('Please select a token and specify an amount');
    if (!selectedUsers.length)
      return alert('Please select at least one user to transfer to');
    try {
      const res = await axios.post(
        process.env.REACT_APP_API_URL + '/api/admin/transfer',
        {
          userIds: selectedUsers,
          amount: parseInt(mintAmount),
          mint: mintTokenId,
        },
        { headers: { Authorization: `Bearer ${tokenAuth}` } }
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
      await axios.post(
        process.env.REACT_APP_API_URL + '/api/admin/token/update',
        {
          mint: editingToken.mint,
          name: editingToken.name,
          supply: parseInt(editingToken.supply),
          image_url: editingToken.image_url,
          description: editingToken.description,
          ticker: editingToken.ticker,
        },
        { headers: { Authorization: `Bearer ${tokenAuth}` } }
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
        await axios.delete(process.env.REACT_APP_API_URL + '/api/admin/tokens/' + mint, {
          headers: { Authorization: `Bearer ${tokenAuth}` },
        });
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
        await axios.post(
          process.env.REACT_APP_API_URL + '/api/admin/tokens/delete',
          { mints: selectedTokens },
          { headers: { Authorization: `Bearer ${tokenAuth}` } }
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
      const res = await axios.post(
        process.env.REACT_APP_API_URL + '/api/admin/travel',
        {
          name: travelName,
          price: parseInt(travelPrice),
          image_url: travelImage,
          description: travelDesc,
        },
        { headers: { Authorization: `Bearer ${tokenAuth}` } }
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
      const res = await axios.post(
        process.env.REACT_APP_API_URL + '/api/admin/travel/update',
        {
          id: editingTravel.id,
          name: editingTravel.name,
          price: parseInt(editingTravel.price),
          image_url: editingTravel.image_url,
          description: editingTravel.description,
        },
        { headers: { Authorization: `Bearer ${tokenAuth}` } }
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
        await axios.post(
          process.env.REACT_APP_API_URL + '/api/admin/travel/delete',
          { ids: [id] },
          { headers: { Authorization: `Bearer ${tokenAuth}` } }
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
    if (selectedPackages.length === 0)
      return alert('Please select at least one travel package to delete');
    confirmDelete(async () => {
      try {
        await axios.post(
          process.env.REACT_APP_API_URL + '/api/admin/travel/delete',
          { ids: selectedPackages },
          { headers: { Authorization: `Bearer ${tokenAuth}` } }
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
    setSelectedPackages((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
    setHasUnsavedChanges(true);
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
    setHasUnsavedChanges(true);
  };

  const handleSelectToken = (mint) => {
    setSelectedTokens((prev) =>
      prev.includes(mint) ? prev.filter((m) => m !== mint) : [...prev, mint]
    );
    setHasUnsavedChanges(true);
  };

  const handleCreateUserGroup = async () => {
    if (!groupName) return alert('Please enter a group name');
    try {
      const res = await axios.post(
        process.env.REACT_APP_API_URL + '/api/admin/user-groups/create',
        {
          name: groupName,
          userIds: groupUsers,
        },
        { headers: { Authorization: `Bearer ${tokenAuth}` } }
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
      const res = await axios.post(
        process.env.REACT_APP_API_URL + '/api/admin/user-groups/update',
        {
          groupId: selectedGroup,
          name:
            groupName || userGroups.find((g) => g.id === parseInt(selectedGroup))?.name,
          userIds: groupUsers,
        },
        { headers: { Authorization: `Bearer ${tokenAuth}` } }
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
        await axios.post(
          process.env.REACT_APP_API_URL + '/api/admin/user-groups/delete',
          { groupId: selectedGroup },
          { headers: { Authorization: `Bearer ${tokenAuth}` } }
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
        await axios.post(
          process.env.REACT_APP_API_URL + '/api/admin/users/delete',
          { userIds: selectedUsers },
          { headers: { Authorization: `Bearer ${tokenAuth}` } }
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
      const res = await axios.post(
        process.env.REACT_APP_API_URL + '/api/travel-package-groups/create',
        {
          name: groupName,
          packageIds: selectedPackages,
        },
        { headers: { Authorization: `Bearer ${tokenAuth}` } }
      );
      alert(res.data.message);
      setGroupName('');
      setSelectedPackages([]);
      setHasUnsavedChanges(false);
      await fetchTravelPackageGroups();
    } catch (error) {
      console.error(
        'Failed to create travel package group:',
        error.response?.status,
        error.response?.data || error.message
      );
      alert('Failed to create travel package group: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateTravelPackageGroup = async () => {
    if (!selectedGroup) return alert('Please select a group to update');
    try {
      const res = await axios.post(
        process.env.REACT_APP_API_URL + '/api/travel-package-groups/update',
        {
          groupId: selectedGroup,
          name:
            groupName ||
            travelPackageGroups.find((g) => g.id === parseInt(selectedGroup))?.name,
          packageIds: selectedPackages,
        },
        { headers: { Authorization: `Bearer ${tokenAuth}` } }
      );
      alert(res.data.message);
      setGroupName('');
      setSelectedPackages([]);
      setSelectedGroup('');
      setHasUnsavedChanges(false);
      await fetchTravelPackageGroups();
    } catch (error) {
      console.error(
        'Failed to update travel package group:',
        error.response?.status,
        error.response?.data || error.message
      );
      alert('Failed to update travel package group: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteTravelPackageGroup = async () => {
    if (!selectedGroup) return alert('Please select a group to delete');
    confirmDelete(async () => {
      try {
        const res = await axios.post(
          process.env.REACT_APP_API_URL + '/api/travel-package-groups/delete',
          { groupId: selectedGroup },
          { headers: { Authorization: `Bearer ${tokenAuth}` } }
        );
        alert('Travel package group deleted!');
        setSelectedGroup('');
        setHasUnsavedChanges(false);
        await fetchTravelPackageGroups();
      } catch (error) {
        console.error(
          'Failed to delete travel package group:',
          error.response?.status,
          error.response?.data || error.message
        );
        alert('Failed to delete travel package group: ' + (error.response?.data?.error || error.message));
      }
    });
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) return alert('Please fill in email and password');
    try {
      const res = await axios.post(
        process.env.REACT_APP_API_URL + '/api/admin/users/create',
        {
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        },
        { headers: { Authorization: `Bearer ${tokenAuth}` } }
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
      await axios.post(
        process.env.REACT_APP_API_URL + '/api/admin/users/update',
        {
          userId: editingUser.id,
          email: editingUser.email,
          wallet: editingUser.wallet,
          privateKey: editingUser.private_key,
          role: editingUser.role,
        },
        { headers: { Authorization: `Bearer ${tokenAuth}` } }
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
        await axios.post(
          process.env.REACT_APP_API_URL + '/api/admin/users/delete',
          { userIds: [userId] },
          { headers: { Authorization: `Bearer ${tokenAuth}` } }
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
      const res = await axios.post(
        process.env.REACT_APP_API_URL + '/api/admin/impersonate',
        { userId },
        { headers: { Authorization: `Bearer ${tokenAuth}` } }
      );
      localStorage.setItem('token', res.data.token);
      navigate('/wallet');
    } catch (error) {
      alert('Failed to impersonate user: ' + (error.response?.data?.error || error.message));
    }
  };

  const getUserBalanceForToken = (userId, mint) => {
    const userBalance = userTokenBalances.find((b) => b.userId === userId);
    const balance = userBalance && userBalance.tokens ? userBalance.tokens[mint] || 0 : 0;
    if (!userBalance || !userBalance.tokens || !userBalance.tokens[mint]) {
      console.log(
        `No balance found for user ${userId}, mint ${mint}. Available users:`,
        userTokenBalances.map((u) => u.userId)
      );
      console.log('User Balance Object:', userBalance);
    }
    return balance;
  };

  const getAdminBalanceForToken = (mint) => {
    return adminTokenBalances[mint] || 0;
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">{`${activeTab
          .charAt(0)
          .toUpperCase()}${activeTab
          .slice(1)
          .replace('Crud', ' CRUD')
          .replace('Package', ' Package')
          .replace('Groups', ' Groups')} Dashboard`}</h1>
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
              Admin Wallet
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
        {activeTab === 'travelPackageView' && (
          <TravelPackages
            travelPackages={travelPackages}
            selectedPackages={selectedPackages}
            travelPackageViewMode={travelPackageViewMode}
            setTravelPackageViewMode={setTravelPackageViewMode}
            handleSelectPackage={handleSelectPackage}
            handleDeleteMultipleTravel={handleDeleteMultipleTravel}
            setSelectedTravelPackage={setSelectedTravelPackage}
          />
        )}
        {activeTab.startsWith('wallet') && (
          <WalletManager
            activeTab={activeTab}
            tokens={tokens}
            adminTokenBalances={adminTokenBalances}
            getAdminBalanceForToken={getAdminBalanceForToken}
          />
        )}
        {activeTab.startsWith('tokens') && (
          <TokenManagement
            activeTab={activeTab}
            tokens={tokens}
            mintTokenId={mintTokenId}
            setMintTokenId={setMintTokenId}
            mintAmount={mintAmount}
            setMintAmount={setMintAmount}
            tokenName={tokenName}
            setTokenName={setTokenName}
            tokenSupply={tokenSupply}
            setTokenSupply={setTokenSupply}
            tokenImage={tokenImage}
            setTokenImage={setTokenImage}
            tokenDesc={tokenDesc}
            setTokenDesc={setTokenDesc}
            tokenTicker={tokenTicker}
            setTokenTicker={setTokenTicker}
            selectedUsers={selectedUsers}
            handleSelectUser={handleSelectUser}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            userGroups={userGroups}
            users={users}
            editingToken={editingToken}
            setEditingToken={setEditingToken}
            selectedTokens={selectedTokens}
            handleSelectToken={handleSelectToken}
            tokenViewMode={tokenViewMode}
            setTokenViewMode={setTokenViewMode}
            setSelectedToken={setSelectedToken}
            handleMintToken={handleMintToken}
            handleAirdropTokens={handleAirdropTokens}
            handleTransferTokens={handleTransferTokens}
            handleCreateToken={handleCreateToken}
            handleSaveToken={handleSaveToken}
            handleDeleteToken={handleDeleteToken}
            handleDeleteMultipleTokens={handleDeleteMultipleTokens}
            getUserBalanceForToken={getUserBalanceForToken}
            getAdminBalanceForToken={getAdminBalanceForToken}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            fetchTokens={fetchTokens}
          />
        )}
        {activeTab.startsWith('users') && (
          <UserManagement
            activeTab={activeTab}
            users={users}
            selectedUsers={selectedUsers}
            handleSelectUser={handleSelectUser}
            userViewMode={userViewMode}
            setUserViewMode={setUserViewMode}
            setSelectedUser={setSelectedUser}
            newUserEmail={newUserEmail}
            setNewUserEmail={setNewUserEmail}
            newUserPassword={newUserPassword}
            setNewUserPassword={setNewUserPassword}
            newUserRole={newUserRole}
            setNewUserRole={setNewUserRole}
            editingUser={editingUser}
            setEditingUser={setEditingUser}
            groupName={groupName}
            setGroupName={setGroupName}
            groupUsers={groupUsers}
            setGroupUsers={setGroupUsers}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            userGroups={userGroups}
            handleCreateUser={handleCreateUser}
            handleSaveUser={handleSaveUser}
            handleDeleteUser={handleDeleteUser}
            handleDeleteMultipleUsers={handleDeleteMultipleUsers}
            handleCreateUserGroup={handleCreateUserGroup}
            handleUpdateUserGroup={handleUpdateUserGroup}
            handleDeleteUserGroup={handleDeleteUserGroup}
            handleImpersonate={handleImpersonate}
            getUserBalanceForToken={getUserBalanceForToken}
            tokens={tokens}
            fetchUsers={fetchUsers}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
          />
        )}
        {(activeTab === 'travelPackageCrud' || activeTab === 'travelPackageGroups') && (
          <TravelPackageManagement
            activeTab={activeTab}
            travelPackages={travelPackages}
            selectedPackages={selectedPackages}
            handleSelectPackage={handleSelectPackage}
            travelName={travelName}
            setTravelName={setTravelName}
            travelPrice={travelPrice}
            setTravelPrice={setTravelPrice}
            travelImage={travelImage}
            setTravelImage={setTravelImage}
            travelDesc={travelDesc}
            setTravelDesc={setTravelDesc}
            editingTravel={editingTravel}
            setEditingTravel={setEditingTravel}
            groupName={groupName}
            setGroupName={setGroupName}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            travelPackageGroups={travelPackageGroups}
            handleCreateTravel={handleCreateTravel}
            handleUpdateTravel={handleUpdateTravel}
            handleDeleteTravel={handleDeleteTravel}
            handleDeleteMultipleTravel={handleDeleteMultipleTravel}
            handleCreateTravelPackageGroup={handleCreateTravelPackageGroup}
            handleUpdateTravelPackageGroup={handleUpdateTravelPackageGroup}
            handleDeleteTravelPackageGroup={handleDeleteTravelPackageGroup}
            fetchTravelPackages={fetchTravelPackages}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
          />
        )}
      </div>

      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.email || 'User Details'}
      >
        {selectedUser && (
          <div className="user-detail-card">
            <button className="modal-close-button" onClick={() => setSelectedUser(null)}>
              ✕
            </button>
            <h3>{selectedUser.email}</h3>
            <p>
              <strong>ID:</strong> {selectedUser.id}
            </p>
            <p>
              <strong>Wallet:</strong> {selectedUser.wallet || 'N/A'}
            </p>
            <p>
              <strong>Created:</strong> {new Date(selectedUser.created_at).toLocaleDateString()}
            </p>
            <p>
              <strong>Role:</strong> {selectedUser.role}
            </p>
            <p>
              <strong>Token Balances (Held / Minted):</strong>{' '}
              {tokens
                .map(
                  (t) =>
                    `${t.ticker}: ${getUserBalanceForToken(selectedUser.id, t.mint)} / ${t.supply}`
                )
                .join(', ') || 'None'}
            </p>
            <div className="modal-button-group">
              <button onClick={() => setSelectedUser(null)} className="clean-button">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={!!selectedTravelPackage}
        onClose={() => setSelectedTravelPackage(null)}
        title={selectedTravelPackage?.name || 'Travel Package Details'}
      >
        {selectedTravelPackage && (
          <div className="travel-package-detail-card">
            <img
              src={selectedTravelPackage.image_url}
              alt={selectedTravelPackage.name}
              className="token-image"
            />
            <h3>{selectedTravelPackage.name}</h3>
            <p>
              <strong>ID:</strong> {selectedTravelPackage.id}
            </p>
            <p>
              <strong>Price:</strong> {selectedTravelPackage.price}
            </p>
            <p>
              <strong>Description:</strong> {selectedTravelPackage.description}
            </p>
            <div className="modal-button-group">
              <button onClick={() => setSelectedTravelPackage(null)} className="clean-button">
                Close
              </button>
            </div>
          </div>
        )}
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
            <img
              src={selectedToken.image_url}
              alt={selectedToken.name}
              className="token-image"
            />
            <h3>
              {selectedToken.name} ({selectedToken.ticker})
            </h3>
            <p>
              <strong>Supply:</strong> {selectedToken.supply}
            </p>
            <p>
              <strong>Description:</strong> {selectedToken.description}
            </p>
            <p>
              <strong>Mint:</strong> {selectedToken.mint}
            </p>
            <div className="modal-button-group">
              <button onClick={() => setSelectedToken(null)} className="clean-button">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
      >
        <p>Are you sure you want to delete the selected item(s)? This action cannot be undone.</p>
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
      </Modal>
    </div>
  );
};

export default Admin;