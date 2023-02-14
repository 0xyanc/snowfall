import { useStakesProvider } from "@/context/StakesContext";
import { Tr, Text, Flex, TableContainer, Table, Thead, Th, Tbody } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Vesting from "../Stake/Vesting";

const VestingList = () => {
  const { stakes } = useStakesProvider();
  const [date, setDate] = useState(new Date());
  useEffect(() => {
    var timer = setInterval(() => setDate(new Date()), 15000);
    return () => clearInterval(timer);
  });
  return (
    <>
      <Text as="b">Vesting stakes</Text>
      <Flex width="100%" direction={["column", "column", "row", "row"]} alignItems="center" flexWrap="wrap"></Flex>
      <TableContainer>
        <Table variant="simple">
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
    </>
  );
};

export default VestingList;
