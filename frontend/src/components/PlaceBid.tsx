import { useState, useEffect } from 'react';
import { placeBid, getTokenBalance } from '../lib/soroban';
import { xlmToStroops, stroopsToXlm, NATIVE_TOKEN } from '../config';
import type { AuctionState } from '../types';

interface Props {
  auction: AuctionState;
  walletAddress: string;
  onSuccess: () => void;
}

type Status = 'idle' | 'submitting' | 'success' | 'error' | 'funding' | 'funded';

function extractMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e !== null && 'message' in e)
    return String((e as { message: unknown }).message);
  if (typeof e === 'string') return e;
  return 'Transaction failed';
}

async function friendbotFund(address: string): Promise<void> {
  const res = await fetch(
    `https://friendbot.stellar.org/?addr=${encodeURIComponent(address)}`
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Friendbot returned ${res.status}`);
  }
}

export default function PlaceBid({ auction, walletAddress, onSuccess }: Props) {
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [balance, setBalance] = useState<bigint | null>(null);

  const minDisplay = stroopsToXlm(auction.min_bid);
  const currentDisplay =
    auction.highest_bid === 0n ? null : stroopsToXlm(auction.highest_bid);
  const floorDisplay = currentDisplay ?? minDisplay;
  const isNative = auction.token === NATIVE_TOKEN;
  const isNotFunded = errorMsg.includes('not funded');

  const isSeller =
    walletAddress.toLowerCase() === auction.seller.toLowerCase();

  useEffect(() => {
    if (isSeller) return;
    getTokenBalance(auction.token, walletAddress).then(setBalance);
  }, [auction.token, walletAddress, isSeller]);

  async function handleFund() {
    setStatus('funding');
    setErrorMsg('');
    try {
      await friendbotFund(walletAddress);
      setStatus('funded');
      // Refresh balance after funding
      const newBalance = await getTokenBalance(auction.token, walletAddress);
      setBalance(newBalance);
    } catch (e) {
      setErrorMsg(extractMsg(e));
      setStatus('error');
    }
  }

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
        throw new Error(
          `Bid must exceed the current highest bid of ${floorDisplay} XLM`
        );
      }

      await placeBid(walletAddress, stroops);
      setStatus('success');
      setAmount('');
      // Refresh balance after successful bid
      getTokenBalance(auction.token, walletAddress).then(setBalance);
      setTimeout(() => {
        setStatus('idle');
        onSuccess();
      }, 1500);
    } catch (e) {
      setErrorMsg(extractMsg(e));
      setStatus('error');
    }
  }

  if (isSeller) {
    return (
      <div className="card">
        <p className="text-sm text-white/40 italic">
          You are the seller — you cannot bid on your own auction.
        </p>
      </div>
    );
  }
}