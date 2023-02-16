const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")

if (!developmentChains.includes(network.name)) {
    describe.skip
    return
}
describe("Unit tests of Snowfall ERC20", function () {
    let accounts
    let snowfallERC20
    before(async () => {
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        deployerAddress = await deployer.getAddress()
        minter = accounts[1]
        minterAddress = await minter.getAddress()
    })

    describe("Snowfall ERC20", async function () {
        before(async () => {
            await deployments.fixture(["snowERC20"])
            snowfallERC20 = await ethers.getContract("SnowfallERC20")
        })

        it("should create Snowfall ERC20 with 7,000,000 supply", async function () {
            const supply = await snowfallERC20.totalSupply()
            const expectedSupply = ethers.utils.parseUnits("70000000", "ether")
            assert.equal(supply.toString(), expectedSupply.toString())
        })
        it("should revert if the sender tries to mint SNOW without the role MINTER_ROLE", async function () {
            await expect(snowfallERC20.connect(minter).mint(minterAddress, 1))
                .to.be.revertedWith("AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6")
        })
        it("should successfully add MINTER_ROLE", async function () {
            await snowfallERC20.grantRole("0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6", minterAddress)
            const hasMinterRole = await snowfallERC20.hasRole("0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6", minterAddress)
            assert.equal(hasMinterRole, true)
        })
        it("should successfully mint tokens from a MINTER_ROLE", async function () {
            await snowfallERC20.connect(minter).mint(minterAddress, 1)
            const balance = await snowfallERC20.balanceOf(minterAddress)
            assert.equal(balance.toString(), 1)
        })
    })
})