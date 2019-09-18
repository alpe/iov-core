import { Amount, FullSignature, PubkeyBundle, SignedTransaction, UnsignedTransaction } from "@iov/bcp";
import * as codecImpl from "./generated/codecimpl";
import { Participant, PrivkeyBundle } from "./types";
export declare function encodePubkey(publicKey: PubkeyBundle): codecImpl.crypto.IPublicKey;
export declare function encodePrivkey(privkey: PrivkeyBundle): codecImpl.crypto.IPrivateKey;
export declare function encodeAmount(amount: Amount): codecImpl.coin.ICoin;
export declare function encodeFullSignature(fullSignature: FullSignature): codecImpl.sigs.IStdSignature;
export declare function encodeParticipants(
  participants: readonly Participant[],
): codecImpl.multisig.IParticipant[];
export declare function buildMsg(tx: UnsignedTransaction): codecImpl.bnsd.ITx;
export declare function buildUnsignedTx(tx: UnsignedTransaction): codecImpl.bnsd.ITx;
export declare function buildSignedTx(tx: SignedTransaction): codecImpl.bnsd.ITx;
