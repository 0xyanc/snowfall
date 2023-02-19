const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("--------------------------------------")
    log("*** Deploying SnowfallERC20 ***")
    // initial supply of 70,000,000 - 30,000,000 dedicated to yield farming
    const initialSupply = ethers.utils.parseUnits("70000000", "ether")
    let args = [initialSupply]

    const snowERC20 = await deploy("SnowfallERC20", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })
    //Verify the smart contract 
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN) {
        log("Verifying SnowfallERC20 contract...")
        await verify(snowERC20.address, args)
        log("SnowfallERC20 contract verified")
    }
}

module.exports.tags = ["all", "snowERC20", "main"]