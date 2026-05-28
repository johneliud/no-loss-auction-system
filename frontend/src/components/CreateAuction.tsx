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
      if (!minBid || parseFloat(minBid) <= 0)
        throw new Error('Minimum bid must be positive');
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
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === 'object' && e !== null && 'message' in e
            ? String((e as { message: unknown }).message)
            : typeof e === 'string'
              ? e
              : 'Transaction failed';
      setErrorMsg(msg);
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sui-black px-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-sui-gold inline-block" />
            <p className="text-xs font-mono tracking-[0.25em] text-white/40 uppercase">
              No auction found
            </p>
          </div>
          <h2 className="text-2xl font-semibold text-sui-white">Create Auction</h2>
          <p className="mt-1 text-sm text-white/50">
            Set up a new no-loss auction on this contract.
          </p>
        </div>

        <div className="border border-white/10 bg-sui-off-black p-6">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="field-label" htmlFor="token">
                Token Contract Address
              </label>
              <input
                id="token"
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                className="field-input"
                placeholder="C..."
                disabled={status === 'submitting' || status === 'success'}
              />
              <p className="mt-1 text-xs text-white/30">
                Pre-filled with the native XLM token on testnet.
              </p>
            </div>

            <div>
              <label className="field-label" htmlFor="min-bid">
                Minimum Bid (XLM)
              </label>
              <div className="relative">
                <input
                  id="min-bid"
                  type="number"
                  min="0.0000001"
                  step="0.0000001"
                  value={minBid}
                  onChange={(e) => setMinBid(e.target.value)}
                  className="field-input pr-12"
                  disabled={status === 'submitting' || status === 'success'}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30 font-mono pointer-events-none">
                  XLM
                </span>
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="duration">
                Duration (Days)
              </label>
              <input
                id="duration"
                type="number"
                min="1"
                step="1"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="field-input"
                disabled={status === 'submitting' || status === 'success'}
              />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={status === 'submitting' || status === 'success'}
              >
                {status === 'submitting' ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-sui-black border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : status === 'success' ? (
                  'Auction Created'
                ) : (
                  'Create Auction'
                )}
              </button>
            </div>

            {status === 'error' && (
              <p className="text-xs text-sui-red leading-relaxed">{errorMsg}</p>
            )}
            {status === 'success' && (
              <p className="text-xs text-sui-teal">
                Auction created. Loading auction state...
              </p>
            )}
          </form>
        </div>

        <p className="mt-4 text-xs text-white/30">
          Connected as{' '}
          <span className="font-mono text-white/50">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}
          </span>
        </p>
      </div>
    </div>
  );
}
