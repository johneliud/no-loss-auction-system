import { useState } from 'react';
import { freighterInstalled, getWalletAddress } from '../lib/freighter';

interface Props {
  onConnected: (address: string) => void;
}

export default function WalletConnect({ onConnected }: Props) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function connect() {
    setStatus('connecting');
    setErrorMsg('');
    try {
      const installed = await freighterInstalled();
      if (!installed) {
        throw new Error(
          'Freighter wallet not detected. Install the Freighter browser extension and refresh.'
        );
      }
      const address = await getWalletAddress();
      onConnected(address);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Connection failed');
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sui-black px-4">
      {/* Wordmark */}
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="w-3 h-3 bg-sui-gold inline-block" />
          <span className="text-xs font-mono tracking-[0.25em] text-white/40 uppercase">
            Stellar Testnet
          </span>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-sui-white">
          No-Loss Auction
        </h1>
        <p className="mt-3 text-sm text-white/50 max-w-xs leading-relaxed">
          Bid with XLM. If outbid, your tokens are returned instantly.
        </p>
      </div>

      {/* Connect card */}
      <div className="w-full max-w-sm border border-white/10 bg-sui-off-black p-8">
        <p className="text-sm text-white/60 mb-6 leading-relaxed">
          Connect your{' '}
          <a
            href="https://www.freighter.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sui-gold hover:text-yellow-300 transition-colors"
          >
            Freighter
          </a>{' '}
          wallet to interact with the auction.
        </p>

        <button
          className="btn-primary w-full"
          onClick={connect}
          disabled={status === 'connecting'}
        >
          {status === 'connecting' ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-sui-black border-t-transparent rounded-full animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect Wallet'
          )}
        </button>

        {status === 'error' && (
          <p className="mt-4 text-xs text-sui-red leading-relaxed">{errorMsg}</p>
        )}
      </div>

      {/* Footer note */}
      <p className="mt-8 text-xs text-white/30">
        Make sure Freighter is set to{' '}
        <span className="font-medium text-white/60">Testnet</span> before connecting.
      </p>
    </div>
  );
}
