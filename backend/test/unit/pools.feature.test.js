const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers")

if (!developmentChains.includes(network.name)) {
    describe.skip
    return
}
describe("Unit tests of pool features for the Staking contracts", function () {
    let accounts
    let singlePool
    let lpPool
    let snowfallERC20
    before(async () => {
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        deployerAddress = await deployer.getAddress()
        staker = accounts[1]
        stakerAddress = await staker.getAddress()
    })

    describe("stake", async function () {
        beforeEach(async () => {
            await deployments.fixture(["all"])
            singlePool = await ethers.getContract("SnowfallPool")
            snowfallERC20 = await ethers.getContract("SnowfallERC20")
            await snowfallERC20.approve(singlePool.address, ethers.constants.MaxUint256)
        })

        it("should stake 10 tokens for 1 second with weight 1, transfer SNOW token and emit the event Staked", async function () {
            const balanceDeployerBefore = await snowfallERC20.balanceOf(deployerAddress)
            const balanceSinglePoolBefore = await snowfallERC20.balanceOf(singlePool.address)
            const stake = await singlePool.stake(10, 1)
            const balanceDeployerAfter = await snowfallERC20.balanceOf(deployerAddress)
            const balanceSinglePoolAfter = await snowfallERC20.balanceOf(singlePool.address)
            assert.equal(balanceDeployerAfter.toString(), balanceDeployerBefore.sub(10).toString())
            assert.equal(balanceSinglePoolAfter.toString(), balanceSinglePoolBefore.add(10).toString())
            expect(stake).to.emit(snowfallERC20, "Transfer").withArgs(deployerAddress, singlePool.address, 10)
            expect(stake).to.emit(singlePool, "Staked").withArgs(deployerAddress, 0, 10, Date.now(), (Date.now() / 1000) + 3600, 1)
        })

        it("should stake 10 tokens for 5 years with weight 5 and emit the event Staked", async function () {
            const fiveYears = 1827 * 24 * 3600
            const stake = await singlePool.stake(10, fiveYears)
            expect(stake).to.emit(snowfallERC20, "Transfer").withArgs(deployerAddress, singlePool.address, 10)
            expect(stake).to.emit(singlePool, "Staked").withArgs(deployerAddress, 0, 10, Date.now(), (Date.now() / 1000) + fiveYears, 5)
        })

        it("should stake 10 tokens for 5 years and update the pool and user stake values", async function () {
            const fiveYears = 1827 * 24 * 3600
            const stake = await singlePool.stake(10, fiveYears)
            const user = await singlePool.users(deployerAddress)
            const totalPoolWeightedShares = await singlePool.totalPoolWeightedShares()
            const totalTokensInPool = await singlePool.totalTokensInPool()
            assert.equal(user.totalWeightedShares, 60000000)
            assert.equal(totalPoolWeightedShares, 60000000)
            assert.equal(totalTokensInPool, 10)
        })
    })

    describe("unstake", async function () {
        beforeEach(async () => {
            await deployments.fixture(["all"])
            singlePool = await ethers.getContract("SnowfallPool")
            snowfallERC20 = await ethers.getContract("SnowfallERC20")
            await snowfallERC20.approve(singlePool.address, ethers.constants.MaxUint256)
            await singlePool.stake(10, 3600)
        })

        it("should revert since the stake is not unlocked yet", async function () {
            await expect(singlePool.unstake(0))
                .to.be.revertedWithCustomError(singlePool, "CorePool__NotUnlockedYet")
        })

        it("should unstake the first stake (10 tokens), emit the event Unstake and transfer the token back", async function () {
            await time.increase(3610)
            const balanceDeployerBefore = await snowfallERC20.balanceOf(deployerAddress)
            const balanceSinglePoolBefore = await snowfallERC20.balanceOf(singlePool.address)
            const unstake = await singlePool.unstake(0)
            const balanceDeployerAfter = await snowfallERC20.balanceOf(deployerAddress)
            const balanceSinglePoolAfter = await snowfallERC20.balanceOf(singlePool.address)
            assert.equal(balanceDeployerAfter.toString(), balanceDeployerBefore.add(10).toString())
            assert.equal(balanceSinglePoolAfter.toString(), balanceSinglePoolBefore.sub(10).toString())
            expect(unstake).to.emit(snowfallERC20, "Transfer").withArgs(singlePool.address, deployerAddress, 10)
            expect(unstake).to.emit(singlePool, "Unstake").withArgs(deployerAddress, 0)
        })

        it("should unstake the first stake (10 tokens) and update the pool and user info", async function () {
            await time.increase(3610)
            await singlePool.unstake(0)
            const user = await singlePool.users(deployerAddress)
            const totalPoolWeightedShares = await singlePool.totalPoolWeightedShares()
            const totalTokensInPool = await singlePool.totalTokensInPool()
            assert.equal(user.totalWeightedShares, 0)
            assert.equal(totalPoolWeightedShares, 0)
            assert.equal(totalTokensInPool, 0)
        })
    })

    describe.only("updateRewardPerSecond", async function () {
        beforeEach(async () => {
            await deployments.fixture(["all"])
            singlePool = await ethers.getContract("SnowfallPool")
            snowfallERC20 = await ethers.getContract("SnowfallERC20")
            await snowfallERC20.approve(singlePool.address, ethers.constants.MaxUint256)
            await singlePool.stake(10, 3600)
        })

        // it("should revert since the stake is not unlocked yet", async function () {
        //     await expect(singlePool.unstake(0))
        //         .to.be.revertedWithCustomError(singlePool, "CorePool__NotUnlockedYet")
        // })

        // it("should unstake the first stake (10 tokens), emit the event Unstake and transfer the token back", async function () {
        //     await time.increase(3610)
        //     const balanceDeployerBefore = await snowfallERC20.balanceOf(deployerAddress)
        //     const balanceSinglePoolBefore = await snowfallERC20.balanceOf(singlePool.address)
        //     const unstake = await singlePool.unstake(0)
        //     const balanceDeployerAfter = await snowfallERC20.balanceOf(deployerAddress)
        //     const balanceSinglePoolAfter = await snowfallERC20.balanceOf(singlePool.address)
        //     assert.equal(balanceDeployerAfter.toString(), balanceDeployerBefore.add(10).toString())
        //     assert.equal(balanceSinglePoolAfter.toString(), balanceSinglePoolBefore.sub(10).toString())
        //     expect(unstake).to.emit(snowfallERC20, "Transfer").withArgs(singlePool.address, deployerAddress, 10)
        //     expect(unstake).to.emit(singlePool, "Unstake").withArgs(deployerAddress, 0)
        // })

        // it("should unstake the first stake (10 tokens) and update the pool and user info", async function () {
        //     await time.increase(3610)
        //     await singlePool.unstake(0)
        //     const user = await singlePool.users(deployerAddress)
        //     const totalPoolWeightedShares = await singlePool.totalPoolWeightedShares()
        //     const totalTokensInPool = await singlePool.totalTokensInPool()
        //     assert.equal(user.totalWeightedShares, 0)
        //     assert.equal(totalPoolWeightedShares, 0)
        //     assert.equal(totalTokensInPool, 0)
        // })
    })

    // describe("stake", async function () {
    //     beforeEach(async () => {
    //         await deployments.fixture(["all"])
    //         singlePool = await ethers.getContract("SnowfallPool")
    //     })
    //     it("should revert if the amount staked is 0", async function () {
    //         await expect(singlePool.stake(0, 1))
    //             .to.be.revertedWithCustomError(singlePool, "CorePool__ValueCannotBeZero")
    //     })
    //     it("should revert if the lock duration is higher than the max stake period", async function () {
    //         const maxStakePeriod = 1827 * 24 * 3600
    //         await expect(singlePool.stake(1, maxStakePeriod + 1))
    //             .to.be.revertedWithCustomError(singlePool, "CorePool__InvalidLockPeriod")
    //     })
    // })

    // describe("pendingRewards", async function () {
    //     beforeEach(async () => {
    //         await deployments.fixture(["all"])
    //         singlePool = await ethers.getContract("SnowfallPool")
    //     })
    //     it("should revert if the staker is address 0", async function () {
    //         await expect(singlePool.pendingRewards(ethers.constants.AddressZero))
    //             .to.be.revertedWithCustomError(singlePool, "CorePool__InvalidStakerAddress")
    //     })
    //     it("should return 0 when no one has done any stake yet", async function () {
    //         const reward = await singlePool.pendingRewards(deployerAddress)
    //         assert.equal(reward, 0)
    //     })
    // })

    // describe("updateRewardPerSecond", async function () {
    //     beforeEach(async () => {
    //         await deployments.fixture(["all"])
    //         singlePool = await ethers.getContract("SnowfallPool")
    //     })
    //     it("should revert if the staker is address 0", async function () {
    //         await expect(singlePool.updateRewardPerSecond())
    //             .to.be.revertedWithCustomError(singlePool, "CorePool__CannotUpdateRewardRatioYet")
    //     })
    // })

    // describe("stakeFromLPPool", async function () {
    //     beforeEach(async () => {
    //         await deployments.fixture(["all"])
    //         singlePool = await ethers.getContract("SnowfallPool")
    //         lpPool = await ethers.getContract("SnowfallEthPool")
    //     })
    //     it("should revert if the staker is address 0", async function () {
    //         await expect(singlePool.stakeFromLPPool(ethers.constants.AddressZero, 1))
    //             .to.be.revertedWithCustomError(singlePool, "CorePool__InvalidStakerAddress")
    //     })
    //     it("should revert if the caller is not the LP Pool", async function () {
    //         await expect(singlePool.stakeFromLPPool(deployerAddress, 1))
    //             .to.be.revertedWithCustomError(singlePool, "CorePool__NotFromLPPool")
    //     })
    //     it("should revert if the LP Pool stakeFromLPPool function", async function () {
    //         await expect(lpPool.stakeFromLPPool(deployerAddress, 1))
    //             .to.be.revertedWithCustomError(lpPool, "SnowfallEthPool__CannotCallThisFunction")
    //     })
    // })
})