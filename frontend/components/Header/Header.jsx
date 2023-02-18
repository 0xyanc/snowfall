import { Flex, Text } from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import NextLink from "next/link";
import { Link } from "@chakra-ui/react";
import { usePriceProvider } from "@/context/PriceContext";

const Header = () => {
  const { ethUsdPrice, snowEthPrice } = usePriceProvider();
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

      <Flex alignItems="center">
        <Text mr="1rem">SNOW: ${Number(ethUsdPrice * snowEthPrice).toFixed(2)}</Text>
        <ConnectButton showBalance={false} />
      </Flex>
    </Flex>
  );
};

export default Header;
