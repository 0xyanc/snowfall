const { network, ethers } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { log } = deployments
    const { deployer, staker } = await getNamedAccounts()
    const chainId = network.config.chainId
    // If we are on a local development network, transfer tokens to accounts[1] for additional testing
    if (chainId == 31337) {
        const snowERC20 = await deployments.get("SnowfallERC20")
        const snowERC20Address = snowERC20.address
        const snowERC20Contract = await ethers.getContractAt("SnowfallERC20", snowERC20Address)
        const wethAddress = networkConfig[chainId].WETH

        //retrieve lp token address 
        const uniswapFactoryAddress = networkConfig[chainId].UniswapV2Factory
        const IUniswapV2Factory = await ethers.getContractAt("IUniswapV2Factory", uniswapFactoryAddress, deployer)
        const lpTokenAddress = await IUniswapV2Factory.getPair(snowERC20Address, wethAddress)
        const lpTokenERC20 = await ethers.getContractAt("IUniswapV2Pair", lpTokenAddress)

        // transfer SNOW tokens to staker address
        snowERC20Contract.transfer(staker, ethers.utils.parseUnits("1000000", "ether"))
        // transfer SNOW/ETH LP tokens to staker address
        lpTokenERC20.transfer(staker, ethers.utils.parseUnits("10", "ether"))
    }
}

module.exports.tags = ["transfer"]