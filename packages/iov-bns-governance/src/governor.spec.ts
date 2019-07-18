/* eslint-disable @typescript-eslint/camelcase */
import { Address, Algorithm, PubkeyBytes, TokenTicker } from "@iov/bcp";
import { ActionKind, bnsCodec, BnsConnection, VoteOption } from "@iov/bns";
import { Encoding } from "@iov/encoding";
import { Ed25519HdWallet, HdPaths, UserProfile } from "@iov/keycontrol";
import { ReadonlyDate } from "readonly-date";

import { CommitteeId } from "./committees";
import { Governor, GovernorOptions } from "./governor";
import { ProposalType } from "./proposals";

function pendingWithoutBnsd(): void {
  if (!process.env.BNSD_ENABLED) {
    pending("Set BNSD_ENABLED to enable bnsd-based tests");
  }
}

// The first IOV key (m/44'/234'/0') generated from this mnemonic produces the address
// tiov15nuhg3l8ma2mdmcdvgy7hme20v3xy5mkxcezea (bech32) / a4f97447e7df55b6ef0d6209ebef2a7b22625376 (hex).
// This account has money in the genesis file (see scripts/bnsd/README.md).
const faucetMnemonic = "degree tackle suggest window test behind mesh extra cover prepare oak script";
const faucetPath = HdPaths.iov(0);
const bnsdUrl = "http://localhost:23456";
const guaranteeFundEscrowId = Encoding.fromHex("88008800");

async function getGovernorOptions(path = faucetPath): Promise<GovernorOptions> {
  const connection = await BnsConnection.establish(bnsdUrl);
  const chainId = await connection.chainId();
  const profile = new UserProfile();
  const wallet = profile.addWallet(Ed25519HdWallet.fromMnemonic(faucetMnemonic));
  const identity = await profile.createIdentity(wallet.id, chainId, path);
  return {
    connection: connection,
    identity: identity,
    guaranteeFundEscrowId: guaranteeFundEscrowId,
  };
}

describe("Governor", () => {
  it("can be constructed", async () => {
    pendingWithoutBnsd();
    const options = await getGovernorOptions();
    const governor = new Governor(options);
    expect(governor).toBeTruthy();

    options.connection.disconnect();
  });

  describe("getElectorates", () => {
    it("can get electorates", async () => {
      pendingWithoutBnsd();
      const options = await getGovernorOptions();
      const governor = new Governor(options);

      const electorates = await governor.getElectorates();
      expect(electorates.length).toEqual(2);
      expect(electorates[0].id).toEqual(1);
      expect(electorates[1].id).toEqual(2);

      options.connection.disconnect();
    });

    it("can get empty list of electorates", async () => {
      pendingWithoutBnsd();
      const options = await getGovernorOptions(HdPaths.iov(100));
      const governor = new Governor(options);

      const electorates = await governor.getElectorates();
      expect(electorates.length).toEqual(0);

      options.connection.disconnect();
    });
  });

  describe("getElectionRules", () => {
    it("throws for non-existent electorateId", async () => {
      pendingWithoutBnsd();
      const options = await getGovernorOptions();
      const governor = new Governor(options);

      const electorateId = 100;
      await governor
        .getElectionRules(electorateId)
        .then(
          () => fail("Expected promise to be rejected"),
          err => expect(err.message).toMatch(/no election rule found/i),
        );

      options.connection.disconnect();
    });

    it("returns the latest versions of election rules for an electorate", async () => {
      pendingWithoutBnsd();
      const options = await getGovernorOptions();
      const governor = new Governor(options);

      const electorateId = 1;
      const electionRules = await governor.getElectionRules(electorateId);
      expect(electionRules.length).toEqual(1);
      expect(electionRules[0].id).toEqual(1);
      expect(electionRules[0].version).toEqual(1);

      options.connection.disconnect();
    });
  });

  describe("getProposals", () => {
    it("can get an empty list of proposals", async () => {
      pendingWithoutBnsd();
      const options = await getGovernorOptions(HdPaths.iov(100));
      const governor = new Governor(options);

      const proposals = await governor.getProposals();
      expect(proposals.length).toEqual(0);

      options.connection.disconnect();
    });
  });

  describe("buildCreateProposalTx", () => {
    it("works for AmendProtocol", async () => {
      pendingWithoutBnsd();
      const options = await getGovernorOptions();
      const governor = new Governor(options);

      const tx = await governor.buildCreateProposalTx({
        type: ProposalType.AmendProtocol,
        title: "Switch to Proof-of-Work",
        description: "Proposal to change consensus algorithm to POW",
        startTime: new ReadonlyDate(1562164525898),
        electionRuleId: 1,
        text: "Switch to Proof-of-Work",
      });
      expect(tx).toEqual({
        kind: "bns/create_proposal",
        creator: options.identity,
        title: "Switch to Proof-of-Work",
        action: {
          kind: ActionKind.CreateTextResolution,
          resolution: "Switch to Proof-of-Work",
        },
        description: "Proposal to change consensus algorithm to POW",
        electionRuleId: 1,
        startTime: 1562164525,
        author: bnsCodec.identityToAddress(options.identity),
        fee: {
          tokens: {
            quantity: "10000000",
            fractionalDigits: 9,
            tokenTicker: "CASH" as TokenTicker,
          },
        },
      });

      options.connection.disconnect();
    });

    it("works for AddCommitteeMember", async () => {
      pendingWithoutBnsd();
      const options = await getGovernorOptions();
      const governor = new Governor(options);

      const tx = await governor.buildCreateProposalTx({
        type: ProposalType.AddCommitteeMember,
        title: "Add abcd to committee 5",
        description: "Proposal to add abcd to committee 5",
        startTime: new ReadonlyDate(1562164525898),
        electionRuleId: 1,
        committee: 5 as CommitteeId,
        address: "abcd" as Address,
        weight: 4,
      });
      expect(tx).toEqual({
        kind: "bns/create_proposal",
        creator: options.identity,
        title: "Add abcd to committee 5",
        action: {
          kind: ActionKind.UpdateElectorate,
          electorateId: 5,
          diffElectors: {
            abcd: { weight: 4 },
          },
        },
        description: "Proposal to add abcd to committee 5",
        electionRuleId: 1,
        startTime: 1562164525,
        author: bnsCodec.identityToAddress(options.identity),
        fee: {
          tokens: {
            quantity: "10000000",
            fractionalDigits: 9,
            tokenTicker: "CASH" as TokenTicker,
          },
        },
      });

      options.connection.disconnect();
    });

    it("works for RemoveCommitteeMember", async () => {
      pendingWithoutBnsd();
      const options = await getGovernorOptions();
      const governor = new Governor(options);

      const tx = await governor.buildCreateProposalTx({
        type: ProposalType.RemoveCommitteeMember,
        title: "Remove abcd from committee 5",
        description: "Proposal to remove abcd from committee 5",
        startTime: new ReadonlyDate(1562164525898),
        electionRuleId: 1,
        committee: 5 as CommitteeId,
        address: "abcd" as Address,
      });
      expect(tx).toEqual({
        kind: "bns/create_proposal",
        creator: options.identity,
        title: "Remove abcd from committee 5",
        action: {
          kind: ActionKind.UpdateElectorate,
          electorateId: 5,
          diffElectors: {
            abcd: { weight: 0 },
          },
        },
        description: "Proposal to remove abcd from committee 5",
        electionRuleId: 1,
        startTime: 1562164525,
        author: bnsCodec.identityToAddress(options.identity),
        fee: {
          tokens: {
            quantity: "10000000",
            fractionalDigits: 9,
            tokenTicker: "CASH" as TokenTicker,
          },
        },
      });

      options.connection.disconnect();
    });

    it("works for AmendElectionRuleThreshold", async () => {
      pendingWithoutBnsd();
      const options = await getGovernorOptions();
      const governor = new Governor(options);

      const tx = await governor.buildCreateProposalTx({
        type: ProposalType.AmendElectionRuleThreshold,
        title: "Amend threshold for committee 5",
        description: "Proposal to amend threshold to 2/7",
        startTime: new ReadonlyDate(1562164525898),
        electionRuleId: 1,
        targetElectionRuleId: 2,
        threshold: {
          numerator: 2,
          denominator: 7,
        },
      });
      expect(tx).toEqual({
        kind: "bns/create_proposal",
        creator: options.identity,
        title: "Amend threshold for committee 5",
        action: {
          kind: ActionKind.UpdateElectionRule,
          electionRuleId: 2,
          threshold: {
            numerator: 2,
            denominator: 7,
          },
        },
        description: "Proposal to amend threshold to 2/7",
        electionRuleId: 1,
        startTime: 1562164525,
        author: bnsCodec.identityToAddress(options.identity),
        fee: {
          tokens: {
            quantity: "10000000",
            fractionalDigits: 9,
            tokenTicker: "CASH" as TokenTicker,
          },
        },
      });

      options.connection.disconnect();
    });

    it("works for AmendElectionRuleQuorum", async () => {
      pendingWithoutBnsd();
      const options = await getGovernorOptions();
      const governor = new Governor(options);

      const tx = await governor.buildCreateProposalTx({
        type: ProposalType.AmendElectionRuleQuorum,
        title: "Amend quorum for committee 5",
        description: "Proposal to amend quorum to 2/7",
        startTime: new ReadonlyDate(1562164525898),
        electionRuleId: 1,
        targetElectionRuleId: 2,
        quorum: {
          numerator: 2,
          denominator: 7,
        },
      });
      expect(tx).toEqual({
        kind: "bns/create_proposal",
        creator: options.identity,
        title: "Amend quorum for committee 5",
        action: {
          kind: ActionKind.UpdateElectionRule,
          electionRuleId: 2,
          quorum: {
            numerator: 2,
            denominator: 7,
          },
        },
        description: "Proposal to amend quorum to 2/7",
        electionRuleId: 1,
        startTime: 1562164525,
        author: bnsCodec.identityToAddress(options.identity),
        fee: {
          tokens: {
            quantity: "10000000",
            fractionalDigits: 9,
            tokenTicker: "CASH" as TokenTicker,
          },
        },
      });

      options.connection.disconnect();
    });

    it("works for AddValidator", async () => {
      pendingWithoutBnsd();
      const options = await getGovernorOptions();
      const governor = new Governor(options);

      const tx = await governor.buildCreateProposalTx({
        type: ProposalType.AddValidator,
        title: "Add abcd as validator",
        description: "Proposal to add abcd as validator",
        startTime: new ReadonlyDate(1562164525898),
        electionRuleId: 1,
        pubkey: {
          algo: Algorithm.Ed25519,
          data: Encoding.fromHex("abcd") as PubkeyBytes,
        },
        power: 12,
      });
      expect(tx).toEqual({
        kind: "bns/create_proposal",
        creator: options.identity,
        title: "Add abcd as validator",
        action: {
          kind: ActionKind.SetValidators,
          validatorUpdates: {
            ed25519_abcd: { power: 12 },
          },
        },
        description: "Proposal to add abcd as validator",
        electionRuleId: 1,
        startTime: 1562164525,
        author: bnsCodec.identityToAddress(options.identity),
        fee: {
          tokens: {
            quantity: "10000000",
            fractionalDigits: 9,
            tokenTicker: "CASH" as TokenTicker,
          },
        },
      });

      options.connection.disconnect();
    });

    it("works for RemoveValidator", async () => {
      pendingWithoutBnsd();
      const options = await getGovernorOptions();
      const governor = new Governor(options);

      const tx = await governor.buildCreateProposalTx({
        type: ProposalType.RemoveValidator,
        title: "Remove validator abcd",
        description: "Proposal to remove validator abcd",
        startTime: new ReadonlyDate(1562164525898),
        electionRuleId: 1,
        pubkey: {
          algo: Algorithm.Ed25519,
          data: Encoding.fromHex("abcd") as PubkeyBytes,
        },
      });
      expect(tx).toEqual({
        kind: "bns/create_proposal",
        creator: options.identity,
        title: "Remove validator abcd",
        action: {
          kind: ActionKind.SetValidators,
          validatorUpdates: {
            ed25519_abcd: { power: 0 },
          },
        },
        description: "Proposal to remove validator abcd",
        electionRuleId: 1,
        startTime: 1562164525,
        author: bnsCodec.identityToAddress(options.identity),
        fee: {
          tokens: {
            quantity: "10000000",
            fractionalDigits: 9,
            tokenTicker: "CASH" as TokenTicker,
          },
        },
      });

      options.connection.disconnect();
    });

    it("works for ReleaseGuaranteeFunds", async () => {
      pendingWithoutBnsd();
      const options = await getGovernorOptions();
      const governor = new Governor(options);

      const tx = await governor.buildCreateProposalTx({
        type: ProposalType.ReleaseGuaranteeFunds,
        title: "Release guarantee funds",
        description: "Proposal to release guarantee funds",
        startTime: new ReadonlyDate(1562164525898),
        electionRuleId: 1,
        amount: {
          quantity: "2000000002",
          fractionalDigits: 9,
          tokenTicker: "CASH" as TokenTicker,
        },
      });
      expect(tx).toEqual({
        kind: "bns/create_proposal",
        creator: options.identity,
        title: "Release guarantee funds",
        action: {
          kind: ActionKind.ReleaseGuaranteeFunds,
          escrowId: guaranteeFundEscrowId,
          amount: {
            quantity: "2000000002",
            fractionalDigits: 9,
            tokenTicker: "CASH" as TokenTicker,
          },
        },
        description: "Proposal to release guarantee funds",
        electionRuleId: 1,
        startTime: 1562164525,
        author: bnsCodec.identityToAddress(options.identity),
        fee: {
          tokens: {
            quantity: "10000000",
            fractionalDigits: 9,
            tokenTicker: "CASH" as TokenTicker,
          },
        },
      });

      options.connection.disconnect();
    });
  });

  describe("createVoteTx", () => {
    it("can build a Vote transaction", async () => {
      pendingWithoutBnsd();
      const options = await getGovernorOptions();
      const governor = new Governor(options);

      const tx = await governor.buildVoteTx(5, VoteOption.Yes);
      expect(tx).toEqual({
        kind: "bns/vote",
        creator: options.identity,
        proposalId: 5,
        selection: VoteOption.Yes,
        fee: {
          tokens: {
            quantity: "10000000",
            fractionalDigits: 9,
            tokenTicker: "CASH" as TokenTicker,
          },
        },
      });

      options.connection.disconnect();
    });
  });
});