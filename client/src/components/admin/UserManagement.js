import React from 'react';

const UserManagement = ({
  activeTab,
  users,
  selectedUsers,
  handleSelectUser,
  userViewMode,
  setUserViewMode,
  setSelectedUser,
  newUserEmail,
  setNewUserEmail,
  newUserPassword,
  setNewUserPassword,
  newUserRole,
  setNewUserRole,
  editingUser,
  setEditingUser,
  groupName,
  setGroupName,
  groupUsers,
  setGroupUsers,
  selectedGroup,
  setSelectedGroup,
  userGroups,
  handleCreateUser,
  handleSaveUser,
  handleDeleteUser,
  handleDeleteMultipleUsers,
  handleCreateUserGroup,
  handleUpdateUserGroup,
  handleDeleteUserGroup,
  handleImpersonate,
  getUserBalanceForToken,
  tokens,
  fetchUsers,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) => {
  const renderUserContent = () => {
    switch (activeTab) {
      case 'usersView':
        return (
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
            <button onClick={handleDeleteMultipleUsers} className="delete-selected">
              Delete Selected
            </button>
            {userViewMode === 'list' ? (
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Wallet</th>
                    <th>Role</th>
                    <th>Token Balances (Held / Minted)</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td>{user.id}</td>
                      <td>{user.email}</td>
                      <td>{user.wallet}</td>
                      <td>{user.role}</td>
                      <td>
                        {tokens
                          .map(
                            (t) =>
                              `${t.ticker}: ${getUserBalanceForToken(user.id, t.mint)} / ${
                                t.supply
                              }`
                          )
                          .join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="user-tiles">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="user-tile"
                    onClick={() => setSelectedUser(user)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <h3>{user.email}</h3>
                    <p>ID: {user.id}</p>
                    <p>Wallet: {user.wallet || 'N/A'}</p>
                    <p>Role: {user.role}</p>
                    <p>
                      Tokens:{' '}
                      {tokens
                        .map(
                          (t) =>
                            `${t.ticker}: ${getUserBalanceForToken(user.id, t.mint)} / ${
                              t.supply
                            }`
                        )
                        .join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'usersCrud':
        return (
          <div className="work-section">
            <h2>User CRUD + groups</h2>
            <div className="crud-controls">
              <div className="user-filters">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="clean-select"
                >
                  <option value="created_at">Creation Date</option>
                  <option value="email">Email</option>
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
                <button onClick={fetchUsers} className="clean-button">
                  Filter
                </button>
              </div>
              <div className="create-user-form">
                <input
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="Email"
                  className="clean-input"
                />
                <input
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Password"
                  type="password"
                  className="clean-input"
                />
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="clean-select"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={handleCreateUser} className="clean-button">
                  Add User
                </button>
              </div>
            </div>
            <button onClick={handleDeleteMultipleUsers} className="delete-selected">
              Delete Selected
            </button>
            <table className="user-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Wallet</th>
                  <th>Private Key</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                      />
                    </td>
                    {editingUser && editingUser.id === user.id ? (
                      <>
                        <td>{user.id}</td>
                        <td>
                          <input
                            value={editingUser.email}
                            onChange={(e) =>
                              setEditingUser({ ...editingUser, email: e.target.value })
                            }
                            className="clean-input"
                          />
                        </td>
                        <td>
                          <input
                            value={editingUser.wallet}
                            onChange={(e) =>
                              setEditingUser({ ...editingUser, wallet: e.target.value })
                            }
                            className="clean-input"
                          />
                        </td>
                        <td>
                          <input
                            value={editingUser.private_key}
                            onChange={(e) =>
                              setEditingUser({ ...editingUser, private_key: e.target.value })
                            }
                            className="clean-input"
                          />
                        </td>
                        <td>
                          <select
                            value={editingUser.role}
                            onChange={(e) =>
                              setEditingUser({ ...editingUser, role: e.target.value })
                            }
                            className="clean-select"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>
                          <button onClick={handleSaveUser} className="clean-button">
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="clean-button"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{user.id}</td>
                        <td>{user.email}</td>
                        <td>{user.wallet}</td>
                        <td>{user.private_key ? '(hidden)' : 'N/A'}</td>
                        <td>{user.role}</td>
                        <td>
                          <button
                            onClick={() => setEditingUser({ ...user })}
                            className="clean-button"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="clean-button delete"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handleImpersonate(user.id)}
                            className="clean-button"
                          >
                            Impersonate
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'usersGroups':
        return (
          <div className="work-section">
            <h2>User Groups</h2>
            <table className="user-table">
              <thead>
                <tr>
                  <th>Group ID</th>
                  <th>Name</th>
                  <th>Users</th>
                </tr>
              </thead>
              <tbody>
                {userGroups.map((group) => (
                  <tr key={group.id}>
                    <td>{group.id}</td>
                    <td>{group.name}</td>
                    <td className="truncate-users">
                      {(group.user_ids || []).map((userId, index) => {
                        const user = users.find((u) => u.id === userId);
                        return (
                          <React.Fragment key={userId}>
                            {index > 0 && ', '}
                            {user ? (
                              <span title={user.email}>{user.email.slice(0, 15)}...</span>
                            ) : (
                              `User ${userId} not found`
                            )}
                          </React.Fragment>
                        );
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="crud-controls">
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group Name"
                className="clean-input"
              />
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Email</th>
                    <th>Wallet</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={groupUsers.includes(user.id)}
                          onChange={() =>
                            setGroupUsers((prev) =>
                              prev.includes(user.id)
                                ? prev.filter((id) => id !== user.id)
                                : [...prev, user.id]
                            )
                          }
                        />
                      </td>
                      <td>{user.email}</td>
                      <td>{user.wallet}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="button-group">
                <button onClick={handleCreateUserGroup} className="clean-button">
                  Create Group
                </button>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="clean-select"
                >
                  <option value="">Select Group to Edit/Delete</option>
                  {userGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                {selectedGroup && (
                  <div className="selected-group-details">
                    <h3>
                      Selected Group:{' '}
                      {userGroups.find((g) => g.id === parseInt(selectedGroup))?.name}
                    </h3>
                    <table className="user-table">
                      <thead>
                        <tr>
                          <th>Select</th>
                          <th>Email</th>
                          <th>Wallet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(
                          userGroups.find((g) => g.id === parseInt(selectedGroup))?.user_ids || []
                        ).map((userId) => {
                          const user = users.find((u) => u.id === userId);
                          return user ? (
                            <tr key={user.id}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={groupUsers.includes(user.id)}
                                  onChange={() =>
                                    setGroupUsers((prev) =>
                                      prev.includes(user.id)
                                        ? prev.filter((id) => id !== user.id)
                                        : [...prev, user.id]
                                    )
                                  }
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
                      <input
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="New Group Name"
                        className="clean-input"
                      />
                      <button onClick={handleUpdateUserGroup} className="clean-button">
                        Update Group
                      </button>
                      <button
                        onClick={handleDeleteUserGroup}
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

  return renderUserContent();
};

export default UserManagement;