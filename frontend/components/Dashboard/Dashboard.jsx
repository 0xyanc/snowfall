import { useContractProvider } from "@/context/ContractContext";
import { Flex, Heading, Text } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import PendingReward from "../PendingReward/PendingReward";

const Dashboard = () => {
  const { address, isConnected } = useAccount();
  const { readSinglePoolContract, writeSinglePoolContract, readLpPoolContract, writeLpPoolContract, provider } =
    useContractProvider();

  const [singlePendingRewards, setSinglePendingRewards] = useState(0);
  const [lpPendingRewards, setLpPendingRewards] = useState(0);

  useEffect(() => {
    if (isConnected) {
      getSinglePendingRewards();
      getLpPendingRewards();
      subscribeToSyncedEvents();
    }
    return () => {
      readSinglePoolContract.off("Synced", updatePendingRewards);
      readLpPoolContract.off("Synced", updatePendingRewards);
    };
  }, [address, isConnected]);

  const subscribeToSyncedEvents = async () => {
    const startBlockNumber = await provider.getBlockNumber();
    readSinglePoolContract.on("Synced", (event) => {
      updatePendingRewards(event, startBlockNumber);
    });
    readLpPoolContract.on("Synced", (event) => {
      updatePendingRewards(event);
    });
  };

  const updatePendingRewards = (event, startBlockNumber) => {
    if (event.blockNumber <= startBlockNumber) return;
    getSinglePendingRewards();
    getLpPendingRewards();
  };
  const getSinglePendingRewards = async () => {
    const pendingRewards = await readSinglePoolContract.pendingRewards(address);
    const formattedPendingRewards = ethers.utils.formatEther(pendingRewards);
    setSinglePendingRewards(formattedPendingRewards);
  };

  const getLpPendingRewards = async () => {
    const pendingRewards = await readLpPoolContract.pendingRewards(address);
    const formattedPendingRewards = ethers.utils.formatEther(pendingRewards);
    setLpPendingRewards(formattedPendingRewards);
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
      <Flex direction="column" w="100%" alignItems="center">
        <Heading>Snowfall Staking DApp</Heading>
        <Flex p="1rem">
          {isConnected ? (
            <>
              {/* <PendingReward
              heading="Total Pending Rewards"
              pendingRewards={}
              claimRewards={claimBothRewards}
            /> */}
              <PendingReward pool="Single" pendingRewards={singlePendingRewards} />
              <PendingReward pool="LP" pendingRewards={lpPendingRewards} />
            </>
          ) : (
            <Text mt="1rem">Please connect your wallet to start</Text>
          )}
        </Flex>
      </Flex>
    </>
  );
};

export default Dashboard;
