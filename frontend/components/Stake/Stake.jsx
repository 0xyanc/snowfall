import { useContractProvider } from "@/context/ContractContext";
import { Button, Tr, Td, Text } from "@chakra-ui/react";
import { useState } from "react";

const Stake = ({ stake }) => {
  const {
    readSnowERC20Contract,
    writeSnowERC20Contract,
    readSinglePoolContract,
    writeSinglePoolContract,
    readLpPoolContract,
    writeLpPoolContract,
    provider,
  } = useContractProvider();

  const unstake = async (id) => {
    try {
      console.log(id);
      //   const amount = ethers.utils.parseUnits(amountToStake, "ether");
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
      <Td>
        {stake.lockedUntil.toLocaleDateString()} {stake.lockedUntil.toLocaleTimeString()}
      </Td>
      <Td>
        {Date.now() >= stake.lockedUntil ? (
          <Button colorScheme="blue" onClick={() => unstake(stake.id)}>
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
