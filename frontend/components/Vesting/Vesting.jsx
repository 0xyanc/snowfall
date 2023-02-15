import { useContractProvider } from "@/context/ContractContext";
import { Button, Tr, Td, Text } from "@chakra-ui/react";

const Vesting = ({ stake, date }) => {
  const { writeSinglePoolContract, writeLpPoolContract } = useContractProvider();

  const unstake = async (id) => {
    try {
      let tx;
      if (stake.pool === "Single") {
        tx = await writeSinglePoolContract.unstake(id);
      } else {
        tx = await writeLpPoolContract.unstake(id);
      }
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

export default Vesting;
