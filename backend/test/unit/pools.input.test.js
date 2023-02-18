const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")

if (!developmentChains.includes(network.name)) {
    describe.skip
    return
}
describe("Unit tests of Error management for the Staking contracts", function () {
    let accounts
    let singlePool
    let lpPool
    before(async () => {
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        deployerAddress = await deployer.getAddress()
        staker = accounts[1]
        stakerAddress = await staker.getAddress()
    })

    describe("initialize", async function () {
        beforeEach(async () => {
            await deployments.fixture(["main"])
            singlePool = await ethers.getContract("SnowfallPool")
        })

        it("should revert if the sender tries to initialize the pool while not being the owner", async function () {
            await expect(singlePool.connect(staker).initialize(deployerAddress, stakerAddress))
                .to.be.revertedWith("Ownable: caller is not the owner")
        })

        it("should revert if the owner tries to initialize the pool again", async function () {
            await expect(singlePool.initialize(deployerAddress, stakerAddress))
                .to.be.revertedWithCustomError(singlePool, "CorePool__AlreadyInitialized")
        })
    })

    describe("stake", async function () {
        beforeEach(async () => {
            await deployments.fixture(["main"])
            singlePool = await ethers.getContract("SnowfallPool")
        })
        it("should revert if the amount staked is 0", async function () {
            await expect(singlePool.stake(0, 1))
                .to.be.revertedWithCustomError(singlePool, "CorePool__ValueCannotBeZero")
        })
        it("should revert if the lock duration is lower than the min stake period", async function () {
            await expect(singlePool.stake(1, 0))
                .to.be.revertedWithCustomError(singlePool, "CorePool__InvalidLockPeriod")
        })
        it("should revert if the lock duration is higher than the max stake period", async function () {
            const maxStakePeriod = 1827 * 24 * 3600
            await expect(singlePool.stake(1, maxStakePeriod + 1))
                .to.be.revertedWithCustomError(singlePool, "CorePool__InvalidLockPeriod")
        })
    })

    describe("pendingRewards", async function () {
        beforeEach(async () => {
            await deployments.fixture(["main"])
            singlePool = await ethers.getContract("SnowfallPool")
        })
        it("should revert if the staker is address 0", async function () {
            await expect(singlePool.pendingRewards(ethers.constants.AddressZero))
                .to.be.revertedWithCustomError(singlePool, "CorePool__InvalidStakerAddress")
        })
        it("should return 0 when no one has done any stake yet", async function () {
            const reward = await singlePool.pendingRewards(deployerAddress)
            assert.equal(reward, 0)
        })
    })

    describe("updateRewardPerSecond", async function () {
        beforeEach(async () => {
            await deployments.fixture(["main"])
            singlePool = await ethers.getContract("SnowfallPool")
        })
        it("should revert if the staker is address 0", async function () {
            await expect(singlePool.updateRewardPerSecond())
                .to.be.revertedWithCustomError(singlePool, "CorePool__CannotUpdateRewardRatioYet")
        })
    })

    describe("stakeFromLPPool", async function () {
        beforeEach(async () => {
            await deployments.fixture(["main"])
            singlePool = await ethers.getContract("SnowfallPool")
            lpPool = await ethers.getContract("SnowfallEthPool")
        })
        it("should revert if the staker is address 0", async function () {
            await expect(singlePool.stakeFromLPPool(ethers.constants.AddressZero, 1))
                .to.be.revertedWithCustomError(singlePool, "CorePool__InvalidStakerAddress")
        })
        it("should revert if the caller is not the LP Pool", async function () {
            await expect(singlePool.stakeFromLPPool(deployerAddress, 1))
                .to.be.revertedWithCustomError(singlePool, "CorePool__NotFromLPPool")
        })
        it("should revert if the LP Pool stakeFromLPPool function", async function () {
            await expect(lpPool.stakeFromLPPool(deployerAddress, 1))
                .to.be.revertedWithCustomError(lpPool, "SnowfallEthPool__CannotCallThisFunction")
        })
    })
})