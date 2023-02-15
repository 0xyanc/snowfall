import { Button, Text, Card, CardHeader, Heading, CardBody, Box } from "@chakra-ui/react";

const PendingReward = ({ heading, pendingRewards, claimRewards }) => {
  return (
    <Card m="1rem">
      <CardHeader>
        <Heading size="md">{heading}</Heading>
      </CardHeader>

      <CardBody>
        <Box>
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
