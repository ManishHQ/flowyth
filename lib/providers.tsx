'use client';

import { ThemeProvider } from "@/components/theme-provider";
import { DynamicContextProvider } from "@/lib/dynamic";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { config } from "@/lib/wagmi";


export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();

  // Get Dynamic environment ID from environment variable
  const dynamicEnvironmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID;

  if (!dynamicEnvironmentId) {
    console.error('NEXT_PUBLIC_DYNAMIC_ENV_ID environment variable is required');
    // Fallback to demo environment ID for development
    console.warn('Using fallback Dynamic environment ID - please set NEXT_PUBLIC_DYNAMIC_ENV_ID in your environment');
  }

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
            environmentId: dynamicEnvironmentId || "2762a57b-faa4-41ce-9f16-abff9300e2c9",
            walletConnectors: [EthereumWalletConnectors],
          }}
        >

        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <DynamicWagmiConnector>
              {children}
            </DynamicWagmiConnector>
          </QueryClientProvider>
        </WagmiProvider>

      </DynamicContextProvider>
    </ThemeProvider>
  );
}