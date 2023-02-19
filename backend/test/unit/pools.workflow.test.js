const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { time } = require("@nomicfoundation/hardhat-network-helpers")
const { BigNumber } = require("ethers")

if (!developmentChains.includes(network.name)) {
    describe.skip
    return
}
describe("Unit tests of the Staking smart contracts: workflow", function () {
    let accounts
    let singlePool
    let lpPool
    let snowfallERC20
    let lpTokenERC20
    before(async () => {
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        deployerAddress = await deployer.getAddress()
        staker = accounts[1]
        stakerAddress = await staker.getAddress()
    })

    describe("workflow", async function () {
        before(async () => {
            await deployments.fixture(["main"])
            singlePool = await ethers.getContract("SnowfallPool")
            lpPool = await ethers.getContract("SnowfallEthPool")
            snowfallERC20 = await ethers.getContract("SnowfallERC20")
            const chainId = network.config.chainId
            const uniswapFactoryAddress = networkConfig[chainId].UniswapV2Factory
            const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
            const IUniswapV2Factory = await ethers.getContractAt("IUniswapV2Factory", uniswapFactoryAddress, deployer)
            const lpTokenAddress = await IUniswapV2Factory.getPair(snowfallERC20.address, wethAddress)
            lpTokenERC20 = await ethers.getContractAt("IUniswapV2Pair", lpTokenAddress)
        })

        it("should stake 10 tokens in the Single Pool for 1 seconds with weight 1, update pool info, transfer SNOW token and emit the event Staked", async function () {
            // approve SNOW before staking
            await snowfallERC20.approve(singlePool.address, ethers.constants.MaxUint256)
            // stake SNOW in the Single Pool
            const stake = await singlePool.stake(10, 1)

            // check that the weight is 1 and 10 tokens are in the pool
            const user = await singlePool.users(deployerAddress)
            const totalPoolWeightedShares = await singlePool.totalPoolWeightedShares()
            const totalTokensInPool = await singlePool.totalTokensInPool()
            assert.equal(user.totalWeightedShares.toString(), 10000000)
            assert.equal(totalPoolWeightedShares.toString(), 10000000)
            assert.equal(totalTokensInPool.toString(), 10)

            // check events
            await expect(stake).to.changeTokenBalances(snowfallERC20, [deployer, singlePool], [-10, 10])
            await expect(stake).to.emit(snowfallERC20, "Transfer").withArgs(deployerAddress, singlePool.address, 10)
            await expect(stake).to.emit(singlePool, "Staked")
        })

        it("should stake 10 tokens in the LP Pool for 1 second with weight 1, update pool info, transfer LP token and emit the event Staked", async function () {
            // approve SNOW/ETH LP token before staking
            await lpTokenERC20.approve(lpPool.address, ethers.constants.MaxUint256)
            // stake SNOW/ETH LP token in the LP Pool
            const stake = await lpPool.stake(10, 1)

            // check that the weight is 1 and 10 tokens are in the pool
            const user = await lpPool.users(deployerAddress)
            const totalPoolWeightedShares = await lpPool.totalPoolWeightedShares()
            const totalTokensInPool = await lpPool.totalTokensInPool()
            assert.equal(user.totalWeightedShares.toString(), 10000000)
            assert.equal(totalPoolWeightedShares.toString(), 10000000)
            assert.equal(totalTokensInPool.toString(), 10)

            // check events
            await expect(stake).to.changeTokenBalances(lpTokenERC20, [deployer, lpPool], [-10, 10])
            await expect(stake).to.emit(lpTokenERC20, "Transfer").withArgs(deployerAddress, lpPool.address, 10)
            await expect(stake).to.emit(lpPool, "Staked")
        })

        it("should claim the rewards from Single Pool, add a new stake, update pool info, mint tokens to single pool and emit Events", async function () {
            // initial reward per sec is 39499007936507900 / 10 for single pool
            const rewardsPerSec = BigNumber.from("3949900793650790");
            // 10 seconds have passed since the Single Pool stake
            await time.increase(7)
            const expectedRewards = rewardsPerSec.mul(10)

            const claim = await singlePool.claimYieldRewards()

            const user = await singlePool.users(deployerAddress)
            const totalPoolWeightedSharesAfter = await singlePool.totalPoolWeightedShares()
            const totalTokensInPoolAfter = await singlePool.totalTokensInPool()

            assert.equal(user.totalWeightedShares.toString(), expectedRewards.mul(2 * 1e6).add(10000000).toString())
            assert.equal(totalPoolWeightedSharesAfter.toString(), expectedRewards.mul(2 * 1e6).add(10000000).toString())
            assert.equal(totalTokensInPoolAfter.toString(), expectedRewards.add(10).toString())

            await expect(claim).to.changeTokenBalance(snowfallERC20, singlePool, expectedRewards)
            await expect(claim).to.emit(snowfallERC20, "Transfer").withArgs(ethers.constants.AddressZero, singlePool.address, expectedRewards)
            await expect(claim).to.emit(singlePool, "Staked")
            await expect(claim).to.emit(singlePool, "ClaimYieldRewards").withArgs(deployerAddress, expectedRewards)
        })

        it("should claim the rewards, add a new stake for the user and update user and pool values", async function () {
            // initial reward per sec is 39499007936507900 * 9 / 10 for lp pool
            const rewardsPerSec = BigNumber.from("39499007936507900").mul(9).div(10)
            // 20 seconds has passed since the LP Pool stake
            await time.increase(11)
            const expectedRewards = rewardsPerSec.mul(20)

            // claiming in LP pool only affects single pool info
            const userSingleBefore = await singlePool.users(deployerAddress)
            const totalPoolWeightedSharesSingleBefore = await singlePool.totalPoolWeightedShares()
            const totalTokensInPoolSingleBefore = await singlePool.totalTokensInPool()

            const claim = await lpPool.claimYieldRewards()

            // claiming in LP pool only affects single pool info
            const userSingleAfter = await singlePool.users(deployerAddress)
            const totalPoolWeightedSharesSingleAfter = await singlePool.totalPoolWeightedShares()
            const totalTokensInPoolSingleAfter = await singlePool.totalTokensInPool()

            assert.equal(userSingleAfter.totalWeightedShares.toString(), userSingleBefore.totalWeightedShares.add(expectedRewards.mul(2 * 1e6)).toString())
            assert.equal(totalPoolWeightedSharesSingleAfter.toString(), totalPoolWeightedSharesSingleBefore.add(expectedRewards.mul(2 * 1e6)).toString())
            assert.equal(totalTokensInPoolSingleAfter.toString(), totalTokensInPoolSingleBefore.add(expectedRewards).toString())

            await expect(claim).to.changeTokenBalance(snowfallERC20, singlePool, expectedRewards)
            await expect(claim).to.emit(snowfallERC20, "Transfer").withArgs(ethers.constants.AddressZero, singlePool.address, expectedRewards)
            await expect(claim).to.emit(singlePool, "Staked")
            await expect(claim).to.emit(lpPool, "ClaimYieldRewards").withArgs(deployerAddress, expectedRewards)
        })

        it("should unstake the first deposit, update pool info, emit the event Unstake and transfer the token back", async function () {
            // await time.increase(11)
            const userBefore = await singlePool.users(deployerAddress)
            const totalPoolWeightedSharesBefore = await singlePool.totalPoolWeightedShares()
            const totalTokensInPoolBefore = await singlePool.totalTokensInPool()

            const unstake = await singlePool.unstake(0)

            const userAfter = await singlePool.users(deployerAddress)
            const totalPoolWeightedSharesAfter = await singlePool.totalPoolWeightedShares()
            const totalTokensInPoolAfter = await singlePool.totalTokensInPool()

            assert.equal(userAfter.totalWeightedShares.toString(), userBefore.totalWeightedShares.sub(10000000).toString())
            assert.equal(totalPoolWeightedSharesAfter.toString(), totalPoolWeightedSharesBefore.sub(10000000).toString())
            assert.equal(totalTokensInPoolAfter.toString(), totalTokensInPoolBefore.sub(10).toString())

            await expect(unstake).to.changeTokenBalances(snowfallERC20, [singlePool, deployer], [-10, 10])
            await expect(unstake).to.emit(snowfallERC20, "Transfer").withArgs(singlePool.address, deployerAddress, 10)
            await expect(unstake).to.emit(singlePool, "Unstake").withArgs(deployerAddress, 0)
        })


        it("should unstake first claim that vested for a year, emit the event Unstake and transfer the yield to the user", async function () {
            // initial reward per sec is 39499007936507900 / 10 for single pool
            const rewardsPerSec = BigNumber.from("3949900793650790");
            const expectedRewards = rewardsPerSec.mul(10)
            // wait 1 year for the yield to vest
            await time.increase(3600 * 24 * 365)

            const totalTokensInPoolBefore = await singlePool.totalTokensInPool()

            const unstake = await singlePool.unstake(1)

            const totalTokensInPoolAfter = await singlePool.totalTokensInPool()

            assert.equal(totalTokensInPoolAfter.toString(), totalTokensInPoolBefore.sub(expectedRewards).toString())
            await expect(unstake).to.changeTokenBalances(snowfallERC20, [singlePool, deployer], [expectedRewards.mul(-1), expectedRewards])
            await expect(unstake).to.emit(snowfallERC20, "Transfer").withArgs(singlePool.address, deployerAddress, expectedRewards)
            await expect(unstake).to.emit(singlePool, "Unstake").withArgs(deployerAddress, 1)
        })

        it("should unstake second claim that vested for a year, emit the event Unstake and transfer the yield to the user", async function () {
            // initial reward per sec is 39499007936507900 * 9 / 10 for lp pool
            const rewardsPerSec = BigNumber.from("39499007936507900").mul(9).div(10)
            const expectedRewards = rewardsPerSec.mul(20)

            const totalTokensInPoolBefore = await singlePool.totalTokensInPool()

            const unstake = await singlePool.unstake(2)

            const totalTokensInPoolAfter = await singlePool.totalTokensInPool()

            assert.equal(totalTokensInPoolAfter.toString(), totalTokensInPoolBefore.sub(expectedRewards).toString())
            assert.equal(totalTokensInPoolAfter, 0)

            await expect(unstake).to.changeTokenBalances(snowfallERC20, [singlePool, deployer], [expectedRewards.mul(-1), expectedRewards])
            await expect(unstake).to.emit(snowfallERC20, "Transfer").withArgs(singlePool.address, deployerAddress, expectedRewards)
            await expect(unstake).to.emit(singlePool, "Unstake").withArgs(deployerAddress, 2)
        })
    })
})