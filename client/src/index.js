import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { WalletProviderWrapper } from './wallet';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <WalletProviderWrapper>
    <App />
  </WalletProviderWrapper>
);