const { time } = require("@nomicfoundation/hardhat-network-helpers")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const chainId = network.config.chainId
    // If we are on a local development network, advance to the current timestamp
    if (chainId == 31337) {
        const currentTimeInSeconds = Math.floor(Date.now() / 1000)
        console.log(currentTimeInSeconds)
        await time.increaseTo(currentTimeInSeconds)
    }

}

module.exports.tags = ["all", "current", "main"]