import {
  Contract,
  rpc,
  TransactionBuilder,
  BASE_FEE,
  Address,
  scValToNative,
  nativeToScVal,
  xdr,
} from '@stellar/stellar-sdk';
import {
  CONTRACT_ID,
  NETWORK_PASSPHRASE,
  RPC_URL,
  SIMULATION_SOURCE,
} from '../config';
import { signTx } from './freighter';
import type { AuctionState } from '../types';

const server = new rpc.Server(RPC_URL, { allowHttp: false });
const contract = new Contract(CONTRACT_ID);

async function buildTx(sourceAddress: string, operation: xdr.Operation) {
  const source = await server.getAccount(sourceAddress).catch(() => {
    throw new Error(
      'Your Stellar testnet account is not funded. Visit ' +
        `https://friendbot.stellar.org/?addr=${sourceAddress} to fund it, then try again.`
    );
  });
  return new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();
}

// Read-only simulation.
async function readSimulate(operation: xdr.Operation) {
  const tx = await buildTx(SIMULATION_SOURCE, operation);
  return server.simulateTransaction(tx);
}

// Write simulation: uses the caller's account (required for auth).
async function buildAndSimulate(
  sourceAddress: string,
  operation: xdr.Operation
) {
  const tx = await buildTx(sourceAddress, operation);
  return { tx, simResult: await server.simulateTransaction(tx) };
}

async function submitTx(
  sourceAddress: string,
  operation: xdr.Operation
): Promise<rpc.Api.GetSuccessfulTransactionResponse> {
  const { tx, simResult } = await buildAndSimulate(sourceAddress, operation);

  if (rpc.Api.isSimulationError(simResult)) {
    const msg = (simResult as rpc.Api.SimulateTransactionErrorResponse).error ?? 'Simulation failed';
    throw new Error(msg);
  }

  if (!rpc.Api.isSimulationSuccess(simResult)) {
    throw new Error('Simulation returned an unexpected result');
  }

  const prepared = rpc.assembleTransaction(tx, simResult).build();
  const signedXdr = await signTx(prepared.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  const sendResult = await server.sendTransaction(signedTx);
  if (sendResult.status === 'ERROR') {
    throw new Error('Failed to send transaction to the network');
  }

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const result = await server.getTransaction(sendResult.hash);
    if (result.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      return result as rpc.Api.GetSuccessfulTransactionResponse;
    }
    if (result.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error('Transaction was rejected by the network');
    }
  }
  throw new Error('Transaction confirmation timed out');
}

function parseOptAddress(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw.length > 0 ? (raw[0] as string) : null;
  return null;
}

export async function getAuction(
  _sourceAddress: string
): Promise<AuctionState | null> {
  try {
    const simResult = await readSimulate(contract.call('get_auction'));

    if (!rpc.Api.isSimulationSuccess(simResult)) return null;
    if (!simResult.result) return null;

    const native = scValToNative(simResult.result.retval) as Record<
      string,
      unknown
    >;

    return {
      seller: native.seller as string,
      token: native.token as string,
      min_bid: BigInt(native.min_bid as string | number | bigint),
      deadline: BigInt(native.deadline as string | number | bigint),
      highest_bidder: parseOptAddress(native.highest_bidder),
      highest_bid: BigInt(native.highest_bid as string | number | bigint),
      finalized: native.finalized as boolean,
      cancelled: native.cancelled as boolean,
    };
  } catch {
    return null;
  }
}

export async function hasAuction(_sourceAddress: string): Promise<boolean> {
  try {
    const simResult = await readSimulate(contract.call('has_auction'));
    if (!rpc.Api.isSimulationSuccess(simResult)) return false;
    if (!simResult.result) return false;
    return Boolean(scValToNative(simResult.result.retval));
  } catch {
    return false;
  }
}

export async function initialize(
  sellerAddress: string,
  tokenAddress: string,
  minBid: bigint,
  durationSeconds: bigint
) {
  return submitTx(
    sellerAddress,
    contract.call(
      'initialize',
      new Address(sellerAddress).toScVal(),
      new Address(tokenAddress).toScVal(),
      nativeToScVal(minBid, { type: 'i128' }),
      nativeToScVal(durationSeconds, { type: 'u64' })
    )
  );
}

export async function placeBid(bidderAddress: string, amount: bigint) {
  return submitTx(
    bidderAddress,
    contract.call(
      'place_bid',
      new Address(bidderAddress).toScVal(),
      nativeToScVal(amount, { type: 'i128' })
    )
  );
}

export async function finalize(callerAddress: string) {
  return submitTx(callerAddress, contract.call('finalize'));
}

export async function cancelAuction(callerAddress: string) {
  return submitTx(callerAddress, contract.call('cancel'));
}

export async function getTokenBalance(
  tokenAddress: string,
  userAddress: string
): Promise<bigint> {
  try {
    const tokenContract = new Contract(tokenAddress);
    const simResult = await readSimulate(
      tokenContract.call('balance', new Address(userAddress).toScVal())
    );
    if (!rpc.Api.isSimulationSuccess(simResult)) return 0n;
    if (!simResult.result) return 0n;
    return BigInt(scValToNative(simResult.result.retval) as bigint | number | string);
  } catch {
    return 0n;
  }
}
