import { Networks } from '@stellar/stellar-sdk';

export const CONTRACT_ID = 'CBUBJIIAYFI62MZ6Y272IPEWBDHPLXAAG6YX7SJREA7XLZZLTZ4KKZJF';
export const NATIVE_TOKEN = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const RPC_URL = 'https://soroban-testnet.stellar.org';

// Funded testnet account used as the source for read-only simulations.
export const SIMULATION_SOURCE = 'GB3B2MHRV5KZXSGJ6RG2IJMI4T4J4S5WIQAM2RIUQ57QZNP4B745EDM5';

export const STROOP = 10_000_000n;

export function xlmToStroops(xlm: string): bigint {
  const [whole, frac = ''] = xlm.split('.');
  const fracPadded = frac.slice(0, 7).padEnd(7, '0');
  return BigInt(whole) * STROOP + BigInt(fracPadded);
}

export function stroopsToXlm(stroops: bigint): string {
  const whole = stroops / STROOP;
  const frac = stroops % STROOP;
  if (frac === 0n) return whole.toString();
  return `${whole}.${frac.toString().padStart(7, '0').replace(/0+$/, '')}`;
}
