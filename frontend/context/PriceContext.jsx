import { createContext, useContext, useEffect, useState } from "react";
import { useContractProvider } from "./ContractContext";
import { ChainId, Fetcher, Route, Token } from "@uniswap/sdk";
import * as uniswap from "@uniswap/sdk";

const PriceContext = createContext();

export function usePriceProvider() {
  const context = useContext(PriceContext);

  if (!context) {
    throw new Error("usePriceProvider must be used within a PriceProvider");
  }
  return context;
}

export const PriceProvider = ({ children }) => {
  // ETH/USD="0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e"
  const { ethUsdPriceFeedContract } = useContractProvider();
  const [ethUsdPrice, setEthUsdPrice] = useState(0);
  const [snowEthPrice, setSnowEthPrice] = useState(0);

  useEffect(() => {
    getEthUsdPrice();
    //getSnowEthPrice();
  }, []);

  const getEthUsdPrice = async () => {
    const roundData = await ethUsdPriceFeedContract.latestRoundData();
    setEthUsdPrice(roundData.answer.toString());
  };

  const getSnowEthPrice = async () => {
    const SNOW = new Token(31337, process.env.NEXT_PUBLIC_SNOW_ERC20, 18);
    const WETH = new Token(31337, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 18);

    const pair = await Fetcher.fetchPairData(SNOW, WETH);
    // const route = new Route([pair], WETH[SNOW.chainId]);
    // console.log(route.midPrice.toSignificant(6)); // 201.306
    // console.log(route.midPrice.invert().toSignificant(6)); // 0.00496756
  };

  return <PriceContext.Provider value={{ ethUsdPrice }}>{children}</PriceContext.Provider>;
};
