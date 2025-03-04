import React from 'react';

const TravelPackageManagement = ({
  activeTab,
  travelPackages,
  selectedPackages,
  handleSelectPackage,
  travelName,
  setTravelName,
  travelPrice,
  setTravelPrice,
  travelImage,
  setTravelImage,
  travelDesc,
  setTravelDesc,
  editingTravel,
  setEditingTravel,
  groupName,
  setGroupName,
  selectedGroup,
  setSelectedGroup,
  travelPackageGroups,
  handleCreateTravel,
  handleUpdateTravel,
  handleDeleteTravel,
  handleDeleteMultipleTravel,
  handleCreateTravelPackageGroup,
  handleUpdateTravelPackageGroup,
  handleDeleteTravelPackageGroup,
  fetchTravelPackages,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) => {
  const renderTravelPackageContent = () => {
    switch (activeTab) {
      case 'travelPackageCrud':
        return (
          <div className="work-section">
            <h2>Travel Package CRUD + groups</h2>
            <div className="crud-controls">
              <div className="user-filters">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="clean-select"
                >
                  <option value="created_at">Creation Date</option>
                  <option value="name">Name</option>
                  <option value="id">ID</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="clean-select"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start Date"
                  className="clean-input"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End Date"
                  className="clean-input"
                />
                <button onClick={fetchTravelPackages} className="clean-button">
                  Filter
                </button>
              </div>
              <div className="create-travel-form">
                <input
                  value={travelName}
                  onChange={(e) => setTravelName(e.target.value)}
                  placeholder="Name"
                  className="clean-input"
                />
                <input
                  value={travelPrice}
                  onChange={(e) => setTravelPrice(e.target.value)}
                  placeholder="Price (Tokens)"
                  type="number"
                  className="clean-input"
                />
                <input
                  value={travelImage}
                  onChange={(e) => setTravelImage(e.target.value)}
                  placeholder="Image URL"
                  className="clean-input"
                />
                <input
                  value={travelDesc}
                  onChange={(e) => setTravelDesc(e.target.value)}
                  placeholder="Description"
                  className="clean-input"
                />
                <button onClick={handleCreateTravel} className="clean-button">
                  Add Travel Package
                </button>
              </div>
            </div>
            <button onClick={handleDeleteMultipleTravel} className="delete-selected">
              Delete Selected
            </button>
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
                {travelPackages.map((pkg) => (
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
                        <td>
                          <input
                            value={editingTravel.name}
                            onChange={(e) =>
                              setEditingTravel({ ...editingTravel, name: e.target.value })
                            }
                            className="clean-input"
                          />
                        </td>
                        <td>
                          <input
                            value={editingTravel.price}
                            onChange={(e) =>
                              setEditingTravel({ ...editingTravel, price: e.target.value })
                            }
                            type="number"
                            className="clean-input"
                          />
                        </td>
                        <td>
                          <img
                            src={editingTravel.image_url}
                            alt="Thumbnail"
                            className="thumbnail"
                          />
                        </td>
                        <td>
                          <input
                            value={editingTravel.image_url}
                            onChange={(e) =>
                              setEditingTravel({ ...editingTravel, image_url: e.target.value })
                            }
                            className="clean-input"
                          />
                        </td>
                        <td>
                          <input
                            value={editingTravel.description}
                            onChange={(e) =>
                              setEditingTravel({ ...editingTravel, description: e.target.value })
                            }
                            className="clean-input"
                          />
                        </td>
                        <td>
                          <button onClick={handleUpdateTravel} className="clean-button">
                            Save
                          </button>
                          <button
                            onClick={() => setEditingTravel(null)}
                            className="clean-button"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{pkg.id}</td>
                        <td>{pkg.name}</td>
                        <td>{pkg.price}</td>
                        <td>
                          <img src={pkg.image_url} alt="Thumbnail" className="thumbnail" />
                        </td>
                        <td className="truncate">{pkg.image_url}</td>
                        <td>{pkg.description}</td>
                        <td>
                          <button
                            onClick={() => setEditingTravel(pkg)}
                            className="clean-button"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTravel(pkg.id)}
                            className="clean-button delete"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="user-selection-area">
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group Name"
                className="clean-input"
              />
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
                  {travelPackages.map((pkg) => (
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
                      <td>
                        <img src={pkg.image_url} alt={pkg.name} className="thumbnail" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="button-group">
                <button onClick={handleCreateTravelPackageGroup} className="clean-button">
                  Create Group
                </button>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="clean-select"
                >
                  <option value="">Select Group to Edit/Delete</option>
                  {travelPackageGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                {selectedGroup && (
                  <div className="selected-group-details">
                    <h3>
                      Selected Group:{' '}
                      {travelPackageGroups.find((g) => g.id === parseInt(selectedGroup))?.name ||
                        'No Group Selected'}
                    </h3>
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
                        {(
                          travelPackageGroups.find((g) => g.id === parseInt(selectedGroup))
                            ?.packageIds || []
                        ).map((pkgId) => {
                          const pkg = travelPackages.find((p) => p.id === pkgId);
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
                              <td>
                                <img src={pkg.image_url} alt={pkg.name} className="thumbnail" />
                              </td>
                            </tr>
                          ) : null;
                        })}
                      </tbody>
                    </table>
                    <div className="button-group">
                      <input
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="New Group Name"
                        className="clean-input"
                      />
                      <button onClick={handleUpdateTravelPackageGroup} className="clean-button">
                        Update Group
                      </button>
                      <button
                        onClick={handleDeleteTravelPackageGroup}
                        className="clean-button delete"
                      >
                        Delete Group
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'travelPackageGroups':
        return (
          <div className="work-section">
            <h2>Travel Package Groups</h2>
            <button onClick={handleDeleteMultipleTravel} className="delete-selected">
              Delete Selected
            </button>
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
                {(!travelPackageGroups || !Array.isArray(travelPackageGroups)) ? (
                  <tr>
                    <td colSpan="4">Loading travel package groups or an error occurred...</td>
                  </tr>
                ) : travelPackageGroups.length === 0 ? (
                  <tr>
                    <td colSpan="4">No travel package groups found. Create one below.</td>
                  </tr>
                ) : (
                  travelPackageGroups.map((group) => (
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
                              const pkg = travelPackages.find(
                                (p) =>
                                  p.id === pkgId ||
                                  p.id === String(pkgId) ||
                                  p.id === Number(pkgId)
                              );
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
                  ))
                )}
              </tbody>
            </table>
            <div className="crud-controls">
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group Name"
                className="clean-input"
              />
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
                  {travelPackages.map((pkg) => (
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
                      <td>
                        <img src={pkg.image_url} alt={pkg.name} className="thumbnail" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="button-group">
                <button onClick={handleCreateTravelPackageGroup} className="clean-button">
                  Create Group
                </button>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="clean-select"
                >
                  <option value="">Select Group to Edit/Delete</option>
                  {(travelPackageGroups || []).map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                {selectedGroup && (
                  <div className="selected-group-details">
                    <h3>
                      Selected Group:{' '}
                      {(travelPackageGroups || []).find((g) => g.id === parseInt(selectedGroup))
                        ?.name || 'No Group Selected'}
                    </h3>
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
                        {(
                          travelPackageGroups.find((g) => g.id === parseInt(selectedGroup))
                            ?.packageIds || []
                        ).map((pkgId) => {
                          const pkg = travelPackages.find((p) => p.id === pkgId);
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
                              <td>
                                <img src={pkg.image_url} alt={pkg.name} className="thumbnail" />
                              </td>
                            </tr>
                          ) : null;
                        })}
                      </tbody>
                    </table>
                    <div className="button-group">
                      <input
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="New Group Name"
                        className="clean-input"
                      />
                      <button onClick={handleUpdateTravelPackageGroup} className="clean-button">
                        Update Group
                      </button>
                      <button
                        onClick={handleDeleteTravelPackageGroup}
                        className="clean-button delete"
                      >
                        Delete Group
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return renderTravelPackageContent();
};

export default TravelPackageManagement;