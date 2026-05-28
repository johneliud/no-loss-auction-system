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

  return (
    <div className="card">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Place a Bid</h3>
      <p className="text-xs text-gray-500 mb-5">
        If you are outbid, your XLM is returned to your wallet automatically.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="field-label" htmlFor="bid-amount">
            Amount (XLM)
          </label>
          <div className="relative">
            <input
              id="bid-amount"
              type="number"
              min="0"
              step="0.0000001"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (status === 'error') setStatus('idle');
              }}
              placeholder={`Min ${floorDisplay} XLM`}
              className="field-input pr-12"
              disabled={status === 'submitting' || status === 'success'}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono pointer-events-none">
              XLM
            </span>
          </div>
          {currentDisplay && (
            <p className="mt-1.5 text-xs text-gray-400">
              Current highest: {currentDisplay} XLM, your bid must exceed this.
            </p>
          )}
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={!amount || status === 'submitting' || status === 'success'}
        >
          {status === 'submitting' ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : status === 'success' ? (
            'Bid Placed'
          ) : (
            'Place Bid'
          )}
        </button>

        {status === 'error' && (
          <p className="text-xs text-red-600 leading-relaxed">{errorMsg}</p>
        )}

        {status === 'success' && (
          <p className="text-xs text-gray-500">
            Bid confirmed. Refreshing auction state...
          </p>
        )}
      </form>
    </div>
  );
}
