import { useState, useCallback } from 'react';
import WalletConnect from './components/WalletConnect';
import AuctionInfo from './components/AuctionInfo';
import PlaceBid from './components/PlaceBid';
import CreateAuction from './components/CreateAuction';
import AuctionActions from './components/AuctionActions';
import { getAuction, hasAuction } from './lib/soroban';
import { auctionPhase } from './types';
import type { AuctionState, AuctionPhase } from './types';

type AppState = 'no_wallet' | 'loading' | 'no_auction' | 'has_auction';

export default function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [auction, setAuction] = useState<AuctionState | null>(null);
  const [appState, setAppState] = useState<AppState>('no_wallet');
  const [loadError, setLoadError] = useState('');

  const loadAuction = useCallback(async (address: string) => {
    setAppState('loading');
    setLoadError('');
    try {
      const exists = await hasAuction(address);
      if (!exists) {
        setAuction(null);
        setAppState('no_auction');
        return;
      }
      const data = await getAuction(address);
      if (!data) {
        setAuction(null);
        setAppState('no_auction');
        return;
      }
      setAuction(data);
      setAppState('has_auction');
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load auction');
      setAppState('no_wallet');
    }
  }, []);

  function onWalletConnected(address: string) {
    setWalletAddress(address);
    loadAuction(address);
  }

  function onAuctionChange() {
    if (walletAddress) loadAuction(walletAddress);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const phase: AuctionPhase = appState === 'has_auction'
    ? auctionPhase(auction, nowSec)
    : 'loading';

  if (appState === 'no_wallet' || !walletAddress) {
    return (
      <>
        <WalletConnect onConnected={onWalletConnected} />
        {loadError && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs px-4 py-2 max-w-sm text-center">
            {loadError}
          </div>
        )}
      </>
    );
  }

  if (appState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-3">
          <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Loading auction state...</p>
        </div>
      </div>
    );
  }

  if (appState === 'no_auction') {
    return <CreateAuction walletAddress={walletAddress} onSuccess={onAuctionChange} />;
  }
