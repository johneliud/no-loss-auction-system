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

  return <span className="text-sui-gold">{formatted}</span>;
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

function truncate(addr: string | null | undefined) {
  if (!addr) return '—';
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

function safeXlm(stroops: bigint | null | undefined): string {
  if (stroops === null || stroops === undefined) return '—';
  try {
    return stroopsToXlm(BigInt(stroops as bigint));
  } catch {
    return '—';
  }
}

export default function AuctionInfo({ auction, phase, walletAddress, onRefresh }: Props) {
  const isWinner =
    auction.highest_bidder &&
    auction.highest_bidder.toLowerCase() === walletAddress.toLowerCase();

  const deadline = new Date(Number(auction.deadline) * 1000);

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">{phaseBadge(phase)}</div>
          <h2 className="text-lg font-semibold text-sui-white">Auction Details</h2>
          <p className="text-xs font-mono text-white/30 mt-0.5">{truncate(CONTRACT_ID)}</p>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs text-white/40 hover:text-sui-gold transition-colors border border-white/10 hover:border-sui-gold/50 px-3 py-1.5 font-medium"
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
          <span className="stat-value">{safeXlm(auction.min_bid)} XLM</span>
        </div>

        <div className="stat-row">
          <span className="stat-label">Highest Bid</span>
          <span className="stat-value font-semibold text-sui-gold">
            {!auction.highest_bid || auction.highest_bid === 0n
              ? 'No bids yet'
              : `${safeXlm(auction.highest_bid)} XLM`}
          </span>
        </div>

        <div className="stat-row">
          <span className="stat-label">Highest Bidder</span>
          <span className="stat-value">
            {auction.highest_bidder ? (
              <>
                {truncate(auction.highest_bidder)}
                {isWinner && (
                  <span className="ml-2 text-xs font-medium text-sui-teal">(you)</span>
                )}
              </>
            ) : (
              <span className="text-white/25">—</span>
            )}
          </span>
        </div>

        <div className="stat-row">
          <span className="stat-label">{phase === 'active' ? 'Time Left' : 'Deadline'}</span>
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
        <div className="mt-5 border border-sui-teal/30 bg-sui-teal/5 p-4">
          <p className="text-xs font-medium text-sui-teal uppercase tracking-wider mb-1">
            Auction Winner
          </p>
          <p className="text-sm font-mono text-sui-white break-all">
            {auction.highest_bidder}
          </p>
          <p className="text-sm text-white/60 mt-1">
            Winning bid:{' '}
            <span className="font-semibold text-sui-gold">
              {safeXlm(auction.highest_bid)} XLM
            </span>
          </p>
          {isWinner && (
            <p className="mt-2 text-xs font-medium text-sui-teal border-t border-sui-teal/20 pt-2">
              You won this auction.
            </p>
          )}
        </div>
      )}

      {/* Cancelled notice */}
      {phase === 'cancelled' && (
        <div className="mt-5 border border-sui-red/30 bg-sui-red/5 p-4">
          <p className="text-sm text-sui-red/80">
            This auction was cancelled by the seller before any bids were placed.
          </p>
        </div>
      )}
    </div>
  );
}
