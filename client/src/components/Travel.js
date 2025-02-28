import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useWallet } from '@solana/wallet-adapter-react';
import Modal from './Modal';
import './Travel.css';

const Travel = () => {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { publicKey } = useWallet();

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL+'/api/travel')
      .then(res => setPackages(res.data))
      .catch(err => console.error('Error fetching packages:', err));
  }, []);

  const handleBuy = (pkg) => {
    setSelectedPackage(pkg);
    setIsModalOpen(true);
  };

  const confirmPurchase = async () => {
    if (!publicKey) return alert('Connect your wallet to buy');
    try {
      const res = await axios.post(process.env.REACT_APP_API_URL+'/api/travel/purchase', {
        packageId: selectedPackage.id,
        amount: selectedPackage.price,
        buyer: publicKey.toBase58(),
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      alert('Purchase successful! Tx: ' + res.data.signature);
      setIsModalOpen(false);
    } catch (error) {
      alert('Purchase failed: ' + error.message);
    }
  };

  return (
    <div className="travel-container">
      <div className="hero-section">
        <h1>Explore with N3 Travel Tokens</h1>
      </div>
      <h2>Travel Packages</h2>
      <div className="package-tiles">
        {packages.map(pkg => (
          <div key={pkg.id} className="package-tile">
            <img src={pkg.image_url} alt={pkg.name} className="package-image" />
            <h3>{pkg.name}</h3>
            <p>Price: {pkg.price} Tokens</p>
            <button onClick={() => handleBuy(pkg)}>Buy</button>
          </div>
        ))}
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Confirm Purchase">
        {selectedPackage && (
          <div>
            <p>Buy {selectedPackage.name} for {selectedPackage.price} Tokens?</p>
            <button onClick={confirmPurchase}>Confirm</button>
          </div>
        )}
      </Modal>
    </div>
  );
};
console.log('API URL:', process.env.REACT_APP_API_URL);
export default Travel;