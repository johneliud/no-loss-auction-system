import { useState } from 'react';
import { finalize, cancelAuction } from '../lib/soroban';
import type { AuctionState, AuctionPhase } from '../types';

interface Props {
  auction: AuctionState;
  phase: AuctionPhase;
  walletAddress: string;
  onSuccess: () => void;
}

type ActionStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function AuctionActions({
  auction,
  phase,
  walletAddress,
  onSuccess,
}: Props) {
  const [finalizeStatus, setFinalizeStatus] = useState<ActionStatus>('idle');
  const [cancelStatus, setCancelStatus] = useState<ActionStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const isSeller =
    walletAddress.toLowerCase() === auction.seller.toLowerCase();
  const hasBids = auction.highest_bidder !== null;

  async function handleFinalize() {
    setFinalizeStatus('submitting');
    setErrorMsg('');
    try {
      await finalize(walletAddress);
      setFinalizeStatus('success');
      setTimeout(() => {
        setFinalizeStatus('idle');
        onSuccess();
      }, 1500);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Transaction failed');
      setFinalizeStatus('error');
    }
  }

  async function handleCancel() {
    if (!isSeller) return;
    setCancelStatus('submitting');
    setErrorMsg('');
    try {
      await cancelAuction(walletAddress);
      setCancelStatus('success');
      setTimeout(() => {
        setCancelStatus('idle');
        onSuccess();
      }, 1500);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Transaction failed');
      setCancelStatus('error');
    }
  }

  // Nothing to show if auction is already resolved or no actions are relevant
  if (phase === 'finalized' || phase === 'cancelled' || phase === 'loading') {
    return null;
  }
}
