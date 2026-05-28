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
  const phase: AuctionPhase =
    appState === 'has_auction' ? auctionPhase(auction, nowSec) : 'loading';

  if (appState === 'no_wallet' || !walletAddress) {
    return (
      <>
        <WalletConnect onConnected={onWalletConnected} />
        {loadError && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-sui-red text-sui-white text-xs px-4 py-2 max-w-sm text-center">
            {loadError}
          </div>
        )}
      </>
    );
  }

  if (appState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sui-black">
        <div className="text-center space-y-3">
          <div className="w-5 h-5 border-2 border-sui-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-white/50">Loading auction state...</p>
        </div>
      </div>
    );
  }

  if (appState === 'no_auction') {
    return <CreateAuction walletAddress={walletAddress} onSuccess={onAuctionChange} />;
  }

  return (
    <div className="min-h-screen bg-sui-black">
      {/* Top bar */}
      <header className="bg-sui-off-black border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-sui-gold inline-block" />
              <span className="text-sm font-semibold text-sui-white tracking-tight">
                No-Loss Auction
              </span>
            </div>
            <span className="hidden sm:block text-xs text-white/30 font-mono">
              Stellar Testnet
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sui-teal inline-block" />
              <span className="text-xs font-mono text-white/50">
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </span>
            </div>
            <button
              onClick={() => {
                setWalletAddress(null);
                setAuction(null);
                setAppState('no_wallet');
              }}
              className="text-xs text-white/30 hover:text-white/70 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {auction && (
          <>
            <AuctionInfo
              auction={auction}
              phase={phase}
              walletAddress={walletAddress}
              onRefresh={onAuctionChange}
            />

            {phase === 'active' && (
              <PlaceBid
                auction={auction}
                walletAddress={walletAddress}
                onSuccess={onAuctionChange}
              />
            )}

            <AuctionActions
              auction={auction}
              phase={phase}
              walletAddress={walletAddress}
              onSuccess={onAuctionChange}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-sui-off-black mt-16">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xs text-white/30">
            Contract:{' '}
            <a
              href="https://stellar.expert/explorer/testnet/contract/CBUBJIIAYFI62MZ6Y272IPEWBDHPLXAAG6YX7SJREA7XLZZLTZ4KKZJF"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-white/50 hover:text-sui-gold transition-colors"
            >
              CBUB...KZJF
            </a>
          </span>
          <a
            href="https://stellar.expert/explorer/testnet"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/30 hover:text-sui-gold transition-colors"
          >
            Stellar Expert
          </a>
        </div>
      </footer>
    </div>
  );
}
