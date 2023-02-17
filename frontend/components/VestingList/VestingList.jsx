import { useStakesProvider } from "@/context/StakesContext";
import { Tr, Flex, TableContainer, Table, Thead, Th, Tbody, Heading } from "@chakra-ui/react";
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
      {isConnected ? (
        <Flex w="100%" direction="column" alignItems="center" alignContent="center">
          <Heading as="b">Vesting stakes</Heading>
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
        <Flex m="auto">
          <Heading mt="1rem">Please connect your wallet to start</Heading>
        </Flex>
      )}
    </>
  );
};

export default VestingList;
