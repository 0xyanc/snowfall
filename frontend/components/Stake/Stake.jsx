import { useContractProvider } from "@/context/ContractContext";
import { Button, Tr, Td, Text } from "@chakra-ui/react";
import { useEffect } from "react";

const Stake = ({ stake, date }) => {
  const { writeSinglePoolContract, writeLpPoolContract } = useContractProvider();

  const unstake = async (id) => {
    try {
      const tx = await writeSinglePoolContract.unstake(id);
      await tx.wait();
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <Tr>
      <Td>{stake.pool === "Single" ? "Snowfall" : "Snowfall/ETH"}</Td>
      <Td>{stake.value}</Td>
      <Td>{stake.weight}</Td>
      <Td>
        {stake.stakeTime.toLocaleDateString()} {stake.stakeTime.toLocaleTimeString()}
      </Td>
      <Td>
        {stake.lockedUntil.toLocaleDateString()} {stake.lockedUntil.toLocaleTimeString()}
      </Td>
      <Td>
        {date >= stake.lockedUntil ? (
          <Button colorScheme="blue" onClick={() => unstake(stake.stakeId)}>
            Unstake
          </Button>
        ) : (
          <Text>Locked</Text>
        )}
      </Td>
    </Tr>
  );
};

export default Stake;
