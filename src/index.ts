import { Event, Wallet } from "ethers";
import { EventEmitter } from "stream";
import Web3 from "web3";

/**
 * Contract ABI interface
 */
export type ContractABI = Record<string, any>;

/**
 * Wallet mnemonic
 */
export type Mnemonic = string;

/**
 * Blockchain address
 */
export type Address = string;

/**
 * Web3 instance type
 */
type IWeb3 = InstanceType<typeof Web3>;

/**
 * Web3 websocket provider instance type
 */
type WebSocketProvider = InstanceType<typeof Web3.providers.WebsocketProvider>;

/**
 * This type from Web3
 */
export interface EventData {
  returnValues: {
    [key: string]: any;
  };
  raw: {
    data: string;
    topics: string[];
  };
  event: string;
  signature: string;
  logIndex: number;
  transactionIndex: number;
  transactionHash: string;
  blockHash: string;
  blockNumber: number;
  address: string;
}

/**
 * Contract options
 */
export type ContractInterfaceOptions = {
  provider: WebSocketProvider;
  mnemonic?: Mnemonic;
  address: Address;
  abi: any;
};

export type ContractEventHandlerFunc = (
  error: Error | undefined,
  data: EventData | undefined
) => Promise<void>;

/**
 * Contracts interaction interface
 */
export class ContractInterface extends EventEmitter {
  /**
   * Underlying web3 instance
   */
  private readonly _web3: InstanceType<typeof Web3>;
  private _account;
  private _contract;
  /**
   * Create contract interface instance
   * @param options contracts options
   */
  constructor(private readonly options: ContractInterfaceOptions) {
    super();

    this._web3 = new Web3();
    this._web3.setProvider(options.provider);

    // initialize contract
    this._contract = new this._web3.eth.Contract(options.abi, options.address);

    // initialize account
    if (options.mnemonic) {
      const wallet = Wallet.fromMnemonic(options.mnemonic);
      this._account = this._web3.eth.accounts.privateKeyToAccount(
        wallet.privateKey
      );
    }
  }

  async call(methodName: string, ...args: any): Promise<any | undefined> {

    if (!this._account) {
      throw new Error('Account is not set')
    }

    const method = this._contract.methods[methodName].apply({}, [...args]);

    const gas = await this._web3.eth.estimateGas({
      from: this._account.address,
      to: this.options.address,
      value: 0,
      data: method.encodeABI(),
    });

    const sign = await this._account.signTransaction({
      from: this._account.address,
      to: this.options.address,
      data: method.encodeABI(),
      gas,
    });

    if (sign.rawTransaction !== undefined) {
      return await this._web3.eth.sendSignedTransaction(sign.rawTransaction);
    }

    return undefined;
  }

  subscribeToEvent(
    event: string,
    callback: ContractEventHandlerFunc,
    options: any
  ): void {
    this._contract.events[event](
      { ...options },
      (error: Error | undefined, data: EventData | undefined) => {
        callback(error, data);
        this.emit(event, { error, data });
      }
    );
  }
}
