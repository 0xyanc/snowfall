import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, Flex, Text } from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import NextLink from "next/link";
import { Link } from "@chakra-ui/react";

const Header = () => {
  return (
    <Flex h="5vh" p="2rem" justifyContent="space-between" alignItems="center">
      <Text as="b">Snowfall Staking App</Text>
      <Link as={NextLink} href="/">
        Dashboard
      </Link>
      <Link as={NextLink} href="/staking">
        Staking
      </Link>
      <Link as={NextLink} href="/vesting">
        Vesting
      </Link>
      <ConnectButton />
    </Flex>
  );
};

export default Header;
