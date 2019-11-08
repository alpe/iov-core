import { ChainConnector, ChainId } from "@iov/bcp";
import { GrafainConnection } from "./grafainConnection";
/**
 * A helper to connect to a bns-based chain at a given url
 */
export declare function createGrafainConnector(
  url: string,
  expectedChainId?: ChainId,
): ChainConnector<GrafainConnection>;
