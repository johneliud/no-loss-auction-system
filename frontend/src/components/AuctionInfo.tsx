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
}
