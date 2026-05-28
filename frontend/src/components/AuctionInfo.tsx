import { useMemo } from 'react';
import type { AuctionState, AuctionPhase } from '../types';
import { stroopsToXlm, CONTRACT_ID } from '../config';

interface Props {
  auction: AuctionState;
  phase: AuctionPhase;
  walletAddress: string;
  onRefresh: () => void;
}

function Countdown({ deadline }: { deadline: bigint }) {
  const nowSec = Math.floor(Date.now() / 1000);
  const secsLeft = Number(deadline) - nowSec;

  const formatted = useMemo(() => {
    if (secsLeft <= 0) return 'Ended';
    const d = Math.floor(secsLeft / 86400);
    const h = Math.floor((secsLeft % 86400) / 3600);
    const m = Math.floor((secsLeft % 3600) / 60);
    const s = secsLeft % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  }, [secsLeft]);

  return <span>{formatted}</span>;
}

function phaseBadge(phase: AuctionPhase) {
  switch (phase) {
    case 'active':
      return <span className="badge badge-active">Live</span>;
    case 'ended':
      return <span className="badge badge-ended">Ended</span>;
    case 'finalized':
      return <span className="badge badge-done">Finalized</span>;
    case 'cancelled':
      return <span className="badge badge-cancelled">Cancelled</span>;
    default:
      return null;
  }
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

export default function AuctionInfo({
  auction,
  phase,
  walletAddress,
  onRefresh,
}: Props) {
  const isWinner =
    auction.highest_bidder &&
    auction.highest_bidder.toLowerCase() === walletAddress.toLowerCase();

  const deadline = new Date(Number(auction.deadline) * 1000);

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {phaseBadge(phase)}
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Auction Details</h2>
          <p className="text-xs font-mono text-gray-400 mt-0.5">
            {truncate(CONTRACT_ID)}
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs text-gray-400 hover:text-gray-700 transition-colors border border-gray-200 px-2 py-1 font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div>
        <div className="stat-row">
          <span className="stat-label">Seller</span>
          <span className="stat-value">{truncate(auction.seller)}</span>
        </div>

        <div className="stat-row">
          <span className="stat-label">Minimum Bid</span>
          <span className="stat-value">{stroopsToXlm(auction.min_bid)} XLM</span>
        </div>

        <div className="stat-row">
          <span className="stat-label">Highest Bid</span>
          <span className="stat-value font-semibold">
            {auction.highest_bid === 0n
              ? 'No bids yet'
              : `${stroopsToXlm(auction.highest_bid)} XLM`}
          </span>
        </div>

        <div className="stat-row">
          <span className="stat-label">Highest Bidder</span>
          <span className="stat-value">
            {auction.highest_bidder ? (
              <>
                {truncate(auction.highest_bidder)}
                {isWinner && (
                  <span className="ml-2 text-xs font-medium text-gray-500">
                    (you)
                  </span>
                )}
              </>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </span>
        </div>

        <div className="stat-row">
          <span className="stat-label">
            {phase === 'active' ? 'Time Left' : 'Deadline'}
          </span>
          <span className="stat-value">
            {phase === 'active' ? (
              <Countdown deadline={auction.deadline} />
            ) : (
              deadline.toLocaleString()
            )}
          </span>
        </div>
      </div>

      {/* Winner callout (finalized) */}
      {phase === 'finalized' && auction.highest_bidder && (
        <div className="mt-5 border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Auction Winner
          </p>
          <p className="text-sm font-mono text-gray-900 break-all">
            {auction.highest_bidder}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Winning bid:{' '}
            <span className="font-semibold">
              {stroopsToXlm(auction.highest_bid)} XLM
            </span>
          </p>
          {isWinner && (
            <p className="mt-2 text-xs font-medium text-gray-700 border-t border-gray-200 pt-2">
              You won this auction.
            </p>
          )}
        </div>
      )}

      {/* Cancelled notice */}
      {phase === 'cancelled' && (
        <div className="mt-5 border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            This auction was cancelled by the seller before any bids were placed.
          </p>
        </div>
      )}
    </div>
  );
}
