const { keccak256, toUtf8Bytes } = require("ethers")
const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const snowERC20 = await deployments.get("SnowfallERC20")
    const snowERC20Address = snowERC20.address
    // log(snowERC20Address)
    // const snow = await ethers.getContractFactory("SnowfallERC20")
    // const Snowfall = await snow.attach(snowERC20Address)
    // log(Snowfall)
    const snowERC20Contract = await ethers.getContractAt("SnowfallERC20", snowERC20Address)
    // log(snowERC20Contract)

    log("--------------------------------------")
    let args = [snowERC20Address, snowERC20Address]
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
    // log(keccak256("MINTER_ROLE"))
    // log(snowERC20Contract)
    snowERC20Contract.grantRole("0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6", singlePool.address)

    //Verify the smart contract 
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN) {
        log("Verifying...")
        await verify(singlePool.address, args)
        await verify(lpPool.address, args)
    }
}

module.exports.tags = ["all", "pools", "main"]