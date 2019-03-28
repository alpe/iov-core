import BN from "bn.js";
import { Address } from "web3x/address";
import { EventLog, TransactionReceipt } from "web3x/formatters";
import { Contract, ContractOptions, TxCall, TxSend, EventSubscriptionFactory } from "web3x/contract";
import { Eth } from "web3x/eth";
import abi from "./AtomicSwapEtherAbi";
export type OpenedEvent = {
  id: string;
  recipient: Address;
  hash: string;
};
export type ClaimedEvent = {
  id: string;
  preimage: string;
};
export type AbortedEvent = {
  id: string;
};
export interface OpenedEventLog extends EventLog<OpenedEvent, "Opened"> {}
export interface ClaimedEventLog extends EventLog<ClaimedEvent, "Claimed"> {}
export interface AbortedEventLog extends EventLog<AbortedEvent, "Aborted"> {}
interface AtomicSwapEtherEvents {
  Opened: EventSubscriptionFactory<OpenedEventLog>;
  Claimed: EventSubscriptionFactory<ClaimedEventLog>;
  Aborted: EventSubscriptionFactory<AbortedEventLog>;
}
interface AtomicSwapEtherEventLogs {
  Opened: OpenedEventLog;
  Claimed: ClaimedEventLog;
  Aborted: AbortedEventLog;
}
interface AtomicSwapEtherTxEventLogs {
  Opened: OpenedEventLog[];
  Claimed: ClaimedEventLog[];
  Aborted: AbortedEventLog[];
}
export interface AtomicSwapEtherTransactionReceipt extends TransactionReceipt<AtomicSwapEtherTxEventLogs> {}
interface AtomicSwapEtherMethods {
  open(
    id: string,
    recipient: Address,
    hash: string,
    timeout: number | string | BN,
  ): TxSend<AtomicSwapEtherTransactionReceipt>;
  claim(id: string, preimage: string): TxSend<AtomicSwapEtherTransactionReceipt>;
  abort(id: string): TxSend<AtomicSwapEtherTransactionReceipt>;
  get(id: string): TxCall<[Address, Address, string, string, string, string]>;
}
export interface AtomicSwapEtherDefinition {
  methods: AtomicSwapEtherMethods;
  events: AtomicSwapEtherEvents;
  eventLogs: AtomicSwapEtherEventLogs;
}
export class AtomicSwapEther extends Contract<AtomicSwapEtherDefinition> {
  constructor(eth: Eth, address?: Address, options?: ContractOptions) {
    super(eth, abi, address, options);
  }
  deploy(): TxSend<AtomicSwapEtherTransactionReceipt> {
    return super.deployBytecode(
      "0x608060405234801561001057600080fd5b50610e74806100206000396000f3fe60806040526004361061005c576000357c01000000000000000000000000000000000000000000000000000000009004806309d6ce0e146100615780630eed85481461009c57806384cc9dfb146100fe5780638eaa6ac014610143575b600080fd5b34801561006d57600080fd5b5061009a6004803603602081101561008457600080fd5b810190808035906020019092919050505061020d565b005b6100fc600480360360808110156100b257600080fd5b8101908080359060200190929190803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190803590602001909291905050506104f9565b005b34801561010a57600080fd5b506101416004803603604081101561012157600080fd5b810190808035906020019092919080359060200190929190505050610785565b005b34801561014f57600080fd5b5061017c6004803603602081101561016657600080fd5b8101908080359060200190929190505050610b6e565b604051808773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020018673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001858152602001848152602001838152602001828152602001965050505050505060405180910390f35b806001600381111561021b57fe5b60008083815260200190815260200160002060000160009054906101000a900460ff16600381111561024957fe5b1461029f576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526023815260200180610e056023913960400191505060405180910390fd5b816000808281526020019081526020016000206004015443101561030e576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526021815260200180610e286021913960400191505060405180910390fd5b600360008085815260200190815260200160002060000160006101000a81548160ff0219169083600381111561034057fe5b021790555061034d610d8a565b6000808581526020019081526020016000206040518060e00160405290816000820160009054906101000a900460ff16600381111561038857fe5b600381111561039357fe5b81526020016000820160019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020016001820160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020016002820154815260200160038201548152602001600482015481526020016005820154815250509050806020015173ffffffffffffffffffffffffffffffffffffffff166108fc82608001519081150290604051600060405180830381858888f193505050501580156104bb573d6000803e3d6000fd5b507ff7fe6a2a9810864c5fce35c9d3c75940da5f9612d43350b505aa0aa4c6494d99846040518082815260200191505060405180910390a150505050565b836000600381111561050757fe5b60008083815260200190815260200160002060000160009054906101000a900460ff16600381111561053557fe5b146105a8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260168152602001807f5377617020494420616c7265616479206578697374730000000000000000000081525060200191505060405180910390fd5b6040518060e00160405280600160038111156105c057fe5b81526020013373ffffffffffffffffffffffffffffffffffffffff1681526020018573ffffffffffffffffffffffffffffffffffffffff168152602001848152602001348152602001838152602001600060010281525060008087815260200190815260200160002060008201518160000160006101000a81548160ff0219169083600381111561064d57fe5b021790555060208201518160000160016101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060408201518160010160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550606082015181600201556080820151816003015560a0820151816004015560c082015181600501559050507f7d2d7598660cc34c77e3000b3932229f0c06b915daa1a845cfb21e82d275c2ea858585604051808481526020018373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001828152602001935050505060405180910390a15050505050565b816001600381111561079357fe5b60008083815260200190815260200160002060000160009054906101000a900460ff1660038111156107c157fe5b14610817576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526023815260200180610e056023913960400191505060405180910390fd5b8282600281604051602001808281526020019150506040516020818303038152906040526040518082805190602001908083835b6020831061086e578051825260208201915060208101905060208303925061084b565b6001836020036101000a038019825116818451168082178552505050505050905001915050602060405180830381855afa1580156108b0573d6000803e3d6000fd5b5050506040513d60208110156108c557600080fd5b8101908080519060200190929190505050600080848152602001908152602001600020600201541461095f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601e8152602001807f496e76616c696420707265696d61676520666f7220737761702068617368000081525060200191505060405180910390fd5b600260008087815260200190815260200160002060000160006101000a81548160ff0219169083600381111561099157fe5b021790555083600080878152602001908152602001600020600501819055506109b8610d8a565b6000808781526020019081526020016000206040518060e00160405290816000820160009054906101000a900460ff1660038111156109f357fe5b60038111156109fe57fe5b81526020016000820160019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020016001820160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020016002820154815260200160038201548152602001600482015481526020016005820154815250509050806040015173ffffffffffffffffffffffffffffffffffffffff166108fc82608001519081150290604051600060405180830381858888f19350505050158015610b26573d6000803e3d6000fd5b507f38d6042dbdae8e73a7f6afbabd3fbe0873f9f5ed3cd71294591c3908c2e65fee8686604051808381526020018281526020019250505060405180910390a1505050505050565b6000806000806000808660006003811115610b8557fe5b60008083815260200190815260200160002060000160009054906101000a900460ff166003811115610bb357fe5b1415610c27576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601e8152602001807f4e6f207377617020666f756e6420666f722074686520676976656e204944000081525060200191505060405180910390fd5b610c2f610d8a565b6000808a81526020019081526020016000206040518060e00160405290816000820160009054906101000a900460ff166003811115610c6a57fe5b6003811115610c7557fe5b81526020016000820160019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020016001820160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200160028201548152602001600382015481526020016004820154815260200160058201548152505090508060200151816040015182606001518360a0015184608001518560c00151859550849450975097509750975097509750505091939550919395565b6040518060e0016040528060006003811115610da257fe5b8152602001600073ffffffffffffffffffffffffffffffffffffffff168152602001600073ffffffffffffffffffffffffffffffffffffffff16815260200160008019168152602001600081526020016000815260200160008019168152509056fe4e6f206f70656e207377617020666f756e6420666f722074686520676976656e204944537761702074696d656f757420686173206e6f74206265656e2072656163686564a165627a7a72305820e86df7bafe66bf079a8714bba676d9b531b7c8f82834944a5b471d4b97da4a060029",
    ) as any;
  }
}
export var AtomicSwapEtherAbi = abi;