import React from 'react';

const WalletManager = ({
  activeTab,
  tokens,
  adminTokenBalances,
  getAdminBalanceForToken,
}) => {
  const renderWalletContent = () => {
    switch (activeTab) {
      case 'walletAdmin':
        return (
          <div className="work-section">
            <h2>Admin Wallet</h2>
            <p>
              Admin Wallet Token Balances:{' '}
              {Object.values(adminTokenBalances).reduce((sum, val) => sum + (val || 0), 0)} tokens
            </p>
            <h3>Token Balances (Held / Minted)</h3>
            <ul>
              {tokens.map((token) => (
                <li key={token.mint}>
                  {token.name} ({token.ticker}): {getAdminBalanceForToken(token.mint)} /{' '}
                  {token.supply} tokens
                </li>
              ))}
            </ul>
            <h3>Recent Transactions</h3>
            <p>
              (Placeholder: Add API call for transaction history here, e.g., mints, transfers,
              airdrops for admin wallet)
            </p>
          </div>
        );
      case 'walletWebsite':
        return (
          <div className="work-section">
            <h2>Website Wallet</h2>
            <p>
              Website Wallet Balance:{' '}
              {adminTokenBalances.website ||
                Object.values(adminTokenBalances).reduce((sum, val) => sum + (val || 0), 0)}{' '}
              tokens
            </p>
            <h3>Token Balances (Held / Minted)</h3>
            <ul>
              {tokens.map((token) => (
                <li key={token.mint}>
                  {token.name} ({token.ticker}): {getAdminBalanceForToken(token.mint)} /{' '}
                  {token.supply} tokens
                </li>
              ))}
            </ul>
            <h3>Recent Transactions</h3>
            <p>(Placeholder: Add API call for transaction history here)</p>
          </div>
        );
      case 'walletWeb':
        return (
          <div className="work-section">
            <h2>Web Wallet</h2>
            <p>
              Web Wallet Balance:{' '}
              {adminTokenBalances.web ||
                Object.values(adminTokenBalances).reduce((sum, val) => sum + (val || 0), 0)}{' '}
              tokens
            </p>
            <h3>Token Balances (Held / Minted)</h3>
            <ul>
              {tokens.map((token) => (
                <li key={token.mint}>
                  {token.name} ({token.ticker}): {getAdminBalanceForToken(token.mint)} /{' '}
                  {token.supply} tokens
                </li>
              ))}
            </ul>
            <h3>Recent Transactions</h3>
            <p>(Placeholder: Add API call for transaction history here)</p>
          </div>
        );
      case 'walletAll':
        return (
          <div className="work-section">
            <h2>All Wallets</h2>
            <p>
              Total Wallet Balances:{' '}
              {Object.values(adminTokenBalances).reduce((sum, val) => sum + (val || 0), 0)} tokens
            </p>
            <h3>Wallet Breakdown</h3>
            <ul>
              <li>
                Admin Wallet:{' '}
                {Object.values(adminTokenBalances).reduce((sum, val) => sum + (val || 0), 0)}{' '}
                tokens
              </li>
              <li>Website Wallet: {adminTokenBalances.website || 0} tokens</li>
              <li>Web Wallet: {adminTokenBalances.web || 0} tokens</li>
            </ul>
            <h3>Token Balances Across All Wallets (Held / Minted)</h3>
            <ul>
              {tokens.map((token) => (
                <li key={token.mint}>
                  {token.name} ({token.ticker}): {getAdminBalanceForToken(token.mint)} /{' '}
                  {token.supply} tokens
                </li>
              ))}
            </ul>
            <h3>Recent Transactions</h3>
            <p>(Placeholder: Add API call for aggregate transaction history here)</p>
          </div>
        );
      default:
        return null;
    }
  };

  return renderWalletContent();
};

export default WalletManager;