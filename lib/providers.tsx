'use client';

import { ThemeProvider } from "@/components/theme-provider";
import { DynamicContextProvider } from "@/lib/dynamic";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { config, flowTestnet } from "@/lib/wagmi";


export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >   
      <DynamicContextProvider
          theme="light"
          settings={{
            environmentId:
              // replace with your own environment ID
              process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID ||
              "2762a57b-faa4-41ce-9f16-abff9300e2c9",
            walletConnectors: [EthereumWalletConnectors],
            evmNetworks: [
              {
                blockExplorerUrls: [flowTestnet.blockExplorers.default.url],
                chainId: flowTestnet.id,
                chainName: flowTestnet.name,
                iconUrls: ["https://cryptologos.cc/logos/flow-flow-logo.png"],
                name: flowTestnet.name,
                nativeCurrency: flowTestnet.nativeCurrency,
                networkId: flowTestnet.id,
                rpcUrls: flowTestnet.rpcUrls.default.http,
                vanityName: "Flow EVM Testnet",
              },
            ],
          }}
        >
        
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <DynamicWagmiConnector
              overrideWagmiConfig={true}
            >
              {children}
            </DynamicWagmiConnector>
          </QueryClientProvider>
        </WagmiProvider>
        
      </DynamicContextProvider>
    </ThemeProvider>
  );
}