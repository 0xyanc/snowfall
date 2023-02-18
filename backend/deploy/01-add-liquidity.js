const { BigNumber } = require("ethers")
const { network, ethers } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")
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
    log(`WETH address ${wethAddress}`)
    const oneEth = ethers.utils.parseUnits("1", "ether")
    const oneThousandEth = ethers.utils.parseUnits("10000", "ether")

    log("--------------------------------------")
    // approve snow to uniswap router
    log("*** Approve SNOW to UniswapV2Router02 ***")
    await snowERC20Contract.approve(uniswapRouterAddress, oneThousandEth)
    // add snow and ETH liquidity
    log("*** Add SNOW/ETH liquidity UniswapV2Router02 ***")

    await IUniswapV2Router02.addLiquidityETH(snowERC20Address, oneThousandEth, oneThousandEth, oneEth, deployer, Date.now(), { value: oneEth })
}

module.exports.tags = ["all", "liquidity", "main"]