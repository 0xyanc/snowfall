import { useContractProvider } from "@/context/ContractContext";
import { Button, Text, Card, CardHeader, Heading, CardBody, Box, useToast } from "@chakra-ui/react";
import { useState } from "react";

const PendingReward = ({ pool, pendingRewards }) => {
  const { writeSinglePoolContract, writeLpPoolContract } = useContractProvider();
  const [waitTransaction, setWaitTransaction] = useState(false);
  const toast = useToast();

  const claimRewards = async () => {
    try {
      setWaitTransaction(true);
      let tx;
      if (pool === "Single") {
        tx = await writeSinglePoolContract.claimYieldRewards();
      } else {
        tx = await writeLpPoolContract.claimYieldRewards();
      }
      await tx.wait();
      toast({
        title: "Claimed rewards!",
        description: "You successfully claimed your rewards",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error claiming rewards",
        description: "An error occurred while claiming rewards",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setWaitTransaction(false);
    }
  };

  return (
    <Card m="1rem">
      <CardHeader>
        <Heading size="md">{pool} Pool Pending Rewards</Heading>
      </CardHeader>

      <CardBody>
        <Box>
          <Text>
            You have <Text as="b"> {Number(pendingRewards).toFixed(2)} </Text> SNOW rewards to claim.
          </Text>
          <Button
            mt="1rem"
            colorScheme="teal"
            onClick={() => claimRewards()}
            {...(waitTransaction && { isLoading: true })}
          >
            Claim Rewards
          </Button>
        </Box>
      </CardBody>
    </Card>
  );
};

export default PendingReward;
