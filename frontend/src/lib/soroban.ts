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
