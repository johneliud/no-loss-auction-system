import { useState } from 'react';
import { initialize } from '../lib/soroban';
import { xlmToStroops, NATIVE_TOKEN } from '../config';

interface Props {
  walletAddress: string;
  onSuccess: () => void;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function CreateAuction({ walletAddress, onSuccess }: Props) {
  const [tokenAddress, setTokenAddress] = useState(NATIVE_TOKEN);
  const [minBid, setMinBid] = useState('1');
  const [durationDays, setDurationDays] = useState('7');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      if (!tokenAddress.trim()) throw new Error('Token address is required');
      if (!minBid || parseFloat(minBid) <= 0) throw new Error('Minimum bid must be positive');
      if (!durationDays || parseInt(durationDays) <= 0)
        throw new Error('Duration must be at least 1 day');

      const minBidStroops = xlmToStroops(minBid);
      const durationSecs = BigInt(Math.round(parseFloat(durationDays) * 86400));

      await initialize(walletAddress, tokenAddress.trim(), minBidStroops, durationSecs);
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        onSuccess();
      }, 1500);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Transaction failed');
      setStatus('error');
    }
  }
}
