const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("--------------------------------------")
    log("*** Deploying SnowfallERC20 ***")
    const initialSupply = ethers.utils.parseUnits("70000000", "ether")
    let args = [initialSupply]

    const snowERC20 = await deploy("SnowfallERC20", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })
    log(`*** SnowfallERC20 deployed ${snowERC20.address} ***`)
    //Verify the smart contract 
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN) {
        log("Verifying...")
        await verify(snowERC20.address, args)
    }
}

module.exports.tags = ["all", "snowERC20", "main"]