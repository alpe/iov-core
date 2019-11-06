import { Address, Algorithm, PubkeyBytes } from "@iov/bcp";
import { Encoding } from "@iov/encoding";

import { decodeCosmosAddress, isValidAddress, pubkeyToAddress } from "./address";

const { fromBase64, fromHex } = Encoding;

describe("address", () => {
  // Bech32 encoding/decoding data generated using https://github.com/bitcoinjs/bech32
  describe("decodeCosmosAddress", () => {
    it("throws for invalid prefix", () => {
      expect(() =>
        decodeCosmosAddress("cosmot10q82zkzzmaku5lazhsvxv7hsg4ntpuhd8j5266" as Address),
      ).toThrowError(/invalid bech32 prefix/i);
    });

    it("throws for invalid length", () => {
      expect(() =>
        decodeCosmosAddress("cosmos1alcmj76e030g83fedrnx8lvsythhg70zlct4cwx3" as Address),
      ).toThrowError(/invalid data length/i);
    });

    it("decodes valid addresses", () => {
      expect(decodeCosmosAddress("cosmos1pkptre7fdkl6gfrzlesjjvhxhlc3r4gmmk8rs6" as Address)).toEqual({
        prefix: "cosmos",
        data: fromHex("0d82b1e7c96dbfa42462fe612932e6bff111d51b"),
      });
    });
  });

  describe("isValidAddress", () => {
    it("accepts valid addresses", () => {
      expect(isValidAddress("cosmos1pkptre7fdkl6gfrzlesjjvhxhlc3r4gmmk8rs6")).toEqual(true);
      expect(isValidAddress("cosmosvalcons10q82zkzzmaku5lazhsvxv7hsg4ntpuhdwadmss")).toEqual(true);
      expect(isValidAddress("cosmosvaloper17mggn4znyeyg25wd7498qxl7r2jhgue8u4qjcq")).toEqual(true);
    });

    it("rejects invalid addresses", () => {
      // Bad size
      expect(isValidAddress("cosmos10q82zkzzmaku5lazhsvxv7hsg4ntpuhh8289f")).toEqual(false);
      // Bad checksum
      expect(isValidAddress("cosmos1pkptre7fdkl6gfrzlesjjvhxhlc3r4gmmk8rs7")).toEqual(false);
      // Bad prefix
      expect(isValidAddress("cosmot10q82zkzzmaku5lazhsvxv7hsg4ntpuhd8j5266")).toEqual(false);
    });
  });

  describe("pubkeyToAddress", () => {
    it("works for Secp256k1 compressed", () => {
      const prefix = "cosmos";
      const pubkey = {
        algo: Algorithm.Secp256k1,
        data: fromBase64("AtQaCqFnshaZQp6rIkvAPyzThvCvXSDO+9AzbxVErqJP") as PubkeyBytes,
      };
      expect(pubkeyToAddress(pubkey, prefix)).toEqual("cosmos1h806c7khnvmjlywdrkdgk2vrayy2mmvf9rxk2r");
    });

    it("works for Secp256k1 uncompressed", () => {
      const prefix = "cosmos";
      const pubkey = {
        algo: Algorithm.Secp256k1,
        data: fromBase64(
          "BE8EGB7ro1ORuFhjOnZcSgwYlpe0DSFjVNUIkNNQxwKQE7WHpoHoNswYeoFkuYpYSKK4mzFzMV/dB0DVAy4lnNU=",
        ) as PubkeyBytes,
      };
      expect(pubkeyToAddress(pubkey, prefix)).toEqual("cosmos1pkptre7fdkl6gfrzlesjjvhxhlc3r4gmmk8rs6");
    });
  });
});
