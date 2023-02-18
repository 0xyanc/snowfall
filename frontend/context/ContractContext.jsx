import { createContext, useContext } from "react";
import { useContract, useProvider, useSigner } from "wagmi";
import SnowfallERC20Contract from "../abi/SnowfallERC20.json";
import IERC20Contract from "../abi/IERC20.json";
import SnowfallPoolContract from "../abi/SnowfallPool.json";
import SnowfallEthPoolContract from "../abi/SnowfallEthPool.json";
import AggregatorV3Interface from "../abi/AggregatorV3Interface.json";
import IUniswapV2Router02 from "../abi/IUniswapV2Router02.json";
import IUniswapV2Pair from "../abi/IUniswapV2Pair.json";

const ContractContext = createContext();

export function useContractProvider() {
  const context = useContext(ContractContext);

  if (!context) {
    throw new Error("useContractProvider must be used within a ContractProvider");
  }
  return context;
}

export const ContractProvider = ({ children }) => {
  const snowERC20Address = process.env.NEXT_PUBLIC_SNOW_ERC20;
  const lpERC20Address = process.env.NEXT_PUBLIC_LP_ERC20;
  const singlePoolAddress = process.env.NEXT_PUBLIC_SC_SINGLE_POOL;
  const lpPoolAddress = process.env.NEXT_PUBLIC_SC_LP_POOL;
  const ethUsdPriceFeedAddress = process.env.NEXT_PUBLIC_ETH_USD_PRICE_FEED;
  const uniswapV2RouterAddress = process.env.NEXT_PUBLIC_SC_UNISWAP_V2_ROUTER;
  let provider = useProvider();
  let { data: signer } = useSigner();

  // init read and write contracts for SNOW
  const readSnowERC20Contract = useContract({
    address: snowERC20Address,
    abi: SnowfallERC20Contract.abi,
    signerOrProvider: provider,
  });
  const writeSnowERC20Contract = useContract({
    address: snowERC20Address,
    abi: SnowfallERC20Contract.abi,
    signerOrProvider: signer,
  });

  // init read and write contracts for LP token
  const readLpERC20Contract = useContract({
    address: lpERC20Address,
    abi: IERC20Contract.abi,
    signerOrProvider: provider,
  });
  const writeLpERC20Contract = useContract({
    address: lpERC20Address,
    abi: IERC20Contract.abi,
    signerOrProvider: signer,
  });

  // init read and write contracts for the Single Pool
  const readSinglePoolContract = useContract({
    address: singlePoolAddress,
    abi: SnowfallPoolContract.abi,
    signerOrProvider: provider,
  });

  const writeSinglePoolContract = useContract({
    address: singlePoolAddress,
    abi: SnowfallPoolContract.abi,
    signerOrProvider: signer,
  });

  // init read and write contracts for the LP Pool
  const readLpPoolContract = useContract({
    address: lpPoolAddress,
    abi: SnowfallEthPoolContract.abi,
    signerOrProvider: provider,
  });

  const writeLpPoolContract = useContract({
    address: lpPoolAddress,
    abi: SnowfallEthPoolContract.abi,
    signerOrProvider: signer,
  });

  const ethUsdPriceFeedContract = useContract({
    address: ethUsdPriceFeedAddress,
    abi: AggregatorV3Interface.abi,
    signerOrProvider: provider,
  });

  const uniswapV2RouterContract = useContract({
    address: uniswapV2RouterAddress,
    abi: IUniswapV2Router02.abi,
    signerOrProvider: provider,
  });

  const uniswapV2PairContract = useContract({
    address: lpERC20Address,
    abi: IUniswapV2Pair.abi,
    signerOrProvider: provider,
  });

  return (
    <ContractContext.Provider
      value={{
        readSnowERC20Contract,
        writeSnowERC20Contract,
        readLpERC20Contract,
        writeLpERC20Contract,
        readSinglePoolContract,
        writeSinglePoolContract,
        readLpPoolContract,
        writeLpPoolContract,
        ethUsdPriceFeedContract,
        uniswapV2RouterContract,
        uniswapV2PairContract,
        provider,
        signer,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};
