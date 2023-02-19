import { useStakesProvider } from "@/context/StakesContext";
import { Tr, Flex, TableContainer, Table, Thead, Th, Tbody, Heading, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Vesting from "../Vesting/Vesting";

const VestingList = () => {
  const { address, isConnected } = useAccount();
  const { stakes } = useStakesProvider();
  const [date, setDate] = useState(new Date());
  useEffect(() => {
    var timer = setInterval(() => setDate(new Date()), 15000);
    return () => clearInterval(timer);
  });
  return (
    <>
      <Flex direction="column" w="100%">
        <Flex alignItems="center" direction="column">
          <Heading as="b">Vesting stakes</Heading>
          <Text mt="1rem">
            You will find below your vesting deposits and rewards with all the information related to amounts, unlocks
            and weights
          </Text>
        </Flex>
        {isConnected ? (
          <Flex direction="column" alignItems="center" alignContent="center" mt="1rem">
            <TableContainer mt="1rem">
              <Table variant="striped" colorScheme="teal">
                <Thead>
                  <Tr>
                    <Th>Pool</Th>
                    <Th isNumeric>Amount</Th>
                    <Th isNumeric>Weight</Th>
                    <Th>Lock date</Th>
                    <Th>Unlock date</Th>
                    <Th>Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {stakes.length !== 0 ? (
                    stakes.map((stake) => {
                      return <Vesting stake={stake} date={date} key={stake.id} />;
                    })
                  ) : (
                    <></>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </Flex>
        ) : (
          <Flex justifyContent="center">
            <Heading fontSize="md" mt="5rem">
              Please connect your wallet to start
            </Heading>
          </Flex>
        )}
      </Flex>
    </>
  );
};

export default VestingList;
