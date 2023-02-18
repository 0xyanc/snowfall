import { useContractProvider } from "@/context/ContractContext";
import { usePriceProvider } from "@/context/PriceContext";
import { InfoOutlineIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Card,
  CardBody,
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
  useToast,
} from "@chakra-ui/react";
import { ethers } from "ethers";
import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";

const Stake = ({ pool, allowance, setSnowAllowance, setLpTokenAllowance }) => {
  const { address, isConnected } = useAccount();
  const {
    readSinglePoolContract,
    readLpPoolContract,
    writeSinglePoolContract,
    writeLpPoolContract,
    readSnowERC20Contract,
    readLpERC20Contract,
    writeSnowERC20Contract,
    writeLpERC20Contract,
  } = useContractProvider();
  const { ethUsdPrice, snowEthPrice, lpTokenPrice } = usePriceProvider();

  const [amountToStake, setAmountToStake] = useState("");
  const [lockValue, setLockValue] = useState(12);
  const [showTooltip, setShowTooltip] = useState(false);
  const [waitTransaction, setWaitTransaction] = useState(false);
  const [balanceOf, setBalanceOf] = useState(0);
  const [rewardPerSec, _setRewardPerSec] = useState(0);
  const rewardPerSecRef = useRef(rewardPerSec);
  const setRewardPerSec = (data) => {
    rewardPerSecRef.current = data;
    _setRewardPerSec(data);
  };
  const [totalPoolWeightedShares, _setTotalPoolWeightedShares] = useState(0);
  const totalPoolWeightedSharesRef = useRef(totalPoolWeightedShares);
  const setTotalPoolWeightedShares = (data) => {
    totalPoolWeightedSharesRef.current = data;
    _setTotalPoolWeightedShares(data);
  };
  const [totalValueLocked, _setTotalValueLocked] = useState(0);
  const totalValueLockedRef = useRef(totalValueLocked);
  const setTotalValueLocked = (data) => {
    totalValueLockedRef.current = data;
    _setTotalValueLocked(data);
  };
  const [apr, setApr] = useState(0);
  const toast = useToast();

  useEffect(() => {
    if (isConnected) {
      updateInfo();
    }
  }, [isConnected, address]);

  const updateInfo = () => {
    getBalanceOf();
    getPoolInfo();
  };

  const getPoolInfo = async () => {
    let contract;
    let tokenPrice;
    if (pool === "SNOW") {
      contract = readSinglePoolContract;
      tokenPrice = snowEthPrice * ethUsdPrice;
    } else {
      contract = readLpPoolContract;
      tokenPrice = lpTokenPrice;
    }
    const rewardPerSec = await contract.rewardPerSecond();
    const totalPoolWeightedShares = await contract.totalPoolWeightedShares();
    const totalPoolTokens = ethers.utils.formatEther(await contract.totalTokensInPool());
    const tvl = totalPoolTokens * tokenPrice;
    setTotalValueLocked(tvl);
    setTotalPoolWeightedShares(Number(ethers.utils.formatEther(totalPoolWeightedShares)));
    setRewardPerSec(Number(ethers.utils.formatEther(rewardPerSec)));
    calculateApr(lockValue);
  };

  const getBalanceOf = async () => {
    let tokenContract;
    if (pool === "SNOW") {
      tokenContract = readSnowERC20Contract;
    } else {
      tokenContract = readLpERC20Contract;
    }
    const balanceOf = await tokenContract.balanceOf(address);
    const formattedBalanceOf = ethers.utils.formatEther(balanceOf);
    setBalanceOf(formattedBalanceOf);
  };

  const approve = async () => {
    try {
      setWaitTransaction(true);
      let tx;
      if (pool === "SNOW") {
        tx = await writeSnowERC20Contract.approve(process.env.NEXT_PUBLIC_SC_SINGLE_POOL, ethers.constants.MaxUint256);
        await tx.wait();
        setSnowAllowance(ethers.constants.MaxUint256);
      } else {
        tx = await writeLpERC20Contract.approve(process.env.NEXT_PUBLIC_SC_LP_POOL, ethers.constants.MaxUint256);
        await tx.wait();
        setLpTokenAllowance(ethers.constants.MaxUint256);
      }
      toast({
        title: "Approved allowance",
        description: "You can now stake your tokens",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error approving tokens",
        description: "An error occurred while approving tokens",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setWaitTransaction(false);
    }
  };

  const stake = async () => {
    try {
      setWaitTransaction(true);
      let contract;
      if (pool === "SNOW") {
        contract = writeSinglePoolContract;
      } else {
        contract = writeLpPoolContract;
      }
      const amount = ethers.utils.parseUnits(amountToStake, "ether");
      // calculate lock duration in seconds
      const unlockDate = new Date(Date.now());
      unlockDate.setMonth(unlockDate.getMonth() + lockValue);
      // minimum lock of 1 second
      const minLockDuration = 1;
      const lockInSeconds = Math.floor((unlockDate - Date.now()) / 1000) + minLockDuration;
      const tx = await contract.stake(amount, lockInSeconds);
      await tx.wait();
      updateInfo();
      calculateApr(lockValue);
      toast({
        title: "Staked tokens",
        description: "You have successfully staked your tokens",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error staking tokens",
        description: "An error occurred while staking tokens",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setWaitTransaction(false);
      setAmountToStake("");
    }
  };

  const calculateApr = (lockDuration) => {
    const rewardPerYear = rewardPerSecRef.current * 3600 * 24 * 365;
    // recalculate the weight depending on the lock duration
    const weight = 1 + (lockDuration / 60) * 5;
    const rewardPerYearPerShare = (rewardPerYear * 1e6) / totalPoolWeightedSharesRef.current;
    let calculatedApr;
    if (pool === "Single") {
      calculatedApr = rewardPerYearPerShare * weight * 100;
    } else {
      // for LP pool calculate APR based on USD amount
      // get the reward per year per share, each share is equivalent of the SNOW/ETH LP token price (at weight 1)
      const rewardPerYearPerShareInUsd = rewardPerYearPerShare * snowEthPrice * ethUsdPrice;
      calculatedApr = (rewardPerYearPerShareInUsd / lpTokenPrice) * weight * 100;
    }
    setApr(calculatedApr);
  };

  return (
    <Card w="25%">
      <CardBody>
        <Box>
          <Flex alignItems="center" justifyContent="space-between">
            <Heading size="md">{pool} Pool</Heading>
            <Text fontSize="sm">
              <Text as="i">TVL:</Text>
              {" " +
                new Intl.NumberFormat("en-us", { style: "currency", currency: "USD" }).format(
                  totalValueLockedRef.current
                )}
            </Text>
          </Flex>
          <Flex mt="1rem" direction="column">
            <Flex justifyContent="space-between" mt="1rem">
              <Text as="b" fontSize="xs">
                Amount
              </Text>
              <Flex>
                <Text as="i" fontSize="xs" onClick={() => setAmountToStake(balanceOf)}>
                  Balance:{" "}
                  {Number(balanceOf)
                    .toFixed(1)
                    .replace(/[.,]0$/, "") +
                    " " +
                    pool}{" "}
                </Text>
              </Flex>
            </Flex>
            <Input
              placeholder={"0 " + pool}
              value={amountToStake}
              onChange={(e) => {
                setAmountToStake(e.target.value);
              }}
            />
            <Flex mt="1rem" alignItems="center" justifyContent="space-between">
              <Flex>
                <Text as="b" fontSize="xs">
                  Lock duration
                </Text>
                <Tooltip
                  label="A longer lock duration gives more weight (from 1 up to 6) for your stake."
                  fontSize="xs"
                >
                  <InfoOutlineIcon ml="0.2rem" />
                </Tooltip>
              </Flex>
              <Flex alignItems="center">
                <Text fontSize="xs" as="i">
                  APR: {Number(apr).toFixed(2)}%
                </Text>
                <Tooltip
                  label="Estimated APR based on the lock duration and the current week reward rate"
                  fontSize="xs"
                >
                  <InfoOutlineIcon ml="0.2rem" />
                </Tooltip>
              </Flex>
            </Flex>
            <Slider
              mt="0.5rem"
              mb="1rem"
              id="slider"
              defaultValue={12}
              min={0}
              max={60}
              colorScheme="teal"
              onChange={(lock) => {
                setLockValue(lock);
                calculateApr(lock);
              }}
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
            {allowance === "0" ? (
              <Button
                mt="1rem"
                colorScheme="purple"
                onClick={() => approve()}
                {...(waitTransaction && { isLoading: true })}
              >
                Approve
              </Button>
            ) : (
              <Button
                mt="1rem"
                colorScheme="teal"
                onClick={() => stake(amountToStake, lockValue)}
                {...(waitTransaction && { isLoading: true })}
              >
                Stake
              </Button>
            )}
          </Flex>
        </Box>
      </CardBody>
    </Card>
  );
};

export default Stake;
