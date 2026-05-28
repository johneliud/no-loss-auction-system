export interface AuctionState {
  seller: string;
  token: string;
  min_bid: bigint;
  deadline: bigint;
  highest_bidder: string | null;
  highest_bid: bigint;
  finalized: boolean;
  cancelled: boolean;
}

export type AuctionPhase =
  | 'loading'
  | 'no_auction'
  | 'active'
  | 'ended'
  | 'finalized'
  | 'cancelled';

export function auctionPhase(auction: AuctionState | null, nowSec: number): AuctionPhase {
  if (!auction) return 'no_auction';
  if (auction.cancelled) return 'cancelled';
  if (auction.finalized) return 'finalized';
  if (BigInt(nowSec) >= auction.deadline) return 'ended';
  return 'active';
}
