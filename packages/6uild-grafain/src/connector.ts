import { ChainConnector, ChainId } from "@iov/bcp";

import { codec } from "./codec";
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
    codec: codec,
    expectedChainId: expectedChainId,
  };
}
