import React from 'react';

const TravelPackages = ({
  travelPackages,
  selectedPackages,
  travelPackageViewMode,
  setTravelPackageViewMode,
  handleSelectPackage,
  handleDeleteMultipleTravel,
  setSelectedTravelPackage,
}) => {
  return (
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
      <button onClick={handleDeleteMultipleTravel} className="delete-selected">
        Delete Selected
      </button>
      {travelPackageViewMode === 'list' ? (
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
            {travelPackages.map((pkg) => (
              <tr
                key={pkg.id}
                onClick={() => setSelectedTravelPackage(pkg)}
                style={{ cursor: 'pointer' }}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedPackages.includes(pkg.id)}
                    onChange={() => handleSelectPackage(pkg.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td>{pkg.id}</td>
                <td>{pkg.name}</td>
                <td>{pkg.price}</td>
                <td>
                  <img src={pkg.image_url} alt={pkg.name} className="thumbnail" />
                </td>
                <td className="truncate">{pkg.image_url}</td>
                <td>{pkg.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="travel-package-tiles">
          {travelPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="travel-package-tile"
              onClick={() => setSelectedTravelPackage(pkg)}
            >
              <input
                type="checkbox"
                checked={selectedPackages.includes(pkg.id)}
                onChange={() => handleSelectPackage(pkg.id)}
                onClick={(e) => e.stopPropagation()}
              />
              <img src={pkg.image_url} alt={pkg.name} className="token-image" />
              <h3>{pkg.name}</h3>
              <p>ID: {pkg.id}</p>
              <p>Price: {pkg.price}</p>
              <p>{pkg.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TravelPackages;