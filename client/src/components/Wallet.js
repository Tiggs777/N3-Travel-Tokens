import React, { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import axios from 'axios';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import Modal from './Modal';
import './Wallet.css';

// WebWalletTile Component
const WebWalletTile = ({ publicKey, webBalance, viewAddress }) => (
  <div className="wallet-tile">
    <h3>Web Wallet</h3>
    <div style={{ marginBottom: '15px' }}>
      <WalletMultiButton />
    </div>
    {publicKey ? (
      <>
        <p><strong>Address:</strong> <button onClick={() => viewAddress(publicKey.toBase58())}>View Address</button></p>
        <p><strong>Balance:</strong> {webBalance} SOL</p>
      </>
    ) : (
      <p>Not connected</p>
    )}
  </div>
);

// OnsiteWalletTile Component
const OnsiteWalletTile = ({ onsiteWallet, onsiteBalance, tokenBalances, fetchPrivateKey, mergeWithWebWallet, viewAddress }) => (
  <div className="wallet-tile">
    <h3>Onsite Wallet</h3>
    {onsiteWallet ? (
      <>
        <p><strong>Address:</strong> <button onClick={() => viewAddress(onsiteWallet)}>View Address</button></p>
        <p><strong>Balance:</strong> {onsiteBalance} SOL</p>
        {tokenBalances.length > 0 ? (
          tokenBalances.map((token, index) => (
            <p key={index}>
              <strong>{token.name} ({token.ticker}):</strong> {token.balance} / {token.supply !== undefined ? token.supply : 'N/A'} tokens (Held / Minted)
            </p>
          ))
        ) : (
          <p>No airdropped tokens</p>
        )}
        <button onClick={fetchPrivateKey}>View Private Key</button>
        <button onClick={mergeWithWebWallet}>Merge with Web Wallet</button>
      </>
    ) : (
      <p>Loading wallet...</p>
    )}
  </div>
);

// SystemWalletTile Component
const SystemWalletTile = ({ systemWalletPubKey, systemBalance, viewAddress }) => (
  <div className="wallet-tile">
    <h3>System Wallet</h3>
    {systemWalletPubKey ? (
      <>
        <p><strong>Address:</strong> <button onClick={() => viewAddress(systemWalletPubKey)}>View Address</button></p>
        <p><strong>Balance:</strong> {systemBalance ?? 'Loading...'} SOL</p>
      </>
    ) : (
      <p>Loading system wallet...</p>
    )}
  </div>
);

// Main Wallet Component
const Wallet = () => {
  const { publicKey, connected } = useWallet();
  const connection = useMemo(() => new Connection('https://api.devnet.solana.com'), []);
  const token = localStorage.getItem('token');
  const isAdmin = token ? JSON.parse(atob(token.split('.')[1])).role === 'admin' : false;

  const [onsiteWallet, setOnsiteWallet] = useState(null);
  const [onsiteBalance, setOnsiteBalance] = useState(0);
  const [webBalance, setWebBalance] = useState(0);
  const [systemWalletPubKey, setSystemWalletPubKey] = useState(null);
  const [systemBalance, setSystemBalance] = useState(null);
  const [tokenBalances, setTokenBalances] = useState([]);
  const [activeWalletTab, setActiveWalletTab] = useState('web');
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);
  const [privateKey, setPrivateKey] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchWallet = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(process.env.REACT_APP_API_URL + '/api/wallet', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOnsiteWallet(res.data.wallet);

        const walletPubkey = new PublicKey(res.data.wallet);
        const balance = await connection.getBalance(walletPubkey);
        setOnsiteBalance(balance / 1e9);

        const tokensRes = await axios.get(process.env.REACT_APP_API_URL + '/api/user/tokens', {
          headers: { Authorization: `Bearer ${token}` },
        });
        let tokens = tokensRes.data;

        // Fetch supply for admins from /api/admin/tokens
        if (isAdmin) {
          const adminTokensRes = await axios.get(process.env.REACT_APP_API_URL + '/api/admin/tokens', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const adminTokens = adminTokensRes.data;
          tokens = tokens.map(token => ({
            ...token,
            supply: adminTokens.find(t => t.mint === token.mint)?.supply || token.supply
          }));
        }

        const balances = await Promise.all(
          tokens.map(async (token) => {
            const mintPubkey = new PublicKey(token.mint);
            const ataAddress = await getAssociatedTokenAddress(mintPubkey, walletPubkey);
            try {
              const ataAccount = await getAccount(connection, ataAddress);
              const balance = Number(ataAccount.amount) / Math.pow(10, 9);
              return { 
                mint: token.mint, 
                name: token.name, 
                ticker: token.ticker, 
                balance, 
                supply: token.supply // Use supply from tokens or adminTokens
              };
            } catch (error) {
              console.log(`No ATA found for mint ${token.mint}:`, error.message);
              return { 
                mint: token.mint, 
                name: token.name, 
                ticker: token.ticker, 
                balance: 0, 
                supply: token.supply // Use supply even if no balance
              };
            }
          })
        );
        setTokenBalances(isAdmin ? balances : balances.filter(token => token.balance > 0));
      } catch (error) {
        console.error('Error fetching wallet or tokens:', error.message);
        if (error.response?.status === 401) {
          alert('Session expired. Please log in again.');
          localStorage.removeItem('token');
          window.location.href = '/';
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchWallet();
  }, [token, isAdmin, connection]);

  useEffect(() => {
    if (connected && publicKey) {
      const fetchWebBalance = async () => {
        try {
          const balance = await connection.getBalance(publicKey);
          setWebBalance(balance / 1e9);
        } catch (error) {
          console.error('Error fetching web wallet balance:', error.message);
          alert('Failed to fetch web wallet balance.');
        }
      };
      fetchWebBalance();
    }
  }, [connected, publicKey, connection]);

  useEffect(() => {
    if (isAdmin && token) {
      const fetchSystemWallet = async () => {
        try {
          const pubKeyRes = await axios.get(process.env.REACT_APP_API_URL + '/api/system/wallet/publickey', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setSystemWalletPubKey(pubKeyRes.data.publicKey);

          const balanceRes = await axios.get(process.env.REACT_APP_API_URL + '/api/system/wallet/balance', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setSystemBalance(balanceRes.data.balance);
        } catch (error) {
          console.error('Error fetching system wallet info:', error.message);
        }
      };
      fetchSystemWallet();
    }
  }, [isAdmin, token]);

  const mergeWithWebWallet = () => {
    if (!publicKey) return alert('Please connect a web wallet');
    if (!onsiteWallet) return alert('No onsite wallet available');
    setIsMergeModalOpen(true);
  };

  const confirmMerge = async () => {
    alert('Merging wallets (logic TBD): Web: ' + publicKey.toBase58() + ', Onsite: ' + onsiteWallet);
    setIsMergeModalOpen(false);
  };

  const fetchPrivateKey = async () => {
    if (!onsiteWallet) return alert('No onsite wallet available');
    if (!isAdmin) return alert('Unauthorized access');
    try {
      const res = await axios.get(process.env.REACT_APP_API_URL + '/api/wallet/private', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPrivateKey(res.data.privateKey);
      setShowPrivateKeyModal(true);
    } catch (error) {
      alert('Error fetching private key: ' + error.message);
    }
  };

  const viewAddress = (address) => {
    setSelectedAddress(address);
    setShowAddressModal(true);
  };

  return (
    <div className="wallet-container">
      <h2>Wallet Management</h2>
      
      <div className="wallet-tabs">
        <button
          className={activeWalletTab === 'web' ? 'tab active' : 'tab'}
          onClick={() => setActiveWalletTab('web')}
        >
          Web Wallet
        </button>
        <button
          className={activeWalletTab === 'onsite' ? 'tab active' : 'tab'}
          onClick={() => setActiveWalletTab('onsite')}
        >
          Onsite Wallet
        </button>
        {isAdmin && (
          <button
            className={activeWalletTab === 'system' ? 'tab active' : 'tab'}
            onClick={() => setActiveWalletTab('system')}
          >
            System Wallet
          </button>
        )}
        <button
          className={activeWalletTab === 'all' ? 'tab active' : 'tab'}
          onClick={() => setActiveWalletTab('all')}
        >
          All Wallets
        </button>
      </div>

      <div className="wallet-tiles">
        {(activeWalletTab === 'web' || activeWalletTab === 'all') && (
          <WebWalletTile publicKey={publicKey} webBalance={webBalance} viewAddress={viewAddress} />
        )}
        {(activeWalletTab === 'onsite' || activeWalletTab === 'all') && (
          <OnsiteWalletTile
            onsiteWallet={onsiteWallet}
            onsiteBalance={onsiteBalance}
            tokenBalances={tokenBalances}
            fetchPrivateKey={fetchPrivateKey}
            mergeWithWebWallet={mergeWithWebWallet}
            viewAddress={viewAddress}
          />
        )}
        {isAdmin && (activeWalletTab === 'system' || activeWalletTab === 'all') && (
          <SystemWalletTile
            systemWalletPubKey={systemWalletPubKey}
            systemBalance={systemBalance}
            viewAddress={viewAddress}
          />
        )}
      </div>

      <Modal isOpen={isMergeModalOpen} onClose={() => setIsMergeModalOpen(false)} title="Merge Wallets">
        <div className="modal-content">
          <p>Are you sure you want to merge your onsite wallet with your web wallet?</p>
          <p><strong>Web Wallet:</strong> {publicKey?.toBase58()}</p>
          <p><strong>Onsite Wallet:</strong> {onsiteWallet}</p>
          <div className="modal-actions">
            <button onClick={confirmMerge}>Confirm Merge</button>
            <button onClick={() => setIsMergeModalOpen(false)}>Cancel</button>
          </div>
        </div>
      </Modal>

      {showAddressModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Wallet Address</h3>
            <p>{selectedAddress}</p>
            <button onClick={() => setShowAddressModal(false)}>Close</button>
          </div>
        </div>
      )}

      {showPrivateKeyModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Private Key</h3>
            <p>{privateKey || 'Fetching...'}</p>
            <p><strong>Warning:</strong> Keep this secure! Do not share publicly.</p>
            <button onClick={() => setShowPrivateKeyModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;