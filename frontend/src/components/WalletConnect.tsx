import { useState } from 'react';
import { freighterInstalled, getWalletAddress } from '../lib/freighter';

interface Props {
  onConnected: (address: string) => void;
}

export default function WalletConnect({ onConnected }: Props) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function connect() {
    setStatus('connecting');
    setErrorMsg('');
    try {
      const installed = await freighterInstalled();
      if (!installed) {
        throw new Error(
          'Freighter wallet not detected. Install the Freighter browser extension and refresh.'
        );
      }
      const address = await getWalletAddress();
      onConnected(address);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Connection failed');
      setStatus('error');
    }
  }
}
