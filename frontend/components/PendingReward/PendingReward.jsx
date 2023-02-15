import { useContractProvider } from "@/context/ContractContext";
import { Button, Tr, Td, Text, Card, CardHeader, Heading, CardBody, Stack, Box } from "@chakra-ui/react";
import { useEffect } from "react";

const PendingReward = ({ heading, pendingRewards, claimRewards }) => {
  return (
    <Card m="1rem">
      <CardHeader>
        <Heading size="md">{heading}</Heading>
      </CardHeader>

      <CardBody>
        <Box>
          {/* <Heading size="xs" textTransform="uppercase">
            You have {Number(pendingRewards).toFixed(2)} SNOW rewards to claim.
          </Heading> */}
          <Text>
            You have <Text as="b"> {Number(pendingRewards).toFixed(2)} </Text> SNOW rewards to claim.
          </Text>
          <Button mt="1rem" colorScheme="purple" onClick={() => claimRewards()}>
            Claim Rewards
          </Button>
        </Box>
      </CardBody>
    </Card>
  );
};

export default PendingReward;
