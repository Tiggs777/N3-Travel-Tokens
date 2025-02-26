import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import axios from 'axios';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import './Wallet.css';

const Wallet = () => {
  const { publicKey, connected } = useWallet();
  const [onsiteWallet, setOnsiteWallet] = useState(null);
  const [onsiteBalance, setOnsiteBalance] = useState(0);
  const [webBalance, setWebBalance] = useState(0);
  const [tokenBalances, setTokenBalances] = useState([]);
  const [systemWalletPubKey, setSystemWalletPubKey] = useState(null);
  const [systemBalance, setSystemBalance] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);
  const [privateKey, setPrivateKey] = useState(null);

  const connection = new Connection('https://api.devnet.solana.com');
  const token = localStorage.getItem('token');
  const isAdmin = token ? JSON.parse(atob(token.split('.')[1])).role === 'admin' : false;

  useEffect(() => {
    if (isAdmin) {
      const fetchSystemWallet = async () => {
        try {
          const pubKeyRes = await axios.get('http://localhost:3000/api/system/wallet/publickey', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setSystemWalletPubKey(pubKeyRes.data.publicKey);

          const balanceRes = await axios.get('http://localhost:3000/api/system/wallet/balance', {
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

  useEffect(() => {
    if (!token) return; // Only fetch if logged in

    const fetchWallet = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/wallet', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOnsiteWallet(res.data.wallet);

        const walletPubkey = new PublicKey(res.data.wallet);
        const balance = await connection.getBalance(walletPubkey);
        setOnsiteBalance(balance / 1e9);

        const tokensRes = await axios.get('http://localhost:3000/api/user/tokens', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const tokens = tokensRes.data;

        const balances = await Promise.all(
          tokens.map(async (token) => {
            const mintPubkey = new PublicKey(token.mint);
            const ataAddress = await getAssociatedTokenAddress(mintPubkey, walletPubkey);
            try {
              const ataAccount = await getAccount(connection, ataAddress);
              const balance = Number(ataAccount.amount) / Math.pow(10, 9);
              return { mint: token.mint, name: token.name, ticker: token.ticker, balance };
            } catch (error) {
              console.log(`No ATA found for mint ${token.mint}:`, error.message);
              return { mint: token.mint, name: token.name, ticker: token.ticker, balance: 0 };
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
      }
    };
    fetchWallet();
  }, [token, isAdmin]);

  useEffect(() => {
    if (connected && publicKey) {
      const fetchWebBalance = async () => {
        const balance = await connection.getBalance(publicKey);
        setWebBalance(balance / 1e9);
      };
      fetchWebBalance();
    }
  }, [connected, publicKey]);

  const mergeWithWebWallet = async () => {
    if (!publicKey) return alert('Please connect a web wallet');
    if (!onsiteWallet) return alert('No onsite wallet available');
    alert('Merging wallets (logic TBD): Web: ' + publicKey.toBase58() + ', Onsite: ' + onsiteWallet);
  };

  const fetchPrivateKey = async () => {
    if (!onsiteWallet) return alert('No onsite wallet available');
    try {
      const res = await axios.get('http://localhost:3000/api/wallet/private', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPrivateKey(res.data.privateKey);
      setShowPrivateKeyModal(true);
    } catch (error) {
      alert('Error fetching private key: ' + error.message);
    }
  };

  return (
    <div className="wallet-container">
      <h2>Wallet Management</h2>
      <div className="wallet-tiles">
        <div className="wallet-tile">
          <h3>Web Wallet</h3>
          <WalletMultiButton />
          {publicKey ? (
            <>
              <p><strong>Address:</strong> <button onClick={() => setShowAddressModal(true)}>View Address</button></p>
              <p><strong>Balance:</strong> {webBalance} SOL</p>
              <p><strong>Tokens:</strong> TBD</p>
            </>
          ) : (
            <p>Not connected</p>
          )}
        </div>
        <div className="wallet-tile">
          <h3>Onsite Wallet</h3>
          {onsiteWallet ? (
            <>
              <p><strong>Address:</strong> <button onClick={() => setShowAddressModal(true)}>View Address</button></p>
              {isAdmin && <p><strong>Balance:</strong> {onsiteBalance} SOL</p>}
              {tokenBalances.length > 0 ? (
                tokenBalances.map((token, index) => (
                  <p key={index}>
                    <strong>{token.name} ({token.ticker}):</strong> {token.balance} tokens
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
        {isAdmin && systemWalletPubKey && (
          <div className="wallet-tile">
            <h3>System Wallet</h3>
            <p><strong>Address:</strong> <button onClick={() => setShowAddressModal(true)}>View Address</button></p>
            {systemBalance !== null ? (
              <p><strong>Balance:</strong> {systemBalance} SOL</p>
            ) : (
              <p>Fetching balance...</p>
            )}
          </div>
        )}
      </div>

      {showAddressModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Wallet Address</h3>
            <p>{publicKey ? publicKey.toBase58() : onsiteWallet || systemWalletPubKey}</p>
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