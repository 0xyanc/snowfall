const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    const snowERC20 = await deployments.get("SnowfallERC20")
    const snowERC20Address = snowERC20.address
    const snowERC20Contract = await ethers.getContractAt("SnowfallERC20", snowERC20Address)

    const uniswapRouterAddress = networkConfig[chainId].UniswapV2Router02
    const IUniswapV2Router02 = await ethers.getContractAt("IUniswapV2Router02", uniswapRouterAddress, deployer)
    const wethAddress = await IUniswapV2Router02.WETH()

    log("*** Retrieve SNOW/ETH LP Token address ***")
    //retrieve lp token address 
    const uniswapFactoryAddress = networkConfig[chainId].UniswapV2Factory
    const IUniswapV2Factory = await ethers.getContractAt("IUniswapV2Factory", uniswapFactoryAddress, deployer)
    const lpTokenAddress = await IUniswapV2Factory.getPair(snowERC20Address, wethAddress)
    log(`---- LP Token address: ${lpTokenAddress} ----`)

    log("--------------------------------------")
    let args = [snowERC20Address, lpTokenAddress]
    log("*** Deploying SnowfallPool ***")
    const singlePool = await deploy("SnowfallPool", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })
    log("*** Deploying SnowfallEthPool ***")
    const lpPool = await deploy("SnowfallEthPool", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })

    log("*** Grant MINTER_ROLE to Single Pool ***")
    snowERC20Contract.grantRole("0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6", singlePool.address)


    log("*** Initialise the pools ***")
    const singlePoolContract = await ethers.getContractAt("SnowfallPool", singlePool.address)
    const lpPoolContract = await ethers.getContractAt("SnowfallEthPool", lpPool.address)
    singlePoolContract.initialize(singlePool.address, lpPool.address)
    lpPoolContract.initialize(singlePool.address, lpPool.address)

    //Verify the smart contract 
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN) {
        log("Verifying...")
        await verify(singlePool.address, args)
        await verify(lpPool.address, args)
    }
}

module.exports.tags = ["all", "pools", "main"]