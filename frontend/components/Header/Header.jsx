import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, Flex, Text } from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const Header = () => {
  return (
    <Flex h="5vh" p="2rem" justifyContent="space-between" alignItems="center">
      <Text as="b">Snowfall Staking App</Text>
      <ConnectButton />
    </Flex>
  );
};

export default Header;
