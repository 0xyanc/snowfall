import { ethers } from "ethers";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useContractProvider } from "./ContractContext";

const PriceContext = createContext();

export function usePriceProvider() {
  const context = useContext(PriceContext);

  if (!context) {
    throw new Error("usePriceProvider must be used within a PriceProvider");
  }
  return context;
}

export const PriceProvider = ({ children }) => {
  const { ethUsdPriceFeedContract, uniswapV2RouterContract, uniswapV2PairContract, readLpERC20Contract } =
    useContractProvider();
  const [ethUsdPrice, _setEthUsdPrice] = useState(0);
  const ethUsdPriceRef = useRef(ethUsdPrice);
  const setEthUsdPrice = (data) => {
    ethUsdPriceRef.current = data;
    _setEthUsdPrice(data);
  };
  const [snowEthPrice, _setSnowEthPrice] = useState(0);
  const snowEthPriceRef = useRef(snowEthPrice);
  const setSnowEthPrice = (data) => {
    snowEthPriceRef.current = data;
    _setSnowEthPrice(data);
  };
  const [lpTokenPrice, setLpTokenPrice] = useState(0);

  useEffect(() => {
    getEthUsdPrice();
    getSnowEthPrice();
    getLpTokenPriceInUsd();
  }, []);

  const getLpTokenPriceInUsd = async () => {
    const [reserve0, reserve1] = await uniswapV2PairContract.getReserves();
    const reserveSnow = Number(ethers.utils.formatEther(reserve0));
    const reserveEth = Number(ethers.utils.formatEther(reserve1));
    const totalSupply = Number(ethers.utils.formatEther(await readLpERC20Contract.totalSupply()));
    const totalValueInLP = (reserveSnow * snowEthPriceRef.current + reserveEth) * ethUsdPriceRef.current;
    const lpTokenValue = totalValueInLP / totalSupply;
    setLpTokenPrice(lpTokenValue);
  };

  const getEthUsdPrice = async () => {
    const roundData = await ethUsdPriceFeedContract.latestRoundData();
    const ethUsdPrice = ethers.utils.formatEther(roundData.answer);
    setEthUsdPrice(ethUsdPrice);
  };

  const getSnowEthPrice = async () => {
    // approximation of the price from UniswapV2Router where all the liquidity is
    // check how much SNOW we get from 1 ETH
    let amountEthFromContract = await uniswapV2RouterContract.getAmountsOut(
      1, // 1 ETH
      [process.env.NEXT_PUBLIC_WETH_ERC20, process.env.NEXT_PUBLIC_SNOW_ERC20]
    );

    // add the 0.3% fee back
    const oneEthInSnow = amountEthFromContract[1].toString() / 0.997;
    const priceSnowEth = 1 / oneEthInSnow;
    setSnowEthPrice(priceSnowEth);
  };

  return <PriceContext.Provider value={{ ethUsdPrice, snowEthPrice, lpTokenPrice }}>{children}</PriceContext.Provider>;
};
