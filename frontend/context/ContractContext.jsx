import { createContext, useContext } from "react";
import { useContract, useProvider, useSigner } from "wagmi";
import SnowfallERC20Contract from "../abi/SnowfallERC20.json";
import IERC20Contract from "../abi/IERC20.json";
import SnowfallPoolContract from "../abi/SnowfallPool.json";
import SnowfallEthPoolContract from "../abi/SnowfallEthPool.json";

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
  let provider = useProvider();
  let { data: signer } = useSigner();

  // init read and write contracts for SNOW
  let readSnowERC20Contract = useContract({
    address: snowERC20Address,
    abi: SnowfallERC20Contract.abi,
    signerOrProvider: provider,
  });
  let writeSnowERC20Contract = useContract({
    address: snowERC20Address,
    abi: SnowfallERC20Contract.abi,
    signerOrProvider: signer,
  });

  // init read and write contracts for LP token
  let readLpERC20Contract = useContract({
    address: lpERC20Address,
    abi: IERC20Contract.abi,
    signerOrProvider: provider,
  });
  let writeLpERC20Contract = useContract({
    address: lpERC20Address,
    abi: IERC20Contract.abi,
    signerOrProvider: signer,
  });

  // init read and write contracts for the Single Pool
  let readSinglePoolContract = useContract({
    address: singlePoolAddress,
    abi: SnowfallPoolContract.abi,
    signerOrProvider: provider,
  });

  let writeSinglePoolContract = useContract({
    address: singlePoolAddress,
    abi: SnowfallPoolContract.abi,
    signerOrProvider: signer,
  });

  // init read and write contracts for the LP Pool
  let readLpPoolContract = useContract({
    address: lpPoolAddress,
    abi: SnowfallEthPoolContract.abi,
    signerOrProvider: provider,
  });

  let writeLpPoolContract = useContract({
    address: lpPoolAddress,
    abi: SnowfallEthPoolContract.abi,
    signerOrProvider: signer,
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
        provider,
        signer,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};
