import { useContractProvider } from "@/context/ContractContext";
import { Divider, Flex, Heading } from "@chakra-ui/react";
import { ResponsiveBar } from "@nivo/bar";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import PendingReward from "../PendingReward/PendingReward";
import rewardsData from "../../util/rewards.json";

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
            <Flex justifyContent="center">
              <Heading fontSize="md" mt="5rem">
                Please connect your wallet to start
              </Heading>
            </Flex>
          )}
        </Flex>
        <Divider />
        <Flex mt="1rem" h="400px" w="90%" direction="column">
          <Flex justifyContent="center">
            <Heading as="h3">Staking rewards over time</Heading>
          </Flex>
          <ResponsiveBar
            data={rewardsData}
            indexBy="date"
            keys={["amount"]}
            margin={{ top: 50, right: 50, bottom: 50, left: 60 }}
            padding={0.2}
            valueScale={{ type: "linear" }}
            colors="teal"
            animate={true}
            enableLabel={false}
            gridXValues={[]}
            axisTop={null}
            axisRight={null}
            axisBottom={null}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
            }}
          />
        </Flex>
      </Flex>
    </>
  );
};

export default Dashboard;
