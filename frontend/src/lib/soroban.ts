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
} from '../config';
import { signTx } from './freighter';
import type { AuctionState } from '../types';

const server = new rpc.Server(RPC_URL, { allowHttp: false });
const contract = new Contract(CONTRACT_ID);

async function buildAndSimulate(
  sourceAddress: string,
  operation: xdr.Operation
) {
  const source = await server.getAccount(sourceAddress);
  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  return { tx, simResult: await server.simulateTransaction(tx) };
}

async function submitTx(
  sourceAddress: string,
  operation: xdr.Operation
): Promise<rpc.Api.GetSuccessfulTransactionResponse> {
  const { tx, simResult } = await buildAndSimulate(sourceAddress, operation);

  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(
      (simResult as rpc.Api.SimulateTransactionErrorResponse).error ??
        'Simulation failed'
    );
  }

  if (!rpc.Api.isSimulationSuccess(simResult)) {
    throw new Error('Simulation returned unexpected result');
  }

  const prepared = rpc.assembleTransaction(tx, simResult).build();
  const signedXdr = await signTx(prepared.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  const sendResult = await server.sendTransaction(signedTx);
  if (sendResult.status === 'ERROR') {
    throw new Error('Failed to send transaction');
  }

  // Polling until confirmed
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const result = await server.getTransaction(sendResult.hash);
    if (result.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      return result as rpc.Api.GetSuccessfulTransactionResponse;
    }
    if (result.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error('Transaction failed on-chain');
    }
  }
  throw new Error('Transaction confirmation timed out');
}
