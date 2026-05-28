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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      {/* Wordmark */}
      <div className="mb-12 text-center">
        <p className="text-xs font-medium tracking-[0.3em] text-gray-400 uppercase mb-3">
          Stellar Testnet
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          No-Loss Auction
        </h1>
        <p className="mt-2 text-sm text-gray-500 max-w-xs">
          Bid with XLM. If outbid, your tokens are returned instantly.
        </p>
      </div>

      {/* Connect card */}
      <div className="w-full max-w-sm border border-gray-200 p-8">
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Connect your{' '}
          <a
            href="https://www.freighter.app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 text-gray-900 hover:text-gray-600"
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
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect Wallet'
          )}
        </button>

        {status === 'error' && (
          <p className="mt-4 text-xs text-red-600 leading-relaxed">{errorMsg}</p>
        )}
      </div>

      {/* Footer note */}
      <p className="mt-8 text-xs text-gray-400">
        Make sure Freighter is set to{' '}
        <span className="font-medium text-gray-600">Testnet</span> before connecting.
      </p>
    </div>
  );
}
