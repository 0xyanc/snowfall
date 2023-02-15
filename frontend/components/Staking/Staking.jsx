import { useContractProvider } from "@/context/ContractContext";
import { Flex, Heading, Text } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Stake from "../Stake/Stake";

const Staking = () => {
  const { address, isConnected } = useAccount();
  const {
    readSnowERC20Contract,
    writeSnowERC20Contract,
    writeSinglePoolContract,
    writeLpPoolContract,
    readLpERC20Contract,
    writeLpERC20Contract,
  } = useContractProvider();

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

  const approveSnow = async () => {
    try {
      const tx = await writeSnowERC20Contract.approve(
        process.env.NEXT_PUBLIC_SC_SINGLE_POOL,
        ethers.constants.MaxUint256
      );
      await tx.wait();
      setSnowAllowance(ethers.constants.MaxUint256);
    } catch (err) {
      console.error(err);
    }
  };

  const approveLpToken = async () => {
    try {
      const tx = await writeLpERC20Contract.approve(process.env.NEXT_PUBLIC_SC_LP_POOL, ethers.constants.MaxUint256);
      await tx.wait();
      setLpTokenAllowance(ethers.constants.MaxUint256);
    } catch (err) {
      console.error(err);
    }
  };

  const stakeSingle = async (stakeAmount, lockDurationInMonths) => {
    try {
      const amount = ethers.utils.parseUnits(stakeAmount, "ether");
      // calculate lock duration in seconds
      const unlockDate = new Date(Date.now());
      unlockDate.setMonth(unlockDate.getMonth() + lockDurationInMonths);
      const lockInSeconds = Math.floor((unlockDate - Date.now()) / 1000);
      const tx = await writeSinglePoolContract.stake(amount, lockInSeconds);
      await tx.wait();
    } catch (err) {
      console.error(err);
    }
  };

  const stakeLp = async (stakeAmount, lockDurationInMonths) => {
    try {
      const amount = ethers.utils.parseUnits(stakeAmount, "ether");
      // calculate lock duration in seconds
      const unlockDate = new Date(Date.now());
      unlockDate.setMonth(unlockDate.getMonth() + lockDurationInMonths);
      const lockInSeconds = Math.floor((unlockDate - Date.now()) / 1000);
      const tx = await writeLpPoolContract.stake(amount, lockInSeconds);
      await tx.wait();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {isConnected ? (
        <Flex p="2rem" alignItems="center" direction="column">
          <Stake pool="Snowfall" stake={stakeSingle} approve={approveSnow} allowance={snowAllowance} />
          <Stake pool="Snowfall/ETH" stake={stakeLp} approve={approveLpToken} allowance={lpTokenAllowance} />
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
