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
}
