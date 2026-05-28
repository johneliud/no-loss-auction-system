import {
  isConnected,
  requestAccess,
  signTransaction,
  getNetworkDetails,
} from '@stellar/freighter-api';
import { NETWORK_PASSPHRASE } from '../config';

export async function freighterInstalled(): Promise<boolean> {
  try {
    const res = await isConnected();
    return res.isConnected;
  } catch {
    return false;
  }
}

export async function assertTestnet(): Promise<void> {
  const details = await getNetworkDetails();
  if (details.error) throw new Error(details.error.message);
  if (details.networkPassphrase !== NETWORK_PASSPHRASE) {
    throw new Error(
      `Freighter is set to ${details.network || 'the wrong network'}. ` +
        'Open Freighter, click the network name at the top, and switch to Testnet.'
    );
  }
}

export async function getWalletAddress(): Promise<string> {
  const res = await requestAccess();
  if (res.error) throw new Error(res.error.message);
  await assertTestnet();
  return res.address;
}

export async function signTx(xdr: string): Promise<string> {
  await assertTestnet();
  const result = await signTransaction(xdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  if (result.error) throw new Error(result.error.message);
  return result.signedTxXdr;
}
