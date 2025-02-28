const express = require('express');
const auth = require('../controllers/auth');
const admin = require('../controllers/admin');
const wallet = require('../controllers/wallet');

const router = express.Router();

router.post('/signup', auth.signup);
router.post('/login', auth.login);
router.post('/admin/login', auth.adminLogin);
router.post('/admin/travel', admin.createTravelPackage);
router.get('/travel', admin.getTravelPackages);
router.post('/admin/travel/update', admin.updateTravelPackage);
router.post('/admin/travel/delete', admin.deleteTravelPackage);
router.post('/admin/token', admin.createToken);
router.get('/admin/tokens', admin.getTokens);
router.delete('/admin/tokens/:mint', admin.deleteToken);
router.post('/admin/token/mint', admin.mintMoreTokens);
router.get('/admin/user-token-balances', admin.getUserTokenBalances);
router.post('/admin/airdrop', admin.airdropTokens);
router.post('/admin/transfer', admin.transferTokens);
router.get('/admin/users', admin.getUsers);
router.post('/admin/users/create', admin.createUser);
router.post('/admin/users/update', admin.updateUserInfo);
router.post('/admin/users/delete', admin.deleteUser);
router.post('/admin/impersonate', admin.impersonateUser);
router.get('/wallet', wallet.getWallet);
router.get('/user/tokens', admin.getUserTokens);
router.get('/system/wallet/balance', admin.getSystemWalletBalance);
router.get('/system/wallet/publickey', admin.getSystemWalletPublicKey);
router.get('/wallet/private', wallet.getPrivateKey);
router.get('/admin/users/info', admin.getAllUsersInfo);
router.post('/admin/user-groups/create', admin.createUserGroup);
router.get('/admin/user-groups', admin.getUserGroups);
router.post('/admin/user-groups/update', admin.updateUserGroup);
router.post('/admin/user-groups/delete', admin.deleteUserGroup);
router.get('/travel-package-groups', admin.getTravelPackageGroups);
router.post('/travel-package-groups/create', admin.createTravelPackageGroup);
router.post('/travel-package-groups/update', admin.updateTravelPackageGroup);
router.post('/travel-package-groups/delete', admin.deleteTravelPackageGroup);
router.post('/travel-package-groups/delete-multiple', admin.deleteMultipleTravelPackageGroups); // New route

module.exports = router;