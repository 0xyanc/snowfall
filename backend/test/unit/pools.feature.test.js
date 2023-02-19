const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers")
const { BigNumber } = require("ethers")

if (!developmentChains.includes(network.name)) {
    describe.skip
    return
}
describe("Unit tests of pool features for the Staking contracts", function () {
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

    describe("stake Single Pool", async function () {
        beforeEach(async () => {
            await deployments.fixture(["main"])
            singlePool = await ethers.getContract("SnowfallPool")
            snowfallERC20 = await ethers.getContract("SnowfallERC20")
            await snowfallERC20.approve(singlePool.address, ethers.constants.MaxUint256)
        })

        it("should stake 10 tokens for 1 second with weight 1, transfer SNOW token and emit the event Staked", async function () {
            const stake = await singlePool.stake(10, 1)
            await expect(stake).to.changeTokenBalances(snowfallERC20, [deployer, singlePool], [-10, 10])
            await expect(stake).to.emit(snowfallERC20, "Transfer").withArgs(deployerAddress, singlePool.address, 10)
            await expect(stake).to.emit(singlePool, "Staked")
        })

        it("should stake 10 tokens for 5 years and update the pool and user stake values", async function () {
            const fiveYears = 1827 * 24 * 3600
            await singlePool.stake(10, fiveYears)
            const user = await singlePool.users(deployerAddress)
            const totalPoolWeightedShares = await singlePool.totalPoolWeightedShares()
            const totalTokensInPool = await singlePool.totalTokensInPool()
            assert.equal(user.totalWeightedShares.toString(), 60000000)
            assert.equal(totalPoolWeightedShares.toString(), 60000000)
            assert.equal(totalTokensInPool.toString(), 10)
        })
    })

    describe("stake LP Pool", async function () {
        beforeEach(async () => {
            await deployments.fixture(["main"])
            snowfallERC20 = await ethers.getContract("SnowfallERC20")
            lpPool = await ethers.getContract("SnowfallEthPool")
            const chainId = network.config.chainId
            const uniswapFactoryAddress = networkConfig[chainId].UniswapV2Factory
            const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
            const IUniswapV2Factory = await ethers.getContractAt("IUniswapV2Factory", uniswapFactoryAddress, deployer)
            const lpTokenAddress = await IUniswapV2Factory.getPair(snowfallERC20.address, wethAddress)
            lpTokenERC20 = await ethers.getContractAt("IUniswapV2Pair", lpTokenAddress)
            await lpTokenERC20.approve(lpPool.address, ethers.constants.MaxUint256)
        })

        it("should stake 10 tokens for 1 second with weight 1, transfer LP token and emit the event Staked", async function () {
            const stake = await lpPool.stake(10, 1)
            await expect(stake).to.changeTokenBalances(lpTokenERC20, [deployer, lpPool], [-10, 10])
            await expect(stake).to.emit(lpTokenERC20, "Transfer").withArgs(deployerAddress, lpPool.address, 10)
            await expect(stake).to.emit(lpPool, "Staked")
        })

        it("should stake 10 tokens for 5 years and update the pool and user stake values", async function () {
            const fiveYears = 1827 * 24 * 3600
            await lpPool.stake(10, fiveYears)
            const user = await lpPool.users(deployerAddress)
            const totalPoolWeightedShares = await lpPool.totalPoolWeightedShares()
            const totalTokensInPool = await lpPool.totalTokensInPool()
            assert.equal(user.totalWeightedShares.toString(), 60000000)
            assert.equal(totalPoolWeightedShares.toString(), 60000000)
            assert.equal(totalTokensInPool.toString(), 10)
        })
    })

    describe("updateRewardPerSecond Single Pool", async function () {
        beforeEach(async () => {
            await deployments.fixture(["main"])
            singlePool = await ethers.getContract("SnowfallPool")
            snowfallERC20 = await ethers.getContract("SnowfallERC20")
            await snowfallERC20.approve(singlePool.address, ethers.constants.MaxUint256)
            await singlePool.stake(10, 3600)
        })

        it("should revert since a week has not passed yet to update the rewards per second", async function () {
            // 1 week has not passed yet
            await time.increase(604790)
            await expect(singlePool.updateRewardPerSecond())
                .to.be.revertedWithCustomError(singlePool, "CorePool__CannotUpdateRewardRatioYet")
        })

        it("should revert if staking has ended", async function () {
            const fiveYearsPlusOneDay = 1828 * 24 * 3600
            await time.increase(fiveYearsPlusOneDay)
            await expect(singlePool.updateRewardPerSecond())
                .to.be.revertedWithCustomError(singlePool, "CorePool__CannotUpdateRewardRatioYet")
        })

        it("should update the rewards per second value", async function () {
            // increase time by 1 week
            await time.increase(604801)
            const initialRewardPerSec = await singlePool.rewardPerSecond()
            const update = await singlePool.updateRewardPerSecond()
            const expectedRewardPerSec = initialRewardPerSec.mul(101).div(100)
            const updatedRewardPerSecond = await singlePool.rewardPerSecond()
            assert.equal(updatedRewardPerSecond.toString(), expectedRewardPerSec.toString())
            await expect(update).to.emit(singlePool, "UpdateRewardPerSecond").withArgs(deployerAddress, expectedRewardPerSec)
        })
    })

    describe("updateRewardPerSecond LP Pool", async function () {
        beforeEach(async () => {
            await deployments.fixture(["main"])
            lpPool = await ethers.getContract("SnowfallEthPool")
            snowfallERC20 = await ethers.getContract("SnowfallERC20")
            const chainId = network.config.chainId
            const uniswapFactoryAddress = networkConfig[chainId].UniswapV2Factory
            const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
            const IUniswapV2Factory = await ethers.getContractAt("IUniswapV2Factory", uniswapFactoryAddress, deployer)
            const lpTokenAddress = await IUniswapV2Factory.getPair(snowfallERC20.address, wethAddress)
            lpTokenERC20 = await ethers.getContractAt("IUniswapV2Pair", lpTokenAddress)
            await lpTokenERC20.approve(lpPool.address, ethers.constants.MaxUint256)
            await lpPool.stake(10, 3600)
        })

        it("should revert since a week has not passed yet to update the rewards", async function () {
            // 1 week has not passed yet
            await time.increase(604790)
            await expect(lpPool.updateRewardPerSecond())
                .to.be.revertedWithCustomError(lpPool, "CorePool__CannotUpdateRewardRatioYet")
        })

        it("should revert if staking has ended", async function () {
            const fiveYearsPlusOneDay = 1828 * 24 * 3600
            await time.increase(fiveYearsPlusOneDay)
            await expect(lpPool.updateRewardPerSecond())
                .to.be.revertedWithCustomError(lpPool, "CorePool__CannotUpdateRewardRatioYet")
        })

        it("should update the rewards per second value", async function () {
            // increase time by 1 week
            await time.increase(604801)
            const initialRewardPerSec = await lpPool.rewardPerSecond()
            const update = await lpPool.updateRewardPerSecond()
            const expectedRewardPerSec = initialRewardPerSec.mul(101).div(100)
            const updatedRewardPerSecond = await lpPool.rewardPerSecond()
            assert.equal(updatedRewardPerSecond.toString(), expectedRewardPerSec.toString())
            await expect(update).to.emit(lpPool, "UpdateRewardPerSecond").withArgs(deployerAddress, expectedRewardPerSec)
        })
    })

    describe("pendingRewards Single Pool", async function () {
        beforeEach(async () => {
            await deployments.fixture(["main"])
            singlePool = await ethers.getContract("SnowfallPool")
            snowfallERC20 = await ethers.getContract("SnowfallERC20")
            await snowfallERC20.approve(singlePool.address, ethers.constants.MaxUint256)
            await singlePool.stake(10, 1)
        })

        it("should return the amount of yield claimable by the staker", async function () {
            // initial reward per sec is 39499007936507900 / 10 for single pool
            const rewardsPerSec = BigNumber.from("3949900793650790");
            const expectedRewards = rewardsPerSec.mul(10)
            await time.increase(10)
            const pendingRewards = await singlePool.pendingRewards(deployerAddress)
            assert.equal(pendingRewards.toString(), expectedRewards.toString())
        })

        it("should return an amount of claimable rewards that is less than just rewardPerSec * timePassed, after the end of staking reward", async function () {
            // initial reward per sec is 39499007936507900 / 10 for single pool
            const rewardsPerSec = BigNumber.from("3949900793650790");
            const fiveYears = 1827 * 24 * 3600
            const expectedRewards = rewardsPerSec.mul(fiveYears)
            await time.increase(fiveYears)
            const pendingRewards = await singlePool.pendingRewards(deployerAddress)
            assert.isBelow(pendingRewards, expectedRewards)
        })
    })

    describe("pendingRewards Single Pool 2 users", async function () {
        beforeEach(async () => {
            await deployments.fixture(["main"])
            singlePool = await ethers.getContract("SnowfallPool")
            snowfallERC20 = await ethers.getContract("SnowfallERC20")
            await snowfallERC20.approve(singlePool.address, ethers.constants.MaxUint256)
            // transfer tokens to stake address
            snowfallERC20.transfer(stakerAddress, 10)
            const fiveYears = 1827 * 24 * 3600
            await snowfallERC20.connect(staker).approve(singlePool.address, ethers.constants.MaxUint256)
            await singlePool.stake(10, 1)
            await singlePool.connect(staker).stake(10, fiveYears)
        })

        it("should return amounts so that staker has 3 times more rewards than deployer after 8 seconds", async function () {
            // weight of deployer is 1, weight of staker is 6
            // for the first second only the deployer is staker, getting the full rewards
            // for the following seconds, staker gets 6/7 and deployer get 1/7 of the rewards

            // initial reward per sec is 39499007936507900 / 10 for single pool
            const rewardsPerSec = BigNumber.from("3949900793650790");
            const expectedRewardsStaker = rewardsPerSec.mul(6)
            const expectedRewardsDeployer = rewardsPerSec.mul(2)
            await time.increase(7)
            const pendingRewardsDeployer = await singlePool.pendingRewards(deployerAddress)
            const pendingRewardsStaker = await singlePool.pendingRewards(stakerAddress)
            assert.equal(pendingRewardsDeployer.toString(), expectedRewardsDeployer.toString())
            assert.equal(pendingRewardsStaker.toString(), expectedRewardsStaker.toString())
        })
    })

    describe("pendingRewards LP Pool", async function () {
        beforeEach(async () => {
            await deployments.fixture(["main"])
            lpPool = await ethers.getContract("SnowfallEthPool")
            snowfallERC20 = await ethers.getContract("SnowfallERC20")
            const chainId = network.config.chainId
            const uniswapFactoryAddress = networkConfig[chainId].UniswapV2Factory
            const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
            const IUniswapV2Factory = await ethers.getContractAt("IUniswapV2Factory", uniswapFactoryAddress, deployer)
            const lpTokenAddress = await IUniswapV2Factory.getPair(snowfallERC20.address, wethAddress)
            lpTokenERC20 = await ethers.getContractAt("IUniswapV2Pair", lpTokenAddress)
            await lpTokenERC20.approve(lpPool.address, ethers.constants.MaxUint256)
            await lpPool.stake(10, 1)
        })

        it("should return the amount of yield claimable by the staker", async function () {
            // initial reward per sec is 39499007936507900 * 9 / 10 for LP pool
            const rewardsPerSec = BigNumber.from("39499007936507900").mul(9).div(10);
            const expectedRewards = rewardsPerSec.mul(10)
            await time.increase(10)
            const pendingRewards = await lpPool.pendingRewards(deployerAddress)
            assert.equal(pendingRewards.toString(), expectedRewards.toString())
        })

        it("should return an amount of claimable rewards that is less than just rewardPerSec * timePassed, after the end of staking reward", async function () {
            // initial reward per sec is 39499007936507900 * 9 / 10 for LP pool
            const rewardsPerSec = BigNumber.from("39499007936507900").mul(9).div(10);
            const fiveYears = 1827 * 24 * 3600
            const expectedRewards = rewardsPerSec.mul(fiveYears)
            await time.increase(fiveYears)
            const pendingRewards = await lpPool.pendingRewards(deployerAddress)
            assert.isBelow(pendingRewards, expectedRewards)
        })
    })

    describe("pendingRewards LP Pool 2 users", async function () {
        beforeEach(async () => {
            await deployments.fixture(["main"])
            lpPool = await ethers.getContract("SnowfallEthPool")
            snowfallERC20 = await ethers.getContract("SnowfallERC20")
            const chainId = network.config.chainId
            const uniswapFactoryAddress = networkConfig[chainId].UniswapV2Factory
            const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
            const IUniswapV2Factory = await ethers.getContractAt("IUniswapV2Factory", uniswapFactoryAddress, deployer)
            const lpTokenAddress = await IUniswapV2Factory.getPair(snowfallERC20.address, wethAddress)
            lpTokenERC20 = await ethers.getContractAt("IUniswapV2Pair", lpTokenAddress)
            await lpTokenERC20.approve(lpPool.address, ethers.constants.MaxUint256)
            // transfer tokens to staker address
            lpTokenERC20.transfer(stakerAddress, 10)
            const fiveYears = 1827 * 24 * 3600
            await lpTokenERC20.connect(staker).approve(lpPool.address, ethers.constants.MaxUint256)
            await lpPool.stake(10, 1)
            await lpPool.connect(staker).stake(10, fiveYears)
        })

        it("should return amounts so that staker has 3 times more rewards than deployer after 8 seconds", async function () {
            // weight of deployer is 1, weight of staker is 6
            // for the first second only the deployer is staker, getting the full rewards
            // for the following seconds, staker gets 6/7 and deployer get 1/7 of the rewards

            // initial reward per sec is 39499007936507900 * 9 / 10 for single pool
            const rewardsPerSec = BigNumber.from("39499007936507900").mul(9).div(10);
            const expectedRewardsStaker = rewardsPerSec.mul(6)
            const expectedRewardsDeployer = rewardsPerSec.mul(2)
            await time.increase(7)
            const pendingRewardsDeployer = await lpPool.pendingRewards(deployerAddress)
            const pendingRewardsStaker = await lpPool.pendingRewards(stakerAddress)
            assert.equal(pendingRewardsDeployer.toString(), expectedRewardsDeployer.toString())
            assert.equal(pendingRewardsStaker.toString(), expectedRewardsStaker.toString())
        })
    })

    describe("claimYieldRewards Single Pool", async function () {
        beforeEach(async () => {
            await deployments.fixture(["main"])
            singlePool = await ethers.getContract("SnowfallPool")
            snowfallERC20 = await ethers.getContract("SnowfallERC20")
            await snowfallERC20.approve(singlePool.address, ethers.constants.MaxUint256)
            await singlePool.stake(10, 1)
        })

        it("should do nothing if the user doesn't have pending rewards", async function () {
            await singlePool.connect(staker).claimYieldRewards()
            const userLP = await singlePool.users(stakerAddress)
            const totalPoolWeightedSharesLP = await singlePool.totalPoolWeightedShares()
            const totalTokensInPoolLP = await singlePool.totalTokensInPool()
            assert.equal(userLP.totalWeightedShares.toString(), 0)
            assert.equal(totalPoolWeightedSharesLP.toString(), 10000000)
            assert.equal(totalTokensInPoolLP.toString(), 10)
        })

        it("should claim the rewards, mint tokens to single pool and emit Events", async function () {
            // initial reward per sec is 39499007936507900 / 10 for single pool
            const rewardsPerSec = BigNumber.from("3949900793650790");
            const expectedRewards = rewardsPerSec.mul(10)
            await time.increase(9)
            const claim = await singlePool.claimYieldRewards()

            await expect(claim).to.changeTokenBalance(snowfallERC20, singlePool, expectedRewards)
            await expect(claim).to.emit(snowfallERC20, "Transfer").withArgs(ethers.constants.AddressZero, singlePool.address, expectedRewards)
            await expect(claim).to.emit(singlePool, "Staked")
            await expect(claim).to.emit(singlePool, "ClaimYieldRewards").withArgs(deployerAddress, expectedRewards)
        })

        it("should claim the rewards, add a new stake for the user and update user and pool values", async function () {
            // initial reward per sec is 39499007936507900 / 10 for single pool
            const rewardsPerSec = BigNumber.from("3949900793650790");
            const expectedRewards = rewardsPerSec.mul(10)
            await time.increase(9)
            await singlePool.claimYieldRewards()
            const user = await singlePool.users(deployerAddress)
            const totalPoolWeightedSharesAfter = await singlePool.totalPoolWeightedShares()
            const totalTokensInPoolAfter = await singlePool.totalTokensInPool()

            assert.equal(user.totalWeightedShares.toString(), expectedRewards.mul(2 * 1e6).add(10000000).toString())
            assert.equal(totalPoolWeightedSharesAfter.toString(), expectedRewards.mul(2 * 1e6).add(10000000).toString())
            assert.equal(totalTokensInPoolAfter.toString(), expectedRewards.add(10).toString())
        })
    })

    describe("claimYieldRewards LP Pool", async function () {
        beforeEach(async () => {
            await deployments.fixture(["main"])
            lpPool = await ethers.getContract("SnowfallEthPool")
            snowfallERC20 = await ethers.getContract("SnowfallERC20")
            const chainId = network.config.chainId
            const uniswapFactoryAddress = networkConfig[chainId].UniswapV2Factory
            const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
            const IUniswapV2Factory = await ethers.getContractAt("IUniswapV2Factory", uniswapFactoryAddress, deployer)
            const lpTokenAddress = await IUniswapV2Factory.getPair(snowfallERC20.address, wethAddress)
            lpTokenERC20 = await ethers.getContractAt("IUniswapV2Pair", lpTokenAddress)
            await lpTokenERC20.approve(lpPool.address, ethers.constants.MaxUint256)
            await lpPool.stake(10, 1)
        })

        it("should do nothing if the user doesn't have pending rewards", async function () {
            await lpPool.connect(staker).claimYieldRewards()
            const userLP = await lpPool.users(stakerAddress)
            const totalPoolWeightedSharesLP = await lpPool.totalPoolWeightedShares()
            const totalTokensInPoolLP = await lpPool.totalTokensInPool()
            assert.equal(userLP.totalWeightedShares.toString(), 0)
            assert.equal(totalPoolWeightedSharesLP.toString(), 10000000)
            assert.equal(totalTokensInPoolLP.toString(), 10)
        })

        it("should claim the rewards, mint tokens to single pool and emit Events", async function () {
            // initial reward per sec is 39499007936507900 * 9 / 10 for lp pool
            const rewardsPerSec = BigNumber.from("39499007936507900").mul(9).div(10);
            const expectedRewards = rewardsPerSec.mul(10)
            await time.increase(9)
            const claim = await lpPool.claimYieldRewards()

            await expect(claim).to.changeTokenBalance(snowfallERC20, singlePool, expectedRewards)
            await expect(claim).to.emit(snowfallERC20, "Transfer").withArgs(ethers.constants.AddressZero, singlePool.address, expectedRewards)
            await expect(claim).to.emit(singlePool, "Staked")
            await expect(claim).to.emit(lpPool, "ClaimYieldRewards").withArgs(deployerAddress, expectedRewards)
        })

        it("should claim the rewards, add a new stake for the user and update user and pool values", async function () {
            // initial reward per sec is 39499007936507900 * 9 / 10 for lp pool
            const rewardsPerSec = BigNumber.from("39499007936507900").mul(9).div(10)
            const expectedRewards = rewardsPerSec.mul(10)
            await time.increase(9)
            await lpPool.claimYieldRewards()

            // claiming in LP pool affects single pool info
            const userSingle = await singlePool.users(deployerAddress)
            const totalPoolWeightedSharesSingle = await singlePool.totalPoolWeightedShares()
            const totalTokensInPoolSingle = await singlePool.totalTokensInPool()

            // and not change in LP Pool
            const userLP = await lpPool.users(deployerAddress)
            const totalPoolWeightedSharesLP = await lpPool.totalPoolWeightedShares()
            const totalTokensInPoolLP = await lpPool.totalTokensInPool()

            assert.equal(userSingle.totalWeightedShares.toString(), expectedRewards.mul(2 * 1e6).toString())
            assert.equal(totalPoolWeightedSharesSingle.toString(), expectedRewards.mul(2 * 1e6).toString())
            assert.equal(totalTokensInPoolSingle.toString(), expectedRewards.toString())

            assert.equal(userLP.totalWeightedShares.toString(), 10000000)
            assert.equal(totalPoolWeightedSharesLP.toString(), 10000000)
            assert.equal(totalTokensInPoolLP.toString(), 10)
        })
    })

    describe("claimYieldRewards LP Pool 2 users", async function () {
        beforeEach(async () => {
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
            await lpTokenERC20.approve(lpPool.address, ethers.constants.MaxUint256)
            // transfer tokens to staker address
            lpTokenERC20.transfer(stakerAddress, 10)
            const fiveYears = 1827 * 24 * 3600
            await lpTokenERC20.connect(staker).approve(lpPool.address, ethers.constants.MaxUint256)
            await lpPool.stake(10, 1)
            await lpPool.connect(staker).stake(10, fiveYears)
        })

        it("should claim the rewards so that the staker has 3 times more rewards than the deployer after 8 seconds", async function () {
            // weight of deployer is 1, weight of staker is 6
            // for the first second only the deployer is staker, getting the full rewards
            // for the following seconds, staker gets 6/7 and deployer get 1/7 of the rewards

            // initial reward per sec is 39499007936507900 * 9 / 10 for single pool
            const rewardsPerSec = BigNumber.from("39499007936507900").mul(9).div(10);
            const expectedRewardsStaker = rewardsPerSec.mul(6).add(rewardsPerSec.mul(6).div(7))
            const expectedRewardsDeployer = rewardsPerSec.mul(2)
            await time.increase(6)

            await lpPool.claimYieldRewards()
            await lpPool.connect(staker).claimYieldRewards()

            const deployerUser = await singlePool.users(deployerAddress)
            const stakerUser = await singlePool.users(stakerAddress)

            assert.equal(deployerUser.totalWeightedShares.toString(), expectedRewardsDeployer.mul(2 * 1e6).toString())
            assert.equal(stakerUser.totalWeightedShares.toString(), expectedRewardsStaker.mul(2 * 1e6).toString())
        })
    })

    describe("unstake Single Pool", async function () {
        beforeEach(async () => {
            await deployments.fixture(["main"])
            singlePool = await ethers.getContract("SnowfallPool")
            snowfallERC20 = await ethers.getContract("SnowfallERC20")
            await snowfallERC20.approve(singlePool.address, ethers.constants.MaxUint256)
            await singlePool.stake(10, 10)
        })

        it("should revert since the stake is not unlocked yet", async function () {
            await expect(singlePool.unstake(0))
                .to.be.revertedWithCustomError(singlePool, "CorePool__NotUnlockedYet")
        })

        it("should unstake the first stake (10 tokens), emit the event Unstake and transfer the token back", async function () {
            await time.increase(11)
            const unstake = await singlePool.unstake(0)

            await expect(unstake).to.changeTokenBalances(snowfallERC20, [singlePool, deployer], [-10, 10])
            await expect(unstake).to.emit(snowfallERC20, "Transfer").withArgs(singlePool.address, deployerAddress, 10)
            await expect(unstake).to.emit(singlePool, "Unstake").withArgs(deployerAddress, 0)
        })

        it("should unstake the first stake (10 tokens) and update the pool and user info", async function () {
            await time.increase(11)
            await singlePool.unstake(0)
            const user = await singlePool.users(deployerAddress)
            const totalPoolWeightedShares = await singlePool.totalPoolWeightedShares()
            const totalTokensInPool = await singlePool.totalTokensInPool()
            assert.equal(user.totalWeightedShares, 0)
            assert.equal(totalPoolWeightedShares, 0)
            assert.equal(totalTokensInPool, 0)
        })

        it("should unstake yield that vested for a year, emit the event Unstake and transfer the yield to the user", async function () {
            // initial reward per sec is 39499007936507900 / 10 for single pool
            const rewardsPerSec = BigNumber.from("3949900793650790");
            const expectedRewards = rewardsPerSec.mul(10)
            await time.increase(9)
            // claim rewards
            await singlePool.claimYieldRewards()
            // wait 1 year for the yield to vest
            await time.increase(3600 * 24 * 365)

            const unstake = await singlePool.unstake(1)

            await expect(unstake).to.changeTokenBalances(snowfallERC20, [singlePool, deployer], [expectedRewards.mul(-1), expectedRewards])
            await expect(unstake).to.emit(snowfallERC20, "Transfer").withArgs(singlePool.address, deployerAddress, expectedRewards)
            await expect(unstake).to.emit(singlePool, "Unstake").withArgs(deployerAddress, 1)
        })
    })

    describe("unstake LP Pool", async function () {
        beforeEach(async () => {
            await deployments.fixture(["main"])
            lpPool = await ethers.getContract("SnowfallEthPool")
            snowfallERC20 = await ethers.getContract("SnowfallERC20")
            const chainId = network.config.chainId
            const uniswapFactoryAddress = networkConfig[chainId].UniswapV2Factory
            const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
            const IUniswapV2Factory = await ethers.getContractAt("IUniswapV2Factory", uniswapFactoryAddress, deployer)
            const lpTokenAddress = await IUniswapV2Factory.getPair(snowfallERC20.address, wethAddress)
            lpTokenERC20 = await ethers.getContractAt("IUniswapV2Pair", lpTokenAddress)
            await lpTokenERC20.approve(lpPool.address, ethers.constants.MaxUint256)
            await lpPool.stake(10, 10)
        })

        it("should revert since the stake is not unlocked yet", async function () {
            await expect(lpPool.unstake(0))
                .to.be.revertedWithCustomError(lpPool, "CorePool__NotUnlockedYet")
        })

        it("should unstake the first stake (10 tokens), emit the event Unstake and transfer the token back", async function () {
            await time.increase(11)
            const unstake = await lpPool.unstake(0)

            await expect(unstake).to.changeTokenBalances(lpTokenERC20, [lpPool, deployer], [-10, 10])
            await expect(unstake).to.emit(lpTokenERC20, "Transfer").withArgs(lpPool.address, deployerAddress, 10)
            await expect(unstake).to.emit(lpPool, "Unstake").withArgs(deployerAddress, 0)
        })

        it("should unstake the first stake (10 tokens) and update the pool and user info", async function () {
            await time.increase(11)
            await lpPool.unstake(0)
            const user = await lpPool.users(deployerAddress)
            const totalPoolWeightedShares = await lpPool.totalPoolWeightedShares()
            const totalTokensInPool = await lpPool.totalTokensInPool()
            assert.equal(user.totalWeightedShares, 0)
            assert.equal(totalPoolWeightedShares, 0)
            assert.equal(totalTokensInPool, 0)
        })
    })
})
