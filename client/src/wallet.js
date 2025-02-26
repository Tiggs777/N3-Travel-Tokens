import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

const network = WalletAdapterNetwork.Devnet;

export const WalletProviderWrapper = ({ children }) => (
  <WalletProvider wallets={[]} autoConnect>
    <WalletModalProvider>
      {children}
    </WalletModalProvider>
  </WalletProvider>
);