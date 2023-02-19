require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy");
require("hardhat-gas-reporter")
// require("solidity-coverage")
require("@nomicfoundation/hardhat-chai-matchers")

const PK = process.env.PK || "";
const ETHERSCAN = process.env.ETHERSCAN || "";
const ALCHEMY_GOERLI = process.env.ALCHEMY_GOERLI || "";
const ALCHEMY_MAINNET = process.env.ALCHEMY_MAINNET || "";

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    hardhat: {
      chainId: 31337,
      forking: {
        url: ALCHEMY_MAINNET,
        // mainnet block of Uniswap V2 deployment
        blockNumber: 10210000
      }
    },
    goerli: {
      url: ALCHEMY_GOERLI,
      accounts: [`0x${PK}`],
      chainId: 5,
      blockConfirmations: 6
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.18"
      },
      {
        version: "0.6.2"
      },
      {
        version: "0.5.0"
      }
    ]
  },
  etherscan: {
    apiKey: {
      goerli: ETHERSCAN
    }
  },
  namedAccounts: {
    deployer: {
      default: 0,
      1: 0,
    },
    staker: {
      default: 1,
      1: 1,
    },
  },
  gasReporter: {
    enabled: true
  }
};
