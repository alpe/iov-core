import { Nonce, PrehashType, RecipientId, SendTx, TokenTicker, TransactionKind } from "@iov/bcp-types";
import { bnsCodec } from "@iov/bns";
import { Ed25519, Sha512 } from "@iov/crypto";
import { Encoding, Int53 } from "@iov/encoding";
import { WalletSerializationString } from "@iov/keycontrol";
import { Algorithm, ChainId } from "@iov/tendermint-types";

import { pendingWithoutInteractiveLedger, pendingWithoutLedger } from "./common.spec";
import { LedgerSimpleAddressKeyringEntry } from "./ledgersimpleaddresskeyringentry";
import { LedgerState } from "./statetracker";

const { toHex } = Encoding;

describe("LedgerSimpleAddressKeyringEntry", () => {
  it("can be constructed", () => {
    const wallet = new LedgerSimpleAddressKeyringEntry();
    expect(wallet).toBeTruthy();
  });

  it("is empty after construction", () => {
    const wallet = new LedgerSimpleAddressKeyringEntry();
    expect(wallet.label.value).toBeUndefined();
    expect(wallet.getIdentities().length).toEqual(0);
  });

  it("can have a label", () => {
    const wallet = new LedgerSimpleAddressKeyringEntry();
    expect(wallet.label.value).toBeUndefined();

    wallet.setLabel("foo");
    expect(wallet.label.value).toEqual("foo");

    wallet.setLabel(undefined);
    expect(wallet.label.value).toBeUndefined();
  });

  it("can create an identity", async () => {
    pendingWithoutLedger();

    const wallet = new LedgerSimpleAddressKeyringEntry();
    wallet.startDeviceTracking();
    const newIdentity = await wallet.createIdentity(0);
    expect(newIdentity).toBeTruthy();
    expect(newIdentity.pubkey.algo).toEqual(Algorithm.Ed25519);
    expect(newIdentity.pubkey.data.length).toEqual(32);
    wallet.stopDeviceTracking();
  });

  it("can load a newly created identity", async () => {
    pendingWithoutLedger();

    const wallet = new LedgerSimpleAddressKeyringEntry();
    wallet.startDeviceTracking();
    const newIdentity = await wallet.createIdentity(0);

    expect(wallet.getIdentities().length).toEqual(1);

    const firstIdentity = wallet.getIdentities()[0];
    expect(newIdentity.pubkey.algo).toEqual(firstIdentity.pubkey.algo);
    expect(newIdentity.pubkey.data).toEqual(firstIdentity.pubkey.data);
    expect(newIdentity.label).toEqual(firstIdentity.label);
    wallet.stopDeviceTracking();
  });

  it("can create multiple identities", async () => {
    pendingWithoutLedger();

    const wallet = new LedgerSimpleAddressKeyringEntry();
    wallet.startDeviceTracking();
    const newIdentity1 = await wallet.createIdentity(0);
    const newIdentity2 = await wallet.createIdentity(1);
    const newIdentity3 = await wallet.createIdentity(2);
    const newIdentity4 = await wallet.createIdentity(3);
    const newIdentity5 = await wallet.createIdentity(4);

    // all pubkeys must be different
    const pubkeySet = new Set([newIdentity1, newIdentity2, newIdentity3, newIdentity4, newIdentity5].map(i => toHex(i.pubkey.data)));
    expect(pubkeySet.size).toEqual(5);

    expect(wallet.getIdentities().length).toEqual(5);

    const firstIdentity = wallet.getIdentities()[0];
    expect(newIdentity1.pubkey.algo).toEqual(firstIdentity.pubkey.algo);
    expect(newIdentity1.pubkey.data).toEqual(firstIdentity.pubkey.data);
    expect(newIdentity1.label).toEqual(firstIdentity.label);

    const lastIdentity = wallet.getIdentities()[4];
    expect(newIdentity5.pubkey.algo).toEqual(lastIdentity.pubkey.algo);
    expect(newIdentity5.pubkey.data).toEqual(lastIdentity.pubkey.data);
    expect(newIdentity5.label).toEqual(lastIdentity.label);
    wallet.stopDeviceTracking();
  });

  it("throws when adding the same identity index twice", async () => {
    pendingWithoutLedger();

    const wallet = new LedgerSimpleAddressKeyringEntry();
    wallet.startDeviceTracking();
    await wallet.createIdentity(0);
    await wallet
      .createIdentity(0)
      .then(() => fail("must not resolve"))
      .catch(error => expect(error).toMatch(/Identity Index collision/i));
  });

  it("can set, change and unset an identity label", async () => {
    pendingWithoutLedger();

    const wallet = new LedgerSimpleAddressKeyringEntry();
    wallet.startDeviceTracking();
    const newIdentity = await wallet.createIdentity(0);
    expect(wallet.getIdentities()[0].label).toBeUndefined();

    wallet.setIdentityLabel(newIdentity, "foo");
    expect(wallet.getIdentities()[0].label).toEqual("foo");

    wallet.setIdentityLabel(newIdentity, "bar");
    expect(wallet.getIdentities()[0].label).toEqual("bar");

    wallet.setIdentityLabel(newIdentity, undefined);
    expect(wallet.getIdentities()[0].label).toBeUndefined();
    wallet.stopDeviceTracking();
  });

  it("has disconnected device state when created", () => {
    pendingWithoutInteractiveLedger();

    const wallet = new LedgerSimpleAddressKeyringEntry();
    wallet.startDeviceTracking();
    expect(wallet.deviceState.value).toEqual(LedgerState.Disconnected);
    wallet.stopDeviceTracking();
  });

  it("changed device state to app open after some time", async () => {
    pendingWithoutInteractiveLedger();

    const wallet = new LedgerSimpleAddressKeyringEntry();
    wallet.startDeviceTracking();
    expect(wallet.deviceState.value).toEqual(LedgerState.Disconnected);

    await wallet.deviceState.waitFor(LedgerState.IovAppOpen);
    expect(wallet.deviceState.value).toEqual(LedgerState.IovAppOpen);
    wallet.stopDeviceTracking();
  });

  it("cannot sign when created", () => {
    pendingWithoutInteractiveLedger();

    const wallet = new LedgerSimpleAddressKeyringEntry();
    expect(wallet.canSign.value).toEqual(false);
  });

  it("can sign after some time", async () => {
    pendingWithoutInteractiveLedger();

    const wallet = new LedgerSimpleAddressKeyringEntry();
    wallet.startDeviceTracking();
    expect(wallet.canSign.value).toEqual(false);

    await wallet.canSign.waitFor(true);
    expect(wallet.canSign.value).toEqual(true);
    wallet.stopDeviceTracking();
  });

  it("cannot sign when device tracking is off", async () => {
    pendingWithoutInteractiveLedger();

    const wallet = new LedgerSimpleAddressKeyringEntry();
    expect(wallet.canSign.value).toEqual(false);

    wallet.startDeviceTracking();
    await wallet.canSign.waitFor(true);
    expect(wallet.canSign.value).toEqual(true);

    wallet.stopDeviceTracking();
    expect(wallet.canSign.value).toEqual(false);
  });

  it("can sign", async () => {
    pendingWithoutInteractiveLedger();

    const wallet = new LedgerSimpleAddressKeyringEntry();
    wallet.startDeviceTracking();
    const newIdentity = await wallet.createIdentity(0);

    await wallet.canSign.waitFor(true);

    const tx: SendTx = {
      kind: TransactionKind.Send,
      chainId: "test-ledger-paths" as ChainId,
      recipient: "1234ABCD0000AA0000FFFF0000AA00001234ABCD" as RecipientId,
      amount: {
        // 77.01001 PATH
        whole: 77,
        fractional: 10010000,
        tokenTicker: "PATH" as TokenTicker,
      },
      signer: newIdentity.pubkey,
    };
    const nonce = new Int53(5) as Nonce;
    const { bytes, prehashType } = bnsCodec.bytesToSign(tx, nonce);

    const signature = await wallet.createTransactionSignature(newIdentity, bytes, prehashType, tx.chainId);
    expect(signature).toBeTruthy();
    expect(signature.length).toEqual(64);

    switch (prehashType) {
      case PrehashType.Sha512:
        const prehash = new Sha512(bytes).digest();
        const valid = await Ed25519.verifySignature(signature, prehash, newIdentity.pubkey.data);
        expect(valid).toEqual(true);
        break;
      default:
        fail("Unexpected prehash type");
    }

    wallet.stopDeviceTracking();
  });

  it("can serialize multiple identities", async () => {
    pendingWithoutLedger();

    const wallet = new LedgerSimpleAddressKeyringEntry();
    wallet.startDeviceTracking();
    wallet.setLabel("wallet with 3 identities");
    const identity1 = await wallet.createIdentity(0);
    const identity2 = await wallet.createIdentity(1);
    const identity3 = await wallet.createIdentity(2);
    wallet.setIdentityLabel(identity1, undefined);
    wallet.setIdentityLabel(identity2, "");
    wallet.setIdentityLabel(identity3, "foo");

    const serialized = wallet.serialize();
    expect(serialized).toBeTruthy();
    expect(serialized.length).toBeGreaterThan(100);

    const decodedJson = JSON.parse(serialized);
    expect(decodedJson).toBeTruthy();
    expect(decodedJson.label).toEqual("wallet with 3 identities");
    expect(decodedJson.secret).toMatch(/^[a-z]+( [a-z]+)*$/);
    expect(decodedJson.identities.length).toEqual(3);
    expect(decodedJson.identities[0].localIdentity).toBeTruthy();
    expect(decodedJson.identities[0].localIdentity.pubkey.algo).toEqual("ed25519");
    expect(decodedJson.identities[0].localIdentity.pubkey.data).toMatch(/^[0-9a-f]{64}$/);
    expect(decodedJson.identities[0].localIdentity.label).toBeUndefined();
    expect(decodedJson.identities[0].simpleAddressIndex).toEqual(0);
    expect(decodedJson.identities[1].localIdentity).toBeTruthy();
    expect(decodedJson.identities[1].localIdentity.pubkey.algo).toEqual("ed25519");
    expect(decodedJson.identities[1].localIdentity.pubkey.data).toMatch(/^[0-9a-f]{64}$/);
    expect(decodedJson.identities[1].localIdentity.label).toEqual("");
    expect(decodedJson.identities[1].simpleAddressIndex).toEqual(1);
    expect(decodedJson.identities[2].localIdentity).toBeTruthy();
    expect(decodedJson.identities[2].localIdentity.pubkey.algo).toEqual("ed25519");
    expect(decodedJson.identities[2].localIdentity.pubkey.data).toMatch(/^[0-9a-f]{64}$/);
    expect(decodedJson.identities[2].localIdentity.label).toEqual("foo");
    expect(decodedJson.identities[2].simpleAddressIndex).toEqual(2);

    // keys are different
    expect(decodedJson.identities[0].localIdentity.pubkey.data).not.toEqual(decodedJson.identities[1].localIdentity.pubkey.data);
    expect(decodedJson.identities[1].localIdentity.pubkey.data).not.toEqual(decodedJson.identities[2].localIdentity.pubkey.data);
    expect(decodedJson.identities[2].localIdentity.pubkey.data).not.toEqual(decodedJson.identities[0].localIdentity.pubkey.data);
    wallet.stopDeviceTracking();
  });

  it("can deserialize", () => {
    {
      // empty
      const wallet = new LedgerSimpleAddressKeyringEntry('{ "identities": [] }' as WalletSerializationString);
      expect(wallet).toBeTruthy();
      expect(wallet.getIdentities().length).toEqual(0);
    }

    {
      // one element
      const serialized = '{ "identities": [{"localIdentity": { "pubkey": { "algo": "ed25519", "data": "aabbccdd" }, "label": "foo" }, "simpleAddressIndex": 7}] }' as WalletSerializationString;
      const wallet = new LedgerSimpleAddressKeyringEntry(serialized);
      expect(wallet).toBeTruthy();
      expect(wallet.getIdentities().length).toEqual(1);
      expect(wallet.getIdentities()[0].pubkey.algo).toEqual("ed25519");
      expect(wallet.getIdentities()[0].pubkey.data).toEqual(Encoding.fromHex("aabbccdd"));
      expect(wallet.getIdentities()[0].label).toEqual("foo");
    }

    {
      // two elements
      const serialized = '{ "identities": [{"localIdentity": { "pubkey": { "algo": "ed25519", "data": "aabbccdd" }, "label": "foo" }, "simpleAddressIndex": 7}, {"localIdentity": { "pubkey": { "algo": "ed25519", "data": "ddccbbaa" }, "label": "bar" }, "simpleAddressIndex": 23}] }' as WalletSerializationString;
      const wallet = new LedgerSimpleAddressKeyringEntry(serialized);
      expect(wallet).toBeTruthy();
      expect(wallet.getIdentities().length).toEqual(2);
      expect(wallet.getIdentities()[0].pubkey.algo).toEqual("ed25519");
      expect(wallet.getIdentities()[0].pubkey.data).toEqual(Encoding.fromHex("aabbccdd"));
      expect(wallet.getIdentities()[0].label).toEqual("foo");
      expect(wallet.getIdentities()[1].pubkey.algo).toEqual("ed25519");
      expect(wallet.getIdentities()[1].pubkey.data).toEqual(Encoding.fromHex("ddccbbaa"));
      expect(wallet.getIdentities()[1].label).toEqual("bar");
    }
  });

  it("can serialize and restore a full keyring wallet", async () => {
    pendingWithoutLedger();

    const original = new LedgerSimpleAddressKeyringEntry();
    original.startDeviceTracking();
    const identity1 = await original.createIdentity(0);
    const identity2 = await original.createIdentity(1);
    const identity3 = await original.createIdentity(2);
    original.stopDeviceTracking();
    original.setIdentityLabel(identity1, undefined);
    original.setIdentityLabel(identity2, "");
    original.setIdentityLabel(identity3, "foo");

    const restored = new LedgerSimpleAddressKeyringEntry(original.serialize());

    // pubkeys and labels match
    expect(original.getIdentities()).toEqual(restored.getIdentities());

    // simpleAddressIndices are not exposed and cannot be compared
    // without interactively creating Ledger signatures.
  });

  it("can be cloned", () => {
    const oneIdentitySerialization = '{ "identities": [{"localIdentity": { "pubkey": { "algo": "ed25519", "data": "aabbccdd" }, "label": "foo" }, "simpleAddressIndex": 7}] }' as WalletSerializationString;
    const original = new LedgerSimpleAddressKeyringEntry(oneIdentitySerialization);
    const clone = original.clone();
    expect(clone).not.toBe(original);
    expect(clone.serialize()).toEqual(original.serialize());
  });

  describe("Keyring integration", () => {
    it("wallet type can be registered", () => {
      LedgerSimpleAddressKeyringEntry.registerWithKeyring();
    });
  });
});
