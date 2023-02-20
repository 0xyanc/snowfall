import { useContractProvider } from "@/context/ContractContext";
import { Box, Card, CardBody, CardHeader, Divider, Flex, Heading, Text } from "@chakra-ui/react";
import { ResponsiveBar } from "@nivo/bar";
import { ethers } from "ethers";
import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import PendingReward from "../PendingReward/PendingReward";
import rewardsData from "../../util/rewards.json";

const Dashboard = () => {
  const { address, isConnected } = useAccount();
  const { readSinglePoolContract, readLpPoolContract, provider } = useContractProvider();

  const [singlePendingRewards, setSinglePendingRewards] = useState(0);
  const [lpPendingRewards, setLpPendingRewards] = useState(0);
  const [totalClaimedRewards, _setTotalClaimedRewards] = useState(0);
  const totalClaimedRewardsRef = useRef(totalClaimedRewards);
  const setTotalClaimedRewards = (data) => {
    totalClaimedRewardsRef.current = data;
    _setTotalClaimedRewards(data);
  };

  useEffect(() => {
    if (isConnected) {
      getSinglePendingRewards();
      getLpPendingRewards();
      loadClaimedRewardEvents();
      subscribeToSyncedEvents();
      subscribeToClaimedRewardsEvents();
    }
    return () => {
      readSinglePoolContract.off("Synced", updatePendingRewards);
      readLpPoolContract.off("Synced", updatePendingRewards);
      readSinglePoolContract.off("ClaimYieldRewards", updateTotalClaimedRewards);
      readLpPoolContract.off("ClaimYieldRewards", updateTotalClaimedRewards);
    };
  }, [address, isConnected]);

  const subscribeToClaimedRewardsEvents = async () => {
    const startBlockNumber = await provider.getBlockNumber();
    readSinglePoolContract.on("ClaimYieldRewards", (account, value, event) =>
      updateTotalClaimedRewards(account, value, event, startBlockNumber)
    );
    readLpPoolContract.on("ClaimYieldRewards", (account, value, event) =>
      updateTotalClaimedRewards(account, value, event, startBlockNumber)
    );
  };

  // create a Stake object and add it to the list
  const updateTotalClaimedRewards = (account, value, event, startBlockNumber) => {
    if (event.blockNumber <= startBlockNumber) return;
    if (account === address) {
      let claimed = totalClaimedRewardsRef.current;
      claimed += Number(ethers.utils.formatEther(value));
      setTotalClaimedRewards(claimed);
    }
  };

  const loadClaimedRewardEvents = async () => {
    const contractDeployBlock = parseInt(process.env.NEXT_PUBLIC_SC_DEPLOY_BLOCK);
    const currentBlockNumber = await provider.getBlockNumber();
    let totalRewards = 0;
    // retrieve all events by batch of 3000 blocks since SC deployment
    for (let startBlock = contractDeployBlock; startBlock < currentBlockNumber; startBlock += 3000) {
      const endBlock = Math.min(currentBlockNumber, startBlock + 2999);
      const allSinglePoolClaimEvents = await readSinglePoolContract.queryFilter(
        "ClaimYieldRewards",
        startBlock,
        endBlock
      );
      const allLpPoolClaimEvents = await readLpPoolContract.queryFilter("ClaimYieldRewards", startBlock, endBlock);
      allSinglePoolClaimEvents.map((event) => {
        totalRewards += Number(ethers.utils.formatEther(event.args.value));
      });
      allLpPoolClaimEvents.map((event) => {
        totalRewards += Number(ethers.utils.formatEther(event.args.value));
      });
    }
    setTotalClaimedRewards(totalRewards);
  };

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

  return (
    <>
      <Flex direction="column" w="100%" alignItems="center">
        <Heading>Snowfall Staking DApp</Heading>

        {isConnected ? (
          <>
            <Flex direction="column" alignItems="center" w="60%">
              <Flex p="1rem" justifyContent="center">
                <PendingReward pool="Single" pendingRewards={singlePendingRewards} />
                <PendingReward pool="LP" pendingRewards={lpPendingRewards} />
              </Flex>
              <Flex justifyContent="center">
                <Card>
                  <CardHeader>
                    <Heading size="md">Total Claimed Rewards</Heading>
                  </CardHeader>
                  <CardBody>
                    <Box>
                      <Text>
                        You have claimed <Text as="b"> {Number(totalClaimedRewards).toFixed(2)} </Text> SNOW in total.
                      </Text>
                    </Box>
                  </CardBody>
                </Card>
              </Flex>
            </Flex>
          </>
        ) : (
          <Flex justifyContent="center">
            <Heading fontSize="md" mt="2rem">
              Please connect your wallet to start
            </Heading>
          </Flex>
        )}
        <Divider mt="2rem" />
        <Flex mt="1rem" h="400px" w="90%" direction="column">
          <Flex alignItems="center" direction="column">
            <Heading as="h3">Staking rewards over time</Heading>
            <Text mt="0.5rem">Staking rewards increase by 1% every week</Text>
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
