import { useContractProvider } from "@/context/ContractContext";
import { Button, Flex, Heading, Text } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import PendingReward from "../PendingReward/PendingReward";

const Dashboard = () => {
  const { address, isConnected } = useAccount();
  const { readSinglePoolContract, writeSinglePoolContract, readLpPoolContract, writeLpPoolContract } =
    useContractProvider();

  const [singlePendingRewards, setSinglePendingRewards] = useState(0);
  const [lpPendingRewards, setLpPendingRewards] = useState(0);

  useEffect(() => {
    if (isConnected) {
      getSinglePendingRewards();
      getLpPendingRewards();
    }
  }, [address, isConnected]);

  const getSinglePendingRewards = async () => {
    const pendingRewards = await readSinglePoolContract.pendingRewards(address);
    const formattedPendingRewards = ethers.utils.formatEther(pendingRewards);
    console.log(formattedPendingRewards);
    setSinglePendingRewards(formattedPendingRewards);
  };

  const getLpPendingRewards = async () => {
    const pendingRewards = await readLpPoolContract.pendingRewards(address);
    const formattedPendingRewards = ethers.utils.formatEther(pendingRewards);
    setLpPendingRewards(formattedPendingRewards);
  };

  const claimSingleRewards = async () => {
    try {
      const tx = await writeSinglePoolContract.claimYieldRewards();
      await tx.wait();
    } catch (err) {
      console.error(err);
    }
  };

  const claimLpRewards = async () => {
    try {
      const tx = await writeLpPoolContract.claimYieldRewards();
      await tx.wait();
    } catch (err) {
      console.error(err);
    }
  };

  const claimBothRewards = async () => {
    try {
      const txSingle = await writeSinglePoolContract.claimYieldRewards();
      const txLp = await writeLpPoolContract.claimYieldRewards();
      await txSingle.wait();
      await txLp.wait();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Flex p="2rem" alignItems="center" direction="column">
        <Heading>Snowfall Staking DApp</Heading>
        {isConnected ? (
          <>
            <PendingReward
              heading="Total Pending Rewards"
              pendingRewards={singlePendingRewards}
              claimRewards={claimBothRewards}
            />
            <PendingReward
              heading="Single Pool Pending Rewards"
              pendingRewards={singlePendingRewards}
              claimRewards={claimSingleRewards}
            />
            <PendingReward
              heading="LP Pool Pending Rewards"
              pendingRewards={lpPendingRewards}
              claimRewards={claimLpRewards}
            />
          </>
        ) : (
          <Text mt="1rem">Please connect your wallet to start</Text>
        )}
      </Flex>
    </>
  );
};

export default Dashboard;
