import { useContractProvider } from "@/context/ContractContext";
import { Button, Tr, Td, Text, Card, CardHeader, Heading, CardBody, Stack, Box } from "@chakra-ui/react";
import { useEffect } from "react";

const PendingReward = ({ heading, pendingRewards, claimRewards }) => {
  return (
    <Card>
      <CardHeader>
        <Heading size="md">{heading}</Heading>
      </CardHeader>

      <CardBody>
        <Box>
          <Heading size="xs" textTransform="uppercase">
            You have {Number(pendingRewards).toFixed(2)} SNOW rewards to claim.
          </Heading>
          <Button colorScheme="purple" onClick={() => claimRewards()}>
            Claim Rewards
          </Button>
        </Box>
      </CardBody>
    </Card>
  );
};

export default PendingReward;
