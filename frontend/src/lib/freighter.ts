import {
  isConnected,
  getAddress,
  signTransaction,
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

export async function getWalletAddress(): Promise<string> {
  const res = await getAddress();
  if (res.error) throw new Error(res.error.message);
  return res.address;
}

export async function signTx(xdr: string): Promise<string> {
  const result = await signTransaction(xdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  if (result.error) throw new Error(result.error.message);
  return result.signedTxXdr;
}
