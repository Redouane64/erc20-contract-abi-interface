import { Wallet } from "ethers";
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
 * Contract options
 */
export type ContractInterfaceOptions = {
  provider: WebSocketProvider;
  mnemonic: Mnemonic;
  contractAddress: Address;
  abi: any;
};

/**
 * Contracts interaction interface
 */
export class ContractInterface {
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
    this._web3 = new Web3();
    this._web3.setProvider(options.provider);

    // initialize contract
    this._contract = new this._web3.eth.Contract(
      options.abi,
      options.contractAddress
    );

    // initialize account
    const wallet = Wallet.fromMnemonic(options.mnemonic);
    this._account = this._web3.eth.accounts.privateKeyToAccount(
      wallet.privateKey
    );
  }

  async call(methodName: string, ...args: any): Promise<unknown | undefined> {
    const method = this._contract.methods[methodName].apply({}, [...args])
    const sign = await this._account.sign(method.encodeABI())
    if (sign.rawTransaction !== undefined) {
      return await this._web3.eth.sendSignedTransaction(sign.rawTransaction)
    }

    return undefined;
  }

}
