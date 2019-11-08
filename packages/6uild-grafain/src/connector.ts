import { ChainConnector, ChainId } from "@iov/bcp";

import { grafainCodec } from "./grafainCodec";
import { GrafainConnection } from "./grafainConnection";

/**
 * A helper to connect to a grafain-based chain at a given url
 */
export function createGrafainConnector(
  url: string,
  expectedChainId?: ChainId,
): ChainConnector<GrafainConnection> {
  return {
    establishConnection: async () => GrafainConnection.establish(url),
    codec: grafainCodec,
    expectedChainId: expectedChainId,
  };
}
