import { useContractProvider } from "@/context/ContractContext";
import {
  Button,
  Flex,
  Heading,
  Input,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Stake from "../Stake/Stake";

const Staking = () => {
  const { address, isConnected } = useAccount();
  const {
    readSnowERC20Contract,
    writeSnowERC20Contract,
    readSinglePoolContract,
    writeSinglePoolContract,
    readLpPoolContract,
    writeLpPoolContract,
    provider,
  } = useContractProvider();

  const [stakes, setStakes] = useState([]);
  const [amountToStake, setAmountToStake] = useState(0);
  const [pendingRewards, setPendingRewards] = useState(0);
  const [snowAllowance, setSnowAllowance] = useState(0);

  useEffect(() => {
    loadStakingEvents();
  }, []);

  useEffect(() => {
    if (isConnected) {
      getPendingRewards();
      getSnowAllowance();
    }
  }, [address, isConnected]);

  const loadStakingEvents = async () => {
    const contractDeployBlock = parseInt(process.env.NEXT_PUBLIC_SC_DEPLOY_BLOCK);
    const currentBlockNumber = await provider.getBlockNumber();
    // arrays containing the events
    let singlePoolStakeEvents = [];
    let lpPoolStakeEvents = [];
    let singlePoolUnstakeEvents = [];
    let lpPoolUnstakeEvents = [];
    // the filters needed to retrieve the stake and unstake events
    const singlePoolStakeFilter = readSinglePoolContract.filters.Staked(address);
    const lpPoolStakeFilter = readSinglePoolContract.filters.Staked(address);
    const singlePoolUnstakeFilter = readSinglePoolContract.filters.Unstake(address);
    const lpPoolUnstakeFilter = readSinglePoolContract.filters.Unstake(address);
    // retrieve all events by batch of 3000 blocks since SC deployment
    for (let startBlock = contractDeployBlock; startBlock < currentBlockNumber; startBlock += 3000) {
      const endBlock = Math.min(currentBlockNumber, startBlock + 2999);

      const allSinglePoolStakeEvents = await readSinglePoolContract.queryFilter(
        singlePoolStakeFilter,
        startBlock,
        endBlock
      );
      const allLpPoolStakeEvents = await readLpPoolContract.queryFilter(lpPoolStakeFilter, startBlock, endBlock);
      const allSinglePoolUnstakeEvents = await readSinglePoolContract.queryFilter(
        singlePoolUnstakeFilter,
        startBlock,
        endBlock
      );
      const allLpPoolUnstakeEvents = await readLpPoolContract.queryFilter(lpPoolUnstakeFilter, startBlock, endBlock);
      singlePoolStakeEvents = [...singlePoolStakeEvents, ...allSinglePoolStakeEvents];
      lpPoolStakeEvents = [...lpPoolStakeEvents, ...allLpPoolStakeEvents];
      singlePoolUnstakeEvents = [...singlePoolUnstakeEvents, ...allSinglePoolUnstakeEvents];
      lpPoolUnstakeEvents = [...lpPoolUnstakeEvents, ...allLpPoolUnstakeEvents];
    }
    let stakeList = [];
    // add all the single pool stakes to the list
    singlePoolStakeEvents.map((event) => {
      stakeList.push({
        account: event.args.account,
        id: event.args.stakeId.toString() + "-Single",
        value: ethers.utils.formatEther(event.args.value.toString()),
        lockedUntil: new Date(event.args.lockedUntil.toString() * 1000),
        pool: "Single",
      });
    });
    // remove the single pool unstakes from the list
    singlePoolUnstakeEvents.map((event) => {
      const index = stakeList.findIndex((element) => element.id === event.args.stakeId.toString() + "-Single");
      stakeList.splice(index, 1);
    });
    // add all the lp pool stakes to the list
    lpPoolStakeEvents.map((event) => {
      stakeList.push({
        account: event.args.account,
        id: event.args.stakeId.toString() + "-LP",
        value: ethers.utils.formatEther(event.args.value.toString()),
        lockedUntil: new Date(event.args.lockedUntil.toString() * 1000),
        pool: "LP",
      });
    });
    // remove the single pool unstakes from the list
    lpPoolUnstakeEvents.map((event) => {
      const index = stakeList.findIndex((element) => element.id === event.args.stakeId.toString() + "-LP");
      stakeList.splice(index, 1);
    });
    // sort the list by unlock date
    stakeList.sort((a, b) => a.lockedUntil - b.lockedUntil);
    setStakes(stakeList);
  };

  const getSnowAllowance = async () => {
    const allowance = await readSnowERC20Contract.allowance(address, process.env.NEXT_PUBLIC_SC_SINGLE_POOL);
    setSnowAllowance(allowance.toString());
  };

  const getPendingRewards = async () => {
    const pendingRewards = await readSinglePoolContract.pendingRewards(address);
    const formattedPendingRewards = ethers.utils.formatEther(pendingRewards);
    setPendingRewards(formattedPendingRewards);
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

  const stake = async () => {
    try {
      const amount = ethers.utils.parseUnits(amountToStake, "ether");
      // lock duration in seconds
      const tx = await writeSinglePoolContract.stake(amount, 10);
      await tx.wait();
    } catch (err) {
      console.error(err);
    }
  };

  const claimRewards = async () => {
    try {
      const tx = await writeSinglePoolContract.claimYieldRewards();
      await tx.wait();
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
            <Text>You have {pendingRewards} SNOW rewards to claim.</Text>
            <Button colorScheme="purple" onClick={() => getPendingRewards()}>
              Refresh
            </Button>
            <Button colorScheme="purple" onClick={() => claimRewards()}>
              Claim
            </Button>
            <Heading mt="2rem">Stake</Heading>
            <Flex mt="1rem">
              <Input
                placeholder="Amount to Stake"
                value={amountToStake}
                onChange={(e) => setAmountToStake(e.target.value)}
              />
              {snowAllowance === "0" ? (
                <Button colorScheme="purple" onClick={() => approveSnow()}>
                  Approve
                </Button>
              ) : (
                <Button colorScheme="green" onClick={() => stake()}>
                  Stake
                </Button>
              )}
            </Flex>
            <Text as="b">Registered Proposals</Text>
            <Flex
              width="100%"
              direction={["column", "column", "row", "row"]}
              alignItems="center"
              flexWrap="wrap"
            ></Flex>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Pool</Th>
                    <Th isNumeric>Amount</Th>
                    <Th>Unlock date</Th>
                    <Th>Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {stakes.length !== 0 ? (
                    stakes.map((stake) => {
                      return <Stake stake={stake} key={stake.id} />;
                    })
                  ) : (
                    <></>
                  )}
                </Tbody>
              </Table>
            </TableContainer>

            {/* {proposalsRef.current.length !== 0 ? (
              proposalsRef.current.map((proposal) => {
                return (
                  <Proposal
                    proposal={proposal}
                    key={proposal.id}
                    hasVoted={voter.hasVoted}
                    isRegistered={voter.isRegistered}
                  />
                );
              })
            ) */}
            {/* <Heading mt="2rem">Withdraw</Heading>
            <Flex mt="1rem">
              <Input placeholder="Amount in ETH" onChange={(e) => setAmountToWithdraw(e.target.value)}></Input>
              <Button colorScheme="purple" onClick={() => withdrawEther()}>
                Withdraw
              </Button>
            </Flex> */}
            {/* <Heading mt="2rem">Last Events</Heading>
            <Events events={events} mt="1rem" /> */}
          </>
        ) : (
          <Text mt="1rem">Please connect your wallet to start</Text>
        )}
      </Flex>
    </>
  );
};

export default Staking;
