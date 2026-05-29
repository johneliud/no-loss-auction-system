import { useState } from 'react';
import { freighterInstalled, getWalletAddress } from '../lib/freighter';
import { CONTRACT_ID } from '../config';

interface Props {
  onConnected: (address: string) => void;
}

type ConnectStatus = 'idle' | 'connecting' | 'error';

const STEPS = [
  {
    number: '01',
    title: 'Seller creates the auction',
    body: 'The seller deploys an auction with a chosen token, minimum bid amount, and deadline. The contract is immutable once initialized.',
  },
  {
    number: '02',
    title: 'Bidders compete, no one loses',
    body: 'Each new highest bid locks tokens in the contract. The previous highest bidder is refunded instantly and automatically in the same transaction.',
  },
  {
    number: '03',
    title: 'Auction settles on-chain',
    body: "After the deadline, anyone can trigger finalization. The winning bid transfers to the seller. All other participants' funds were already returned.",
  },
];

const PROPERTIES = [
  {
    label: 'Non-custodial',
    detail: 'Funds are held by the contract, never by a third party.',
  },
  {
    label: 'Instant refunds',
    detail: 'Outbid? Your XLM returns in the same block.',
  },
  {
    label: 'Open settlement',
    detail: 'Anyone can finalize once the deadline passes.',
  },
  {
    label: 'Cancel-safe',
    detail: 'Sellers can cancel only before any bids are placed.',
  },
];

export default function LandingPage({ onConnected }: Props) {
  const [status, setStatus] = useState<ConnectStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function connect() {
    setStatus('connecting');
    setErrorMsg('');
    try {
      const installed = await freighterInstalled();
      if (!installed) {
        throw new Error(
          'Freighter not detected. Install the browser extension and refresh.'
        );
      }
      const address = await getWalletAddress();
      onConnected(address);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Connection failed');
      setStatus('error');
    }
  }

  const contractShort = `${CONTRACT_ID.slice(0, 6)}...${CONTRACT_ID.slice(-6)}`;

  return (
    <div className="min-h-screen bg-sui-black text-sui-white">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-sui-off-black sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight">No-Loss Auction</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-xs font-mono text-white/30">
              Stellar Testnet
            </span>
            <button
              onClick={connect}
              disabled={status === 'connecting'}
              className="btn-primary text-xs px-4 py-2"
            >
              {status === 'connecting' ? (
                <>
                  <span className="w-3 h-3 border-2 border-sui-black border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Wallet'
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-screen-2xl mx-auto px-6 pt-24 pb-20">
        <p className="text-xs font-mono tracking-[0.25em] text-white/40 uppercase mb-6">
          Built on Soroban - Stellar Testnet
        </p>
        <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-none mb-6 max-w-2xl">
          Bid without
          <br />
          the risk.
        </h1>
        <p className="text-base text-white/60 max-w-lg leading-relaxed mb-10">
          A no-loss auction protocol on Stellar. Place bids knowing that if you are
          outbid, your XLM is returned to your wallet automatically in the same
          transaction, with no manual claim required.
        </p>

        <div className="flex flex-col sm:flex-row items-start gap-4">
          <button
            onClick={connect}
            disabled={status === 'connecting'}
            className="btn-primary px-8 py-3 text-sm"
          >
            {status === 'connecting' ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-sui-black border-t-transparent rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Wallet to Enter'
            )}
          </button>
          <a
            href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary px-8 py-3 text-sm"
          >
            View Contract
          </a>
        </div>

        {status === 'error' && (
          <p className="mt-4 text-xs text-sui-red leading-relaxed max-w-sm">{errorMsg}</p>
        )}

        <p className="mt-5 text-xs text-white/25">
          Make sure Freighter is installed and set to{' '}
          <span className="text-white/50">Testnet</span>.
        </p>
      </section>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* How it works */}
      <section className="max-w-screen-2xl mx-auto px-6 py-20">
        <p className="text-xs font-mono tracking-[0.25em] text-white/40 uppercase mb-10">
          How it works
        </p>
        <div className="grid sm:grid-cols-3 gap-px bg-white/10">
          {STEPS.map((step) => (
            <div key={step.number} className="bg-sui-black p-8">
              <span className="block text-3xl font-semibold font-mono text-sui-gold mb-4">
                {step.number}
              </span>
              <h3 className="text-sm font-semibold text-sui-white mb-2">{step.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Properties */}
      <section className="max-w-screen-2xl mx-auto px-6 py-20">
        <p className="text-xs font-mono tracking-[0.25em] text-white/40 uppercase mb-10">
          Protocol properties
        </p>
        <div className="grid sm:grid-cols-2 gap-px bg-white/10">
          {PROPERTIES.map((p) => (
            <div key={p.label} className="bg-sui-black p-8">
              <h4 className="text-sm font-semibold text-sui-white mb-1.5">{p.label}</h4>
              <p className="text-xs text-white/50 leading-relaxed">{p.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Contract details strip */}
      <section className="max-w-screen-2xl mx-auto px-6 py-12">
        <p className="text-xs font-mono tracking-[0.25em] text-white/40 uppercase mb-6">
          Deployed contract
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div>
            <p className="text-xs text-white/40 mb-1">Contract ID</p>
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-sui-white hover:text-sui-gold transition-colors"
            >
              {contractShort}
            </a>
          </div>
          <div className="hidden sm:block w-px h-8 bg-white/10" />
          <div>
            <p className="text-xs text-white/40 mb-1">Network</p>
            <p className="font-mono text-sm text-sui-white">Stellar Testnet</p>
          </div>
          <div className="hidden sm:block w-px h-8 bg-white/10" />
          <div>
            <p className="text-xs text-white/40 mb-1">Token</p>
            <p className="font-mono text-sm text-sui-white">Native XLM</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-sui-off-black">
        <div className="max-w-screen-2xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-sui-gold inline-block" />
            <span className="text-xs text-white/40">No-Loss Auction Protocol</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/30 hover:text-sui-gold transition-colors"
            >
              Stellar Expert
            </a>
            <a
              href="https://soroban.stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/30 hover:text-sui-gold transition-colors"
            >
              Soroban Docs
            </a>
            <a
              href="https://www.freighter.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/30 hover:text-sui-gold transition-colors"
            >
              Get Freighter
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
