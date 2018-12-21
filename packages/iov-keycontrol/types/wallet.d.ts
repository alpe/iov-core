import { As } from "type-tagger";
import { ChainId, PrehashType, PublicKeyBundle, SignableBytes, SignatureBytes } from "@iov/bcp-types";
import { Slip10RawIndex } from "@iov/crypto";
import { ValueAndUpdates } from "@iov/stream";
import { Ed25519Wallet } from "./wallets";
export declare type LocalIdentityId = string & As<"local-identity-id">;
/** a public key we can identify with on a blockchain */
export interface PublicIdentity {
    readonly chainId: ChainId;
    readonly pubkey: PublicKeyBundle;
}
/**
 * a local version of a PublicIdentity that contains
 * additional local information
 */
export interface LocalIdentity extends PublicIdentity {
    readonly id: LocalIdentityId;
    readonly label?: string;
}
export declare type WalletId = string & As<"wallet-id">;
export declare type WalletImplementationIdString = string & As<"wallet-implementation-id">;
export declare type WalletSerializationString = string & As<"wallet-serialization">;
/**
 * A is a generic interface for managing a set of keys and signing
 * data with them.
 *
 * A Wallet is responsible for storing private keys securely and
 * signing with them. Wallet can be implemented in software or as
 * a bridge to a hardware wallet.
 */
export interface Wallet {
    readonly label: ValueAndUpdates<string | undefined>;
    readonly id: WalletId;
    /**
     * Sets a label for this wallet to be displayed in the UI.
     * To clear the label, set it to undefined.
     */
    readonly setLabel: (label: string | undefined) => void;
    /**
     * Creates a new identity in the wallet.
     *
     * The identity is bound to one chain ID to encourage using different
     * keypairs on different chains.
     */
    readonly createIdentity: (chainId: ChainId, options: Ed25519Wallet | ReadonlyArray<Slip10RawIndex> | number) => Promise<LocalIdentity>;
    readonly setIdentityLabel: (identity: PublicIdentity, label: string | undefined) => void;
    readonly getIdentities: () => ReadonlyArray<LocalIdentity>;
    readonly canSign: ValueAndUpdates<boolean>;
    readonly implementationId: WalletImplementationIdString;
    /**
     * Created a detached signature for the signable bytes
     * with the private key that matches the given PublicIdentity.
     *
     * If a matching PublicIdentity is not present in this wallet, an error is thrown.
     */
    readonly createTransactionSignature: (identity: PublicIdentity, transactionBytes: SignableBytes, prehash: PrehashType) => Promise<SignatureBytes>;
    /**
     * Exposes the secret data of this wallet in a printable format for
     * backup purposes.
     *
     * The format depends on the implementation and may change over time,
     * so do not try to parse the result or make any kind of assumtions on
     * how the result looks like.
     */
    readonly printableSecret: () => string;
    readonly serialize: () => WalletSerializationString;
    readonly clone: () => Wallet;
}
