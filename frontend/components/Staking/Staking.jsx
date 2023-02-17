import { useContractProvider } from "@/context/ContractContext";
import { Flex, Heading, Text } from "@chakra-ui/react";
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
      <Flex w="100%" direction="column">
        <Flex direction="column" alignItems="center">
          <Heading>Staking on Snowfall</Heading>
          <Text mt="1rem" fontSize="sm">
            There are 2 pools available to stake on: the <Text as="b">Snowfall Pool</Text> and the{" "}
            <Text as="b">Snowfall/ETH Pool</Text>. <br /> You can lock your tokens for a longer duration (up to 5 years)
            to get a higher staking weight and improve your rewards. <br /> The rewards can be claimed at anytime and
            are subject to a <Text as="b">one year lock</Text> in the Snowfall Pool.
          </Text>
        </Flex>
        {isConnected ? (
          <Flex p="2rem" justifyContent="space-evenly">
            <Stake
              pool="SNOW"
              allowance={snowAllowance}
              setSnowAllowance={setSnowAllowance}
              setLpTokenAllowance={setLpTokenAllowance}
            />
            <Stake
              pool="SNOW/ETH"
              allowance={lpTokenAllowance}
              setSnowAllowance={setSnowAllowance}
              setLpTokenAllowance={setLpTokenAllowance}
            />
          </Flex>
        ) : (
          <Flex justifyContent="center">
            <Heading fontSize="md" mt="5rem">
              Please connect your wallet to start
            </Heading>
          </Flex>
        )}
      </Flex>
    </>
  );
};

export default Staking;
