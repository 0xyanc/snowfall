import { useContractProvider } from "@/context/ContractContext";
import { WEIGHT_MULTIPLIER } from "@/util/Constants";
import { Button, Tr, Td, Text, useToast } from "@chakra-ui/react";
import { useState } from "react";

const Vesting = ({ stake, date }) => {
  const { writeSinglePoolContract, writeLpPoolContract } = useContractProvider();
  const [waitTransaction, setWaitTransaction] = useState(false);
  const toast = useToast();

  const unstake = async (id) => {
    try {
      setWaitTransaction(true);
      let tx;
      if (stake.pool === "Single") {
        tx = await writeSinglePoolContract.unstake(id);
      } else {
        tx = await writeLpPoolContract.unstake(id);
      }
      await tx.wait();
      toast({
        title: "Unstaked tokens",
        description: "You successfully unstaked your tokens",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error unstaking tokens",
        description: "An error occurred while unstaking tokens",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setWaitTransaction(false);
    }
  };
  return (
    <Tr>
      <Td>{stake.pool === "Single" ? "Snowfall" : "Snowfall/ETH"}</Td>
      <Td>{Number(stake.value).toFixed(2)}</Td>
      <Td>{Number(stake.weight / WEIGHT_MULTIPLIER).toFixed(2)}</Td>
      <Td>
        {stake.stakeTime.toLocaleDateString()} {stake.stakeTime.toLocaleTimeString()}
      </Td>
      <Td>
        {stake.lockedUntil.toLocaleDateString()} {stake.lockedUntil.toLocaleTimeString()}
      </Td>
      <Td>
        {date >= stake.lockedUntil ? (
          <Button
            colorScheme="teal"
            onClick={() => unstake(stake.stakeId)}
            {...(waitTransaction && { isLoading: true })}
          >
            Unstake
          </Button>
        ) : (
          <Text>Locked</Text>
        )}
      </Td>
    </Tr>
  );
};

export default Vesting;
