import { useState } from 'react';
import { placeBid } from '../lib/soroban';
import { xlmToStroops, stroopsToXlm } from '../config';
import type { AuctionState } from '../types';

interface Props {
  auction: AuctionState;
  walletAddress: string;
  onSuccess: () => void;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function PlaceBid({ auction, walletAddress, onSuccess }: Props) {
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const minDisplay = stroopsToXlm(auction.min_bid);
  const currentDisplay =
    auction.highest_bid === 0n ? null : stroopsToXlm(auction.highest_bid);
  const floorDisplay = currentDisplay ?? minDisplay;

  const isSeller =
    walletAddress.toLowerCase() === auction.seller.toLowerCase();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;

    setStatus('submitting');
    setErrorMsg('');

    try {
      const stroops = xlmToStroops(amount);

      if (stroops < auction.min_bid) {
        throw new Error(`Bid must be at least ${minDisplay} XLM`);
      }
      if (auction.highest_bid > 0n && stroops <= auction.highest_bid) {
        throw new Error(`Bid must exceed the current highest bid of ${floorDisplay} XLM`);
      }

      await placeBid(walletAddress, stroops);
      setStatus('success');
      setAmount('');
      setTimeout(() => {
        setStatus('idle');
        onSuccess();
      }, 1500);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Transaction failed');
      setStatus('error');
    }
  }

  if (isSeller) {
    return (
      <div className="card">
        <p className="text-sm text-gray-400 italic">
          You are the seller, you cannot place a bid on your own auction.
        </p>
      </div>
    );
  }
}
