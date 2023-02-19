const networkConfig = {
    31337: {
        name: "localhost",
        //these are the addresses on mainnet since we are forking it
        UniswapV2Router02: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
        UniswapV2Factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
        WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    },
    5: {
        name: "goerli",
        UniswapV2Router02: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
        UniswapV2Factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
        WETH: "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6"
    }
}
const DECIMALS = "18"
const INITIAL_PRICE = "1700000000000000000000"
const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_PRICE,
}