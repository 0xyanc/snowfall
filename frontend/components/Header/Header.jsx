import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, Flex, Text } from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const Header = () => {
  return (
    <Flex h="5vh" p="2rem" justifyContent="space-between" alignItems="center">
      <Text as="b">Snowfall Staking App</Text>
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>

        {/* <BreadcrumbItem>
          <BreadcrumbLink href="#">Docs</BreadcrumbLink>
        </BreadcrumbItem> */}

        <BreadcrumbItem>
          <BreadcrumbLink href="/vesting">Vesting</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      <ConnectButton />
    </Flex>
  );
};

export default Header;
