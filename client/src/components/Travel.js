import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Travel.css';

const Travel = () => {
  const [packages, setPackages] = useState([]);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/travel');
        setPackages(res.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching travel packages:', error);
        setError(error.response ? error.response.status : 'Network Error');
      }
    };
    fetchPackages();
  }, []);

  const handleSelect = (pkg) => {
    setSelectedPackage(pkg);
  };

  return (
    <div className="travel-container">
      <h2>Travel Packages</h2>
      {error ? (
        <p>Error: {error === 404 ? 'Travel packages endpoint not found (404)' : 'Failed to load packages'}</p>
      ) : packages.length === 0 ? (
        <p>No travel packages available</p>
      ) : (
        <>
          {selectedPackage && (
            <div className="selected-package">
              <div className="package-tile selected">
                <img src={selectedPackage.image_url} alt={selectedPackage.name} className="package-image" />
                <h3>{selectedPackage.name}</h3>
                <p>Price: {selectedPackage.price} Tokens</p>
                <p>{selectedPackage.description}</p>
                <button>Buy</button>
              </div>
            </div>
          )}
          <div className="package-tiles">
            {packages.map(pkg => (
              <div
                key={pkg.id}
                className={`package-tile ${selectedPackage?.id === pkg.id ? 'selected' : ''}`}
                onClick={() => handleSelect(pkg)}
              >
                <img src={pkg.image_url} alt={pkg.name} className="package-image" />
                <h3>{pkg.name}</h3>
                <p>Price: {pkg.price} Tokens</p>
                <p>{pkg.description}</p>
                <button>Buy</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Travel;