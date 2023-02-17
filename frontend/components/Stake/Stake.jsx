import { useContractProvider } from "@/context/ContractContext";
import { InfoOutlineIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
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
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

const Stake = ({ pool, allowance, setSnowAllowance, setLpTokenAllowance }) => {
  const { address, isConnected } = useAccount();
  const { writeSinglePoolContract, writeLpPoolContract, readSnowERC20Contract, readLpERC20Contract } =
    useContractProvider();
  const [amountToStake, setAmountToStake] = useState("");
  const [lockValue, setLockValue] = useState(12);
  const [showTooltip, setShowTooltip] = useState(false);
  const [waitTransaction, setWaitTransaction] = useState(false);
  const [balanceOf, setBalanceOf] = useState(0);
  const toast = useToast();

  useEffect(() => {
    if (isConnected) {
      getBalanceOf();
    }
  }, [isConnected, address]);

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
    }
  };

  return (
    <Card>
      <CardHeader>
        <Heading size="md">{pool} Pool</Heading>
      </CardHeader>

      <CardBody>
        <Box>
          <Flex mt="1rem" direction="column">
            <Flex justifyContent="space-between">
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
            <Input placeholder={"0 " + pool} value={amountToStake} onChange={(e) => setAmountToStake(e.target.value)} />
            <Flex mt="1rem" alignItems="center">
              <Text as="b">Lock duration</Text>
              <Tooltip label="A longer lock duration gives more weight (from 1 up to 6) for your stake." fontSize="xs">
                <InfoOutlineIcon ml="1rem" />
              </Tooltip>
            </Flex>
            <Slider
              mt="0rem"
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
