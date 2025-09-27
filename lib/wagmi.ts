
import { http, createConfig } from "wagmi";
import { defineChain } from "viem";

export const flowTestnet = defineChain({
  id: 545,
  name: 'Flow EVM Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Flow',
    symbol: 'FLOW',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.evm.nodes.onflow.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'FlowScan',
      url: 'https://evm-testnet.flowscan.io',
    },
  },
  testnet: true,
});

export const config = createConfig({
  // Using only Flow EVM Testnet
  chains: [flowTestnet],
  multiInjectedProviderDiscovery: false,
  ssr: true,
  transports: {
    [flowTestnet.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
