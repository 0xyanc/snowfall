const networkConfig = {
    31337: {
        name: "localhost",
        UniswapV2Router02: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
        UniswapV2Factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
    },
    5: {
        name: "goerli",
        UniswapV2Router02: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
        UniswapV2Factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
    }
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains
}