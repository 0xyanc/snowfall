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
} from "@chakra-ui/react";
import { useState } from "react";

const Stake = ({ pool, stake, approve, allowance }) => {
  const [amountToStake, setAmountToStake] = useState(0);
  const [lockValue, setLockValue] = useState(12);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Stake {pool}</Heading>
      </CardHeader>

      <CardBody>
        <Box>
          <Flex mt="1rem" direction="column">
            <Text as="b">Amount to stake</Text>
            <Input
              placeholder="Amount to Stake"
              value={amountToStake}
              onChange={(e) => setAmountToStake(e.target.value)}
            />
            <Text as="b" mt="1rem">
              Lock duration
            </Text>
            <Slider
              mt="1rem"
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
              <Button mt="1rem" colorScheme="purple" onClick={() => approve()}>
                Approve
              </Button>
            ) : (
              <Button mt="1rem" colorScheme="green" onClick={() => stake(amountToStake, lockValue)}>
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
