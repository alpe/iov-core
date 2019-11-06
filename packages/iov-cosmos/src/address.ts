import { Address, PubkeyBundle } from "@iov/bcp";
import { Bech32 } from "@iov/encoding";

export type CosmosAddressBech32Prefix = "cosmos" | "cosmosvalcons" | "cosmosvaloper";
export type CosmosPubkeyBech32Prefix = "cosmospub" | "cosmosvalconspub" | "cosmosvaloperpub";
export type CosmosBech32Prefix = CosmosAddressBech32Prefix | CosmosPubkeyBech32Prefix;

function isCosmosAddressBech32Prefix(prefix: string): prefix is CosmosAddressBech32Prefix {
  return ["cosmos", "cosmosvalcons", "cosmosvaloper"].includes(prefix);
}

export function decodeCosmosAddress(
  address: Address,
): { readonly prefix: CosmosAddressBech32Prefix; readonly data: Uint8Array } {
  const { prefix, data } = Bech32.decode(address);
  if (!isCosmosAddressBech32Prefix(prefix)) {
    throw new Error(`Invalid bech32 prefix. Must be one of cosmos, cosmosvalcons, or cosmosvaloper.`);
  }
  if (data.length !== 20) {
    throw new Error("Invalid data length. Expected 20 bytes.");
  }
  return { prefix: prefix, data: data };
}

export function isValidAddress(address: string): boolean {
  try {
    decodeCosmosAddress(address as Address);
    return true;
  } catch {
    return false;
  }
}

export function pubkeyToAddress(pubkey: PubkeyBundle): Address {
  throw new Error("not implemented");
}
