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
