/* eslint-disable @typescript-eslint/camelcase,@typescript-eslint/no-unused-vars */
import {
  Account,
  AccountQuery,
  AddressQuery,
  Algorithm,
  BlockchainConnection,
  BlockHeader,
  BlockId,
  BlockInfo,
  ChainId,
  ConfirmedAndSignedTransaction,
  ConfirmedTransaction,
  FailedTransaction,
  Fee,
  isPubkeyQuery,
  LightTransaction,
  Nonce,
  PostableBytes,
  PostTxResponse,
  PubkeyBytes,
  PubkeyQuery,
  Token,
  TokenTicker,
  TransactionId,
  TransactionQuery,
  TransactionState,
  UnsignedTransaction,
} from "@iov/bcp";
import { Encoding, Uint53 } from "@iov/encoding";
import { DefaultValueProducer, ValueAndUpdates } from "@iov/stream";
import { ReadonlyDate } from "readonly-date";
import { Stream } from "xstream";

import { CosmosBech32Prefix, pubkeyToAddress } from "./address";
import { decodeAmount, parseTx } from "./decode";
import { RestClient } from "./restclient";

const { fromBase64 } = Encoding;

const vatom = "vatom" as TokenTicker;

interface ChainData {
  readonly chainId: ChainId;
}

export class CosmosConnection implements BlockchainConnection {
  public static async establish(url: string): Promise<CosmosConnection> {
    const restClient = new RestClient(url);
    const chainData = await this.initialize(restClient);
    return new CosmosConnection(restClient, chainData);
  }

  private static async initialize(restClient: RestClient): Promise<ChainData> {
    const { node_info } = await restClient.nodeInfo();
    return { chainId: node_info.network as ChainId };
  }

  private readonly restClient: RestClient;
  private readonly chainData: ChainData;

  private get prefix(): CosmosBech32Prefix {
    return "cosmos";
  }

  private constructor(restClient: RestClient, chainData: ChainData) {
    this.restClient = restClient;
    this.chainData = chainData;
  }

  public disconnect(): void {
    return;
  }

  public chainId(): ChainId {
    return this.chainData.chainId;
  }

  public async height(): Promise<number> {
    const { block_meta } = await this.restClient.blocksLatest();
    return block_meta.header.height;
  }

  public async getToken(ticker: TokenTicker): Promise<Token | undefined> {
    throw new Error("not implemented");
  }

  public async getAllTokens(): Promise<readonly Token[]> {
    throw new Error("not implemented");
  }

  public async getAccount(query: AccountQuery): Promise<Account | undefined> {
    const address = isPubkeyQuery(query) ? pubkeyToAddress(query.pubkey, this.prefix) : query.address;
    const { result } = await this.restClient.authAccounts(address);
    const account = result.value;
    return account.public_key === null
      ? undefined
      : {
          address: address,
          balance: account.coins.map(decodeAmount),
          pubkey: {
            algo: Algorithm.Secp256k1,
            data: fromBase64(account.public_key.value) as PubkeyBytes,
          },
        };
  }

  public watchAccount(account: AccountQuery): Stream<Account | undefined> {
    throw new Error("not implemented");
  }

  public async getNonce(query: AddressQuery | PubkeyQuery): Promise<Nonce> {
    const address = isPubkeyQuery(query) ? pubkeyToAddress(query.pubkey, this.prefix) : query.address;
    const { result } = await this.restClient.authAccounts(address);
    const account = result.value;
    return parseInt(account.sequence, 10) as Nonce;
  }

  public async getNonces(query: AddressQuery | PubkeyQuery, count: number): Promise<readonly Nonce[]> {
    const checkedCount = new Uint53(count).toNumber();
    if (checkedCount === 0) {
      return [];
    }
    const firstNonce = await this.getNonce(query);
    return [...new Array(checkedCount)].map((_, i) => (firstNonce + i) as Nonce);
  }

  public async getBlockHeader(height: number): Promise<BlockHeader> {
    const { block_meta } = await this.restClient.blocks(height);
    return {
      id: block_meta.block_id.hash as BlockId,
      height: block_meta.header.height,
      time: new ReadonlyDate(block_meta.header.time),
      transactionCount: block_meta.header.num_txs,
    };
  }

  public watchBlockHeaders(): Stream<BlockHeader> {
    throw new Error("not implemented");
  }

  public async getTx(
    id: TransactionId,
  ): Promise<(ConfirmedAndSignedTransaction<UnsignedTransaction>) | FailedTransaction> {
    try {
      const response = await this.restClient.txsById(id);
      const height = parseInt(response.height, 10);

      const currentHeight = await this.height();

      return {
        ...parseTx(response.tx, this.chainId()),
        height: height,
        confirmations: currentHeight - height + 1,
        transactionId: response.txhash as TransactionId,
        log: response.raw_log,
      };
    } catch (error) {
      if (error.response.status === 404) {
        throw new Error("Transaction does not exist");
      }
      throw error;
    }
  }

  public async postTx(tx: PostableBytes): Promise<PostTxResponse> {
    const { txhash, raw_log } = await this.restClient.postTx(tx);
    const transactionId = txhash as TransactionId;
    const firstEvent: BlockInfo = { state: TransactionState.Pending };
    const producer = new DefaultValueProducer<BlockInfo>(firstEvent);
    return {
      blockInfo: new ValueAndUpdates<BlockInfo>(producer),
      transactionId: transactionId,
      log: raw_log,
    };
  }

  public async searchTx(
    query: TransactionQuery,
  ): Promise<readonly (ConfirmedTransaction<LightTransaction> | FailedTransaction)[]> {
    throw new Error("not implemented");
  }

  public listenTx(
    query: TransactionQuery,
  ): Stream<ConfirmedTransaction<LightTransaction> | FailedTransaction> {
    throw new Error("not implemented");
  }

  public liveTx(query: TransactionQuery): Stream<ConfirmedTransaction<LightTransaction> | FailedTransaction> {
    throw new Error("not implemented");
  }

  public async getFeeQuote(tx: UnsignedTransaction): Promise<Fee> {
    throw new Error("not implemented");
  }

  public async withDefaultFee<T extends UnsignedTransaction>(tx: T): Promise<T> {
    return {
      ...tx,
      fee: {
        tokens: {
          quantity: "5000",
          tokenTicker: vatom,
        },
        gasLimit: "200000",
      },
    };
  }
}
