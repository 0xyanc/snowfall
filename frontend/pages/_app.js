import '@/styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css';

import {
  getDefaultWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import { hardhat } from 'wagmi/chains';
// import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { ChakraProvider } from '@chakra-ui/react';
import Layout from '@/components/Layout/Layout';
import { ContractProvider } from '@/context/ContractContext';
import { StakesProvider } from '@/context/StakesContext';
import { AccountProvider } from '@/context/AccountContext';
const { chains, provider } = configureChains(
  [hardhat],
  [
    // alchemyProvider({ apiKey: process.env.ALCHEMY_ID }),
    publicProvider()
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'Snowfall Staking App',
  chains
});

const wagmiClient = createClient({
  autoConnect: false,
  connectors,
  provider
})

export default function App({ Component, pageProps }) {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <ChakraProvider>
          <AccountProvider>
            <ContractProvider>
              <StakesProvider>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </StakesProvider>
            </ContractProvider>
          </AccountProvider>
        </ChakraProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
