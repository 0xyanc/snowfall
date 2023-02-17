import { useContractProvider } from "@/context/ContractContext";
import { Flex, Heading } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Stake from "../Stake/Stake";

const Staking = () => {
  const { address, isConnected } = useAccount();
  const { readSnowERC20Contract, readLpERC20Contract } = useContractProvider();

  const [snowAllowance, setSnowAllowance] = useState(0);
  const [lpTokenAllowance, setLpTokenAllowance] = useState(0);

  useEffect(() => {
    if (isConnected) {
      getSnowAllowance();
      getLpTokenAllowance();
    }
  }, [address, isConnected]);

  const getSnowAllowance = async () => {
    const allowance = await readSnowERC20Contract.allowance(address, process.env.NEXT_PUBLIC_SC_SINGLE_POOL);
    setSnowAllowance(allowance.toString());
  };

  const getLpTokenAllowance = async () => {
    const allowance = await readLpERC20Contract.allowance(address, process.env.NEXT_PUBLIC_SC_LP_POOL);
    setLpTokenAllowance(allowance.toString());
  };

  return (
    <>
      {isConnected ? (
        <Flex w="100%" p="2rem" justifyContent="space-evenly">
          <Stake
            pool="Snowfall"
            allowance={snowAllowance}
            setSnowAllowance={setSnowAllowance}
            setLpTokenAllowance={setLpTokenAllowance}
          />
          <Stake
            pool="Snowfall/ETH"
            allowance={lpTokenAllowance}
            setSnowAllowance={setSnowAllowance}
            setLpTokenAllowance={setLpTokenAllowance}
          />
        </Flex>
      ) : (
        <Flex m="auto">
          <Heading mt="1rem">Please connect your wallet to start</Heading>
        </Flex>
      )}
    </>
  );
};

export default Staking;
