import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import axios from 'axios';
import { Connection, PublicKey } from '@solana/web3.js';
import Modal from './Modal';
import './Wallet.css';
const Wallet = () => {
  const { publicKey, connected } = useWallet();
  const [onsiteWallet, setOnsiteWallet] = useState(null);
  const [onsiteBalance, setOnsiteBalance] = useState(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const connection = new Connection('https://api.devnet.solana.com');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      axios.get(process.env.REACT_APP_API_URL+'/api/wallet', { headers: { Authorization: `Bearer ${token}` } })
        .then(async res => {
          setOnsiteWallet(res.data.wallet);
          const balance = await connection.getBalance(new PublicKey(res.data.wallet));
          setOnsiteBalance(balance / 1e9);
        })
        .catch(err => console.error('Error fetching wallet:', err));
    }
  }, [token]);

  const mergeWithWebWallet = () => setIsMergeModalOpen(true);

  const confirmMerge = async () => {
    try {
      const res = await axios.post('$process.env.REACT_APP_API_URL/api/wallet/merge', {
        webWallet: publicKey.toBase58(),
        onsiteWallet,
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Wallets merged! Tx: ' + res.data.signature);
      setOnsiteBalance(0);
      setIsMergeModalOpen(false);
    } catch (error) {
      alert('Merge failed: ' + error.message);
    }
  };

  return (
    <div className="wallet-container">
      <h2>Wallet Management</h2>
      <div className="wallet-tiles">
        <div className="wallet-tile">
          <h3>Web Wallet</h3>
          <WalletMultiButton />
          {publicKey && <p><strong>Address:</strong> {publicKey.toBase58().slice(0, 6)}...</p>}
        </div>
        <div className="wallet-tile">
          <h3>Onsite Wallet</h3>
          {onsiteWallet && (
            <>
              <p><strong>Balance:</strong> {onsiteBalance ?? 'Loading...'} SOL</p>
              <button className="merge" onClick={mergeWithWebWallet}>Merge with Web Wallet</button>
            </>
          )}
        </div>
      </div>
      <Modal isOpen={isMergeModalOpen} onClose={() => setIsMergeModalOpen(false)} title="Merge Wallets">
        <p>Merge onsite wallet ({onsiteWallet?.slice(0, 6)}...) with web wallet ({publicKey?.toBase58().slice(0, 6)}...)?</p>
        <button onClick={confirmMerge}>Confirm Merge</button>
      </Modal>
    </div>
  );
};

export default Wallet;