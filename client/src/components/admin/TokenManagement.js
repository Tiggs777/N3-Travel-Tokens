import React from 'react';

const TokenManagement = ({
  activeTab,
  tokens,
  mintTokenId,
  setMintTokenId,
  mintAmount,
  setMintAmount,
  tokenName,
  setTokenName,
  tokenSupply,
  setTokenSupply,
  tokenImage,
  setTokenImage,
  tokenDesc,
  setTokenDesc,
  tokenTicker,
  setTokenTicker,
  selectedUsers,
  handleSelectUser,
  selectedGroup,
  setSelectedGroup,
  userGroups,
  users,
  editingToken,
  setEditingToken,
  selectedTokens,
  handleSelectToken,
  tokenViewMode,
  setTokenViewMode,
  setSelectedToken,
  handleMintToken,
  handleAirdropTokens,
  handleTransferTokens,
  handleCreateToken,
  handleSaveToken,
  handleDeleteToken,
  handleDeleteMultipleTokens,
  getUserBalanceForToken,
  getAdminBalanceForToken,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  fetchTokens,
}) => {
  const renderTokenContent = () => {
    switch (activeTab) {
      case 'tokensView':
        return (
          <div className="work-section">
            <h2>View Tokens</h2>
            <div className="view-toggle">
              <button
                className={tokenViewMode === 'list' ? 'tab active' : 'tab'}
                onClick={() => setTokenViewMode('list')}
              >
                List
              </button>
              <button
                className={tokenViewMode === 'tiles' ? 'tab active' : 'tab'}
                onClick={() => setTokenViewMode('tiles')}
              >
                Tiles
              </button>
            </div>
            <button onClick={handleDeleteMultipleTokens} className="delete-selected">
              Delete Selected
            </button>
            {!tokens.length ? (
              <p>Loading tokens...</p>
            ) : tokenViewMode === 'list' ? (
              <table className="token-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Mint</th>
                    <th>Name</th>
                    <th>Ticker</th>
                    <th>Supply</th>
                    <th>Thumbnail</th>
                    <th>Description</th>
                    <th>Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token) => {
                    const remaining =
                      token.supply -
                      (getUserBalanceForToken(token.mint) + getAdminBalanceForToken(token.mint));
                    return (
                      <tr
                        key={token.mint}
                        onClick={() => setSelectedToken(token)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedTokens.includes(token.mint)}
                            onChange={() => handleSelectToken(token.mint)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td>{token.mint}</td>
                        <td>{token.name}</td>
                        <td>{token.ticker}</td>
                        <td>{token.supply}</td>
                        <td>
                          <img src={token.image_url} alt={token.name} className="thumbnail" />
                        </td>
                        <td>{token.description}</td>
                        <td>{isNaN(remaining) ? 'Loading...' : Math.round(remaining)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="token-tiles">
                {tokens.map((token) => {
                  const remaining =
                    token.supply -
                    (getUserBalanceForToken(token.mint) + getAdminBalanceForToken(token.mint));
                  return (
                    <div
                      key={token.mint}
                      className="token-tile"
                      onClick={() => setSelectedToken(token)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTokens.includes(token.mint)}
                        onChange={() => handleSelectToken(token.mint)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <img src={token.image_url} alt={token.name} className="token-image" />
                      <h3>
                        {token.name} ({token.ticker})
                      </h3>
                      <p>Supply: {token.supply}</p>
                      <p>{token.description}</p>
                      <p>Mint: {token.mint}</p>
                      <p>Remaining: {isNaN(remaining) ? 'Loading...' : Math.round(remaining)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      case 'tokensMint':
      
        return (
            
          <div className="work-section">
            <h2>Mint more Tokens</h2>
            <select
              value={mintTokenId}
              onChange={(e) => setMintTokenId(e.target.value)}
              className="clean-select"
            >
              <option value="">Select Token</option>
              {tokens.map((token) => (
                <option key={token.mint} value={token.mint}>
                  {token.name} ({token.ticker}) - Admin Remaining:
                  {getAdminBalanceForToken(token.mint)}
                </option>
              ))}
            </select>
            <input
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              placeholder="Amount"
              type="number"
              className="clean-input"
            />
            <button onClick={handleMintToken} className="clean-button">
              Mint
            </button>
          </div>
        );
      case 'tokensAirdrop':
        return (
          <div className="work-section">
            <h2>Airdrop to Users</h2>
            <div className="user-selection-area">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="clean-select"
              >
                <option value="">All Users</option>
                {userGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Email</th>
                    <th>Wallet</th>
                    <th>Token Balances (Held / Minted)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGroup
                    ? (userGroups.find((g) => g.id === parseInt(selectedGroup))?.user_ids || []).map(
                        (userId) => {
                          const user = users.find((u) => u.id === userId);
                          return user ? (
                            <tr key={user.id}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(user.id)}
                                  onChange={() => handleSelectUser(user.id)}
                                />
                              </td>
                              <td>{user.email}</td>
                              <td>{user.wallet}</td>
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
                          ) : null;
                        }
                      )
                    : users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleSelectUser(user.id)}
                            />
                          </td>
                          <td>{user.email}</td>
                          <td>{user.wallet}</td>
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
            </div>
            <select
              value={mintTokenId}
              onChange={(e) => setMintTokenId(e.target.value)}
              className="clean-select"
            >
              <option value="">Select Token</option>
              {tokens.map((token) => (
                <option key={token.mint} value={token.mint}>
                  {token.name} ({token.ticker})
                </option>
              ))}
            </select>
            <input
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              placeholder="Amount"
              type="number"
              className="clean-input"
            />
            <button onClick={handleAirdropTokens} className="clean-button">
              Airdrop
            </button>
          </div>
        );
      case 'tokensTransfer':
        return (
          <div className="work-section">
            <h2>Transfer to Users</h2>
            <div className="user-selection-area">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="clean-select"
              >
                <option value="">All Users</option>
                {userGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Email</th>
                    <th>Wallet</th>
                    <th>Token Balances (Held / Minted)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGroup
                    ? (userGroups.find((g) => g.id === parseInt(selectedGroup))?.user_ids || []).map(
                        (userId) => {
                          const user = users.find((u) => u.id === userId);
                          return user ? (
                            <tr key={user.id}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(user.id)}
                                  onChange={() => handleSelectUser(user.id)}
                                />
                              </td>
                              <td>{user.email}</td>
                              <td>{user.wallet}</td>
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
                          ) : null;
                        }
                      )
                    : users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleSelectUser(user.id)}
                            />
                          </td>
                          <td>{user.email}</td>
                          <td>{user.wallet}</td>
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
            </div>
            <select
              value={mintTokenId}
              onChange={(e) => setMintTokenId(e.target.value)}
              className="clean-select"
            >
              <option value="">Select Token</option>
              {tokens.map((token) => (
                <option key={token.mint} value={token.mint}>
                  {token.name} ({token.ticker})
                </option>
              ))}
            </select>
            <input
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              placeholder="Amount"
              type="number"
              className="clean-input"
            />
            <button onClick={handleTransferTokens} className="clean-button">
              Transfer
            </button>
          </div>
        );
      case 'tokensCrud':
        return (
          <div className="work-section">
            <h2>Tokens CRUD Panel</h2>
            <div className="crud-controls">
              <div className="user-filters">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="clean-select"
                >
                  <option value="created_at">Creation Date</option>
                  <option value="name">Name</option>
                  <option value="mint">Mint</option>
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
                <button onClick={fetchTokens} className="clean-button">
                  Filter
                </button>
              </div>
              <div className="create-token-form">
                <input
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="Name"
                  className="clean-input"
                />
                <input
                  value={tokenSupply}
                  onChange={(e) => setTokenSupply(e.target.value)}
                  placeholder="Supply"
                  type="number"
                  className="clean-input"
                />
                <input
                  value={tokenImage}
                  onChange={(e) => setTokenImage(e.target.value)}
                  placeholder="Image URL"
                  className="clean-input"
                />
                <input
                  value={tokenDesc}
                  onChange={(e) => setTokenDesc(e.target.value)}
                  placeholder="Description"
                  className="clean-input"
                />
                <input
                  value={tokenTicker}
                  onChange={(e) => setTokenTicker(e.target.value)}
                  placeholder="Ticker"
                  className="clean-input"
                />
                <button onClick={handleCreateToken} className="clean-button">
                  Add Token
                </button>
              </div>
            </div>
            <table className="token-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Mint</th>
                  <th>Name</th>
                  <th>Ticker</th>
                  <th>Supply</th>
                  <th>Thumbnail</th>
                  <th>Description</th>
                  <th>Remaining</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => (
                  <tr key={token.mint}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedTokens.includes(token.mint)}
                        onChange={() => handleSelectToken(token.mint)}
                      />
                    </td>
                    {editingToken && editingToken.mint === token.mint ? (
                      <>
                        <td>{token.mint}</td>
                        <td>
                          <input
                            value={editingToken.name}
                            onChange={(e) =>
                              setEditingToken({ ...editingToken, name: e.target.value })
                            }
                            className="clean-input"
                          />
                        </td>
                        <td>
                          <input
                            value={editingToken.ticker}
                            onChange={(e) =>
                              setEditingToken({ ...editingToken, ticker: e.target.value })
                            }
                            className="clean-input"
                          />
                        </td>
                        <td>
                          <input
                            value={editingToken.supply}
                            onChange={(e) =>
                              setEditingToken({ ...editingToken, supply: e.target.value })
                            }
                            type="number"
                            className="clean-input"
                          />
                        </td>
                        <td>
                          <img
                            src={editingToken.image_url}
                            alt={editingToken.name}
                            className="thumbnail"
                          />
                        </td>
                        <td>
                          <input
                            value={editingToken.description}
                            onChange={(e) =>
                              setEditingToken({ ...editingToken, description: e.target.value })
                            }
                            className="clean-input"
                          />
                        </td>
                        <td>
                          {(() => {
                            const remaining =
                              editingToken.supply -
                              (getUserBalanceForToken(token.mint) +
                                getAdminBalanceForToken(token.mint));
                            return isNaN(remaining) ? 'Loading...' : Math.round(remaining);
                          })()}
                        </td>
                        <td>
                          <button onClick={handleSaveToken} className="clean-button">
                            Save
                          </button>
                          <button
                            onClick={() => setEditingToken(null)}
                            className="clean-button"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{token.mint}</td>
                        <td>{token.name}</td>
                        <td>{token.ticker}</td>
                        <td>{token.supply}</td>
                        <td>
                          <img src={token.image_url} alt={token.name} className="thumbnail" />
                        </td>
                        <td>{token.description}</td>
                        <td>
                          {(() => {
                            const remaining =
                              token.supply -
                              (getUserBalanceForToken(token.mint) +
                                getAdminBalanceForToken(token.mint));
                            return isNaN(remaining) ? 'Loading...' : Math.round(remaining);
                          })()}
                        </td>
                        <td>
                          <button
                            onClick={() => setEditingToken({ ...token })}
                            className="clean-button"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteToken(token.mint)}
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
          </div>
        );
      default:
        return null;
    }
  };

  return renderTokenContent();
};

export default TokenManagement;