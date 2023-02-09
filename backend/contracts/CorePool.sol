// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./Stake.sol";
import "./SnowfallERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error CorePool__InvalidStakerAddress();
error CorePool__CannotUpdateRewardRatioYet();
error CorePool__ValueCannotBeZero();
error CorePool__InvalidLockPeriod();
error CorePool__NotUnlockedYet();
error CorePool__ValueMoreThanStakeValue();
error CorePool__AlreadyInitialized();
error CorePool__NotFromLPPool();

/**
 * @title Abstract contract holding the core and common functionalities for Single and LP Pools.
 * @author Yannick C.
 */
abstract contract CorePool is Ownable {
    /// @dev Data structure representing a user in a pool.
    struct User {
        /// @dev pending yield rewards to be claimed
        uint128 pendingYield;
        /// @dev Total weighted shares of the user
        uint128 totalWeightedShares;
        /// @dev Checkpoint variable for yield calculation
        uint256 yieldRewardsPerSharePaid;
        /// @dev An array of the user's stakes
        Stake.Data[] stakes;
    }

    /// @dev SNOW token address
    address public snowToken;
    /// @dev SNOW/ETH LP token address
    address public lpToken;
    /// @dev token that can be staked in the pool
    address public poolToken;

    ///@dev address of the Single Pool - used by the LP Pool for staking the yield rewards
    address internal singlePoolAddress;
    /// @dev address of the LP Pool - used by the Single Pool in stakeAsLPPool to verify the sender
    address internal lpPoolAddress;

    /// @dev Total pool token staked in the pool
    uint256 public totalTokensInPool;
    /// @dev Timestamp of the last yield distribution event.
    uint64 public lastYieldDistribution;
    /// @dev Used to calculate yield rewards (equivalent to rewardIndex)
    uint256 public yieldRewardsPerShare;
    /**
     * @dev Total weighted shares in the pool, the sum of the weighted shares of the stakers.
     *      Used to calculate rewards, keeps track of the tokens weight locked in staking.
     */
    uint256 public totalPoolWeightedShares;

    /// @dev number of SNOW rewarded to stakers per second, increases by 1% every week.
    uint192 public rewardPerSecond;

    /// @dev timestamp of the last reward per second update, used to check when the ratio can be updated.
    uint32 public lastRewardPerSecUpdate;

    /// @dev last timestamp for yield farming, after this point no rewards are accruing.
    uint32 public endTime;

    /// @dev set to true after successful initialization
    bool private initialized;

    /// @dev User storage, maps an address a User.
    mapping(address => User) public users;

    /**
     * @dev Fired in stake() and stakeAsPool()
     * @param account token holder address, the tokens will be returned to that address
     * @param stakeId id of the new stake created
     * @param value value of tokens staked
     * @param lockUntil timestamp indicating when tokens should unlock (max 5 years)
     */
    event Staked(
        address indexed account,
        uint256 stakeId,
        uint256 value,
        uint64 lockUntil
    );

    /**
     * @dev Fired in unstake()
     *
     * @param account address receiving the tokens
     * @param stakeId id value of the stake
     * @param value number of tokens unstaked
     * @param isYield whether stake struct unstaked was coming from yield or not
     */
    event Unstake(
        address indexed account,
        uint256 stakeId,
        uint256 value,
        bool isYield
    );

    /**
     * @dev Fired in claimYieldRewards()
     *
     * @param account an address which received the yield
     * @param value value of yield paid
     */
    event ClaimYieldRewards(address indexed account, uint256 value);

    /**
     * @dev Fired in updateRewardPerSecond()
     *
     * @param by address which executed the update
     * @param newRewardPerSecond new SNOW/second value
     */
    event UpdateRewardPerSecond(address indexed by, uint256 newRewardPerSecond);

    /**
     * @dev Fired in updateRewards()
     *
     * @param account an address which received the yield
     * @param yieldValue value of yield processed
     */
    event UpdateRewards(address indexed account, uint256 yieldValue);

    /**
     * @dev Fired in sync()
     *
     * @param by address which performed the sync
     * @param yieldRewardsPerShare updated yield rewards per share value
     * @param lastYieldDistribution usually, current timestamp
     */
    event Synced(
        address indexed by,
        uint256 yieldRewardsPerShare,
        uint64 lastYieldDistribution
    );

    /**
     * @notice Initialize the pool variables, can only be done once
     *
     * @param _singlePoolAddress address of the Single Pool (SnowfallPool)
     * @param _lpPoolAddress address of the LP token staking pool (SnowfallEthPool)
     */
    function initialize(
        address _singlePoolAddress,
        address _lpPoolAddress
    ) external onlyOwner {
        if (initialized) {
            revert CorePool__AlreadyInitialized();
        }
        singlePoolAddress = _singlePoolAddress;
        lpPoolAddress = _lpPoolAddress;
        // set duration of yield farming to 5 years = 260 weeks
        endTime = uint32(block.timestamp + 260 weeks);
        // init lastRewardPerSecUpdate
        lastRewardPerSecUpdate = uint32(block.timestamp);
        // init lastYieldDistribution
        lastYieldDistribution = uint64(block.timestamp);
        // set initialized to true, this function cannot be called anymore
        initialized = true;
    }

    /**
     * @notice Stakes specified value of tokens and lock them for the specified value of time
     *
     * @param _value value of tokens to stake
     * @param _lockDuration stake duration as timestamp
     */
    function stake(uint256 _value, uint64 _lockDuration) external {
        // validate the inputs
        if (_value == 0) {
            revert CorePool__ValueCannotBeZero();
        }
        if (
            _lockDuration < Stake.MIN_STAKE_PERIOD ||
            _lockDuration > Stake.MAX_STAKE_PERIOD
        ) {
            revert CorePool__InvalidLockPeriod();
        }

        // get a link to user data struct, we will write to it later
        User storage user = users[msg.sender];
        // update user state
        _updateReward(msg.sender);

        // calculates until when a stake is going to be locked
        uint64 lockUntil = uint64(block.timestamp) + _lockDuration;
        // stake weight formula rewards for locking
        uint256 stakeWeight = (((lockUntil - uint64(block.timestamp)) *
            Stake.WEIGHT_MULTIPLIER) /
            Stake.MAX_STAKE_PERIOD +
            Stake.BASE_WEIGHT) * _value;
        // makes sure stakeWeight is valid
        assert(stakeWeight > 0);
        // create and save the stake (append it to stakes array)
        Stake.Data memory userStake = Stake.Data({
            value: uint120(_value),
            lockedFrom: uint64(block.timestamp),
            lockedUntil: lockUntil,
            isYield: false
        });
        // pushes new stake to `stakes` array
        user.stakes.push(userStake);
        // update user weight
        user.totalWeightedShares += uint128(stakeWeight);
        // update global weight value and global pool token count
        totalPoolWeightedShares += stakeWeight;
        totalTokensInPool += _value;

        // transfer `_value`
        SnowfallERC20(snowToken).transferFrom(
            address(msg.sender),
            address(this),
            _value
        );

        // emit Staked event
        emit Staked(msg.sender, (user.stakes.length - 1), _value, lockUntil);
    }

    /**
     * @dev Unstakes a stake that is now unlocked.
     *      If the stake was from yield rewards, transfer SNOW to the staker that was
     *      previously minted at claim time.
     *      Otherwise transfer SNOW or LP from the contract balance.
     *
     * @param _stakeId stake ID to unstake from, zero-indexed
     * @param _value value of tokens to unstake
     */
    function unstake(uint256 _stakeId, uint256 _value) external {
        // verify a value is set
        if (_value == 0) {
            revert CorePool__ValueCannotBeZero();
        }

        // get a pointer to user data struct
        User storage user = users[msg.sender];
        // get a pointer to the corresponding stake
        Stake.Data storage userStake = user.stakes[_stakeId];
        // check if the stake is unlocked
        if (block.timestamp < userStake.lockedUntil) {
            revert CorePool__NotUnlockedYet();
        }

        // save values in the case the stake is deleted later (if unstaking the full amount)
        (uint120 stakeValue, bool isYield) = (
            userStake.value,
            userStake.isYield
        );
        // verify available balance
        if (_value > stakeValue) {
            revert CorePool__ValueMoreThanStakeValue();
        }
        // process current pending rewards if any
        _updateReward(msg.sender);
        // store weighted shares of this stake
        uint256 stakeWeightedShares = Stake.weightedShares(userStake);
        // value used to save new weighted shares of this stake
        uint256 newWeightedShares;

        // update the stake, or delete it if its depleted
        if (stakeValue - _value == 0) {
            // deletes stake struct, no need to save new weight because it stays 0
            delete user.stakes[_stakeId];
        } else {
            userStake.value -= uint120(_value);
            // saves new weight to memory
            newWeightedShares = Stake.weightedShares(userStake);
        }
        // update user total weighted shares with unstaked amount
        user.totalWeightedShares = uint128(
            user.totalWeightedShares - stakeWeightedShares + newWeightedShares
        );
        // update global weight variable with unstaked amount
        totalPoolWeightedShares =
            totalPoolWeightedShares -
            stakeWeightedShares +
            newWeightedShares;
        // update global pool token count
        totalTokensInPool -= _value;

        // if the stake as yield reward
        if (isYield) {
            // Transfer the unlocked yield to the sender
            SnowfallERC20(snowToken).transfer(msg.sender, _value);
        } else {
            // otherwise return the deposited tokens back to the staker
            IERC20(poolToken).transfer(msg.sender, _value);
        }

        // emits Unstake event
        emit Unstake(msg.sender, _stakeId, _value, isYield);
    }

    /**
     * @dev claims all pendingYield from the sender as a 1-year locked stake in the Single Pool
     */
    function claimYieldRewards() external virtual;

    /**
     * @dev Executed by the LP Pool to claim the yield as a stake in the Single Pool.
     *
     * @param _staker an address which stakes (the yield reward)
     * @param _value amount to be staked (yield reward amount)
     */
    function stakeFromLPPool(address _staker, uint256 _value) external virtual;

    /**
     * @notice Calculates current yield rewards value available for the specified address
     * @dev helper function for frontend display
     * @param _staker an address to calculate yield rewards value for
     * @return yield available to claim by the staker
     */
    function pendingRewards(address _staker) external view returns (uint256) {
        if (_staker == address(0)) {
            revert CorePool__InvalidStakerAddress();
        }
        // `newYieldRewardsPerWeight` will be the stored or recalculated value for `yieldRewardsPerWeight`
        // uint256 newYieldRewardsPerShare;
        // // gas savings
        // uint256 _lastYieldDistribution = lastYieldDistribution;

        // based on the rewards per weight value, calculate pending rewards;
        User storage user = users[_staker];

        // // if smart contract state was not updated recently, `yieldRewardsPerWeight` value
        // // is outdated and we need to recalculate it in order to calculate pending rewards correctly
        // if (now > _lastYieldDistribution && totalPoolWeightedShares != 0) {
        //     uint256 multiplier = now > endTime
        //         ? endTime - _lastYieldDistribution
        //         : now - _lastYieldDistribution;
        //     uint256 rewards = multiplier * rewardPerSecond;

        //     // recalculated value for `yieldRewardsPerWeight`
        //     newYieldRewardsPerShare =
        //         Stake.getRewardPerShare(rewards, totalPoolWeightedShares) +
        //         yieldRewardsPerShare;
        // } else {
        //     // if smart contract state is up to date, we don't recalculate
        //     newYieldRewardsPerShare = yieldRewardsPerShare;
        // }

        return
            Stake.earned(
                user.totalWeightedShares,
                yieldRewardsPerShare,
                user.yieldRewardsPerSharePaid
            ) + user.pendingYield;
    }

    /**
     * @notice Increase reward/second by 1%, can be executed no more than once per week
     *
     * @dev in case there is not enough interactions with the contract,
     *      this function is called every week by a script to ensure that the ratio is updated
     */
    function updateRewardPerSecond() public {
        // checks if ratio can be updated i.e. if seconds/update have passed
        if (!shouldUpdateRatio()) {
            revert CorePool__CannotUpdateRewardRatioYet();
        }

        // increases reward/sec by 1%.
        rewardPerSecond = (rewardPerSecond * 101) / 100;

        // set current timestamp as the last ratio update timestamp
        lastRewardPerSecUpdate = uint32(block.timestamp);

        // emit UpdateRewardPerSecond event
        emit UpdateRewardPerSecond(msg.sender, rewardPerSecond);
    }

    /**
     * @dev Must be called on every mutating action in the smart contract.
     * @dev Synchronize the global pool state, process the user pending rewards
     *      and update checkpoint values stored in the user struct.
     *
     * @param _staker user address
     */
    function _updateReward(address _staker) internal {
        if (_staker == address(0)) {
            revert CorePool__InvalidStakerAddress();
        }
        // update pool state
        sync();
        // gets storage reference to the user
        User storage user = users[_staker];

        // calculates pending yield to be added
        uint256 pendingYield = Stake.earned(
            user.totalWeightedShares,
            yieldRewardsPerShare,
            user.yieldRewardsPerSharePaid
        );
        // increases stored user.pendingYield with value returned
        user.pendingYield += uint128(pendingYield);

        // updates user checkpoint values for future calculations
        user.yieldRewardsPerSharePaid = yieldRewardsPerShare;

        // emit an event
        emit UpdateRewards(_staker, pendingYield);
    }

    /**
     * @dev Update the pool state for reward calculations - yieldRewardsPerShare and lastYieldDistribution
     */
    function sync() private {
        // update rewards per second value if required
        if (shouldUpdateRatio()) {
            updateRewardPerSecond();
        }

        // to calculate the reward we need to know how many seconds passed, and reward per second
        uint256 currentTimestamp = block.timestamp > endTime
            ? endTime
            : block.timestamp;
        uint256 secondsPassed = currentTimestamp - lastYieldDistribution;

        // calculate the reward
        uint256 reward = secondsPassed * rewardPerSecond;

        // update rewards per weight and `lastYieldDistribution`
        yieldRewardsPerShare += Stake.getRewardPerShare(
            reward,
            totalPoolWeightedShares
        );
        // set the lastYieldDistribution
        lastYieldDistribution = uint64(currentTimestamp);

        // emit Synced event
        emit Synced(msg.sender, yieldRewardsPerShare, lastYieldDistribution);
    }

    /**
     * @dev Verify if enough time has passed since last reward/second
     *      ratio update and if so increase reward per second by 1%.
     *
     * @return true if enough time has passed
     */
    function shouldUpdateRatio() private view returns (bool) {
        // if yield farming period has ended
        if (block.timestamp > endTime) {
            // reward per second cannot be updated anymore
            return false;
        }

        // check if SECONDS_PER_UPDATE have passed since last update
        return
            block.timestamp >=
            lastRewardPerSecUpdate + Stake.SECONDS_PER_UPDATE;
    }
}
