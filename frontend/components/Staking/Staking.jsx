import { useContractProvider } from "@/context/ContractContext";
import { useStakesProvider } from "@/context/StakesContext";
import {
  Button,
  Flex,
  Heading,
  Input,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Vesting from "../Vesting/Vesting";

const Staking = () => {
  const { address, isConnected } = useAccount();
  const { readSnowERC20Contract, writeSnowERC20Contract, readSinglePoolContract, writeSinglePoolContract } =
    useContractProvider();

  const [amountToStake, setAmountToStake] = useState(0);
  const [pendingRewards, setPendingRewards] = useState(0);
  const [snowAllowance, setSnowAllowance] = useState(0);
  const [lockValue, setLockValue] = useState(12);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (isConnected) {
      getPendingRewards();
      getSnowAllowance();
    }
  }, [address, isConnected]);

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
      // calculate lock duration in seconds
      const unlockDate = new Date(Date.now());
      unlockDate.setMonth(unlockDate.getMonth() + lockValue);
      const lockInSeconds = Math.floor((unlockDate - Date.now()) / 1000);
      console.log(lockInSeconds);
      const tx = await writeSinglePoolContract.stake(amount, lockInSeconds);
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
            <Flex mt="1rem" direction="column">
              <Input
                placeholder="Amount to Stake"
                value={amountToStake}
                onChange={(e) => setAmountToStake(e.target.value)}
              />
              <Slider
                mt="1rem"
                mb="1rem"
                id="slider"
                defaultValue={12}
                min={0}
                max={60}
                colorScheme="teal"
                onChange={(lock) => setLockValue(lock)}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <SliderMark value={0} mt="1" ml="-2.5" fontSize="sm">
                  0m
                </SliderMark>
                <SliderMark value={12} mt="1" ml="-2.5" fontSize="sm">
                  1y
                </SliderMark>
                <SliderMark value={24} mt="1" ml="-2.5" fontSize="sm">
                  2y
                </SliderMark>
                <SliderMark value={36} mt="1" ml="-2.5" fontSize="sm">
                  3y
                </SliderMark>
                <SliderMark value={48} mt="1" ml="-2.5" fontSize="sm">
                  4y
                </SliderMark>
                <SliderMark value={60} mt="1" ml="-2.5" fontSize="sm">
                  5y
                </SliderMark>
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <Tooltip
                  hasArrow
                  bg="teal.500"
                  color="white"
                  placement="top"
                  isOpen={showTooltip}
                  label={`${lockValue} months`}
                >
                  <SliderThumb />
                </Tooltip>
              </Slider>
              {snowAllowance === "0" ? (
                <Button mt="1rem" colorScheme="purple" onClick={() => approveSnow()}>
                  Approve
                </Button>
              ) : (
                <Button mt="1rem" colorScheme="green" onClick={() => stake()}>
                  Stake
                </Button>
              )}
            </Flex>
            <Vesting />
          </>
        ) : (
          <Text mt="1rem">Please connect your wallet to start</Text>
        )}
      </Flex>
    </>
  );
};

export default Staking;
