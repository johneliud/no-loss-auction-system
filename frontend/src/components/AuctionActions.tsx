import { useState } from 'react';
import { finalize, cancelAuction } from '../lib/soroban';
import type { AuctionState, AuctionPhase } from '../types';

function extractMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e !== null && 'message' in e) return String((e as {message: unknown}).message);
  if (typeof e === 'string') return e;
  return 'Transaction failed';
}

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
      setErrorMsg(extractMsg(e));
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
      setErrorMsg(extractMsg(e));
      setCancelStatus('error');
    }
  }

  // Nothing to show if auction is already resolved or no actions are relevant
  if (phase === 'finalized' || phase === 'cancelled' || phase === 'loading') {
    return null;
  }

  return (
    <div className="card space-y-3">
      <h3 className="text-base font-semibold text-gray-900">Actions</h3>

      {/* Finalize - available to anyone once deadline has passed */}
      {phase === 'ended' && (
        <div>
          <p className="text-xs text-gray-500 mb-3">
            The auction deadline has passed. Finalize to send the winning bid to
            the seller.
          </p>
          <button
            onClick={handleFinalize}
            className="btn-primary w-full"
            disabled={
              finalizeStatus === 'submitting' || finalizeStatus === 'success'
            }
          >
            {finalizeStatus === 'submitting' ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Finalizing...
              </>
            ) : finalizeStatus === 'success' ? (
              'Finalized'
            ) : (
              'Finalize Auction'
            )}
          </button>
        </div>
      )}

      {/* Cancel - seller only, no bids, auction still active */}
      {phase === 'active' && isSeller && !hasBids && (
        <div>
          <p className="text-xs text-gray-500 mb-3">
            No bids have been placed. You can cancel this auction.
          </p>
          <button
            onClick={handleCancel}
            className="btn-danger w-full"
            disabled={
              cancelStatus === 'submitting' || cancelStatus === 'success'
            }
          >
            {cancelStatus === 'submitting' ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                Cancelling...
              </>
            ) : cancelStatus === 'success' ? (
              'Cancelled'
            ) : (
              'Cancel Auction'
            )}
          </button>
        </div>
      )}

      {/* Seller with bids - can't cancel */}
      {phase === 'active' && isSeller && hasBids && (
        <p className="text-xs text-gray-400 italic">
          Bids have been placed, this auction cannot be cancelled.
        </p>
      )}

      {(finalizeStatus === 'error' || cancelStatus === 'error') && (
        <p className="text-xs text-red-600 leading-relaxed pt-1">{errorMsg}</p>
      )}
    </div>
  );
}
