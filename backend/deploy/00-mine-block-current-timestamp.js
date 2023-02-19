const { time } = require("@nomicfoundation/hardhat-network-helpers")

module.exports = async () => {
    const chainId = network.config.chainId
    // If we are on a local development network, advance to the current timestamp
    if (chainId == 31337) {
        const currentTimeInSeconds = Math.floor(Date.now() / 1000)
        await time.increaseTo(currentTimeInSeconds)
    }
}

module.exports.tags = ["timestamp"]