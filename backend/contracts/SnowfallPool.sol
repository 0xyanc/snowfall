// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./CorePool.sol";

/**
 * @title Single Pool that accepts SNOW token for staking.
 * @author Yannick C.
 * @notice Most of the functionalities come from CorePool except for claimYieldRewards and stakeFromLPPool.
 */
contract SnowfallPool is CorePool {
    constructor(address _snowToken, address _lpToken) {
        snowToken = _snowToken;
        lpToken = _lpToken;
        // this pool accepts SNOW token for staking
        poolToken = _snowToken;

        // init the reward per second: 90% of rewards for LP pool - 10% for Single pool
        rewardPerSecond = uint192(Stake.INITIAL_TOTAL_REWARD_PER_SECOND / 10);
    }

    /**
     * @dev claims all pendingYield from the sender as a 1-year locked stake in the Single Pool
     */
    function claimYieldRewards() external override {
        // get link to a user data structure
        User storage user = users[msg.sender];
        // update user state
        _updateReward(msg.sender);
        // check pending yield rewards to claim and save to memory
        uint256 pendingYieldToClaim = uint256(user.pendingYield);
        // if pending yield is zero - just return silently
        if (pendingYieldToClaim == 0) return;
        // clears user pending yield
        user.pendingYield = 0;

        // calculate pending yield weight,
        // 2e6 is the bonus weight when staking for 1 year
        uint256 stakeWeightedShares = pendingYieldToClaim *
            Stake.YIELD_STAKE_WEIGHT_MULTIPLIER;
        // the yield will be locked for a year
        uint64 lockUntil = uint64(block.timestamp + Stake.YIELD_STAKE_PERIOD);
        // create new stake and push it into stakes array
        Stake.Data memory newStake = Stake.Data({
            value: uint120(pendingYieldToClaim),
            lockedFrom: uint64(block.timestamp),
            lockedUntil: lockUntil,
            isYield: true
        });
        // add memory stake to storage
        user.stakes.push(newStake);
        // updates total user weight with the newly created stake's weight
        user.totalWeightedShares += uint128(stakeWeightedShares);

        // update global variable
        totalPoolWeightedShares += stakeWeightedShares;
        // update reserve count
        totalTokensInPool += pendingYieldToClaim;

        // mint SNOW token to the Single Pool
        SnowfallERC20(snowToken).mint(address(this), pendingYieldToClaim);

        // emits ClaimYieldRewards event
        emit ClaimYieldRewards(msg.sender, pendingYieldToClaim);
        // emits Stake event
        emit Staked(
            msg.sender,
            (user.stakes.length - 1),
            pendingYieldToClaim,
            block.timestamp,
            lockUntil,
            Stake.YIELD_STAKE_WEIGHT_MULTIPLIER
        );
    }

    /**
     * @dev Executed by other LP Pool to claim the yield as a stake in the Single Pool.
     *
     * @param _staker an address which stakes (the yield reward)
     * @param _value amount to be staked (yield reward amount)
     */
    function stakeFromLPPool(
        address _staker,
        uint256 _value
    ) external override {
        if (_staker == address(0)) {
            revert CorePool__InvalidStakerAddress();
        }
        // expects caller to be a the LP Pool
        if (msg.sender != lpPoolAddress) {
            revert CorePool__NotFromLPPool();
        }
        // gets storage pointer to user
        User storage user = users[_staker];
        // update user state
        _updateReward(_staker);
        // calculates take weight based on how much yield has been generated
        // (by checking _value) and multiplies by the 2e6 constant, since
        // yield is always locked for a year.
        uint256 stakeWeight = _value * Stake.YIELD_STAKE_WEIGHT_MULTIPLIER;
        // the yield will be locked for a year
        uint64 lockUntil = uint64(block.timestamp + Stake.YIELD_STAKE_PERIOD);
        // initialize new yield stake being created in memory
        Stake.Data memory newStake = Stake.Data({
            value: uint120(_value),
            lockedFrom: uint64(block.timestamp),
            lockedUntil: lockUntil,
            isYield: true
        });
        // sum new yield stake weight to user's total weight
        user.totalWeightedShares += uint128(stakeWeight);
        // add the new yield stake to storage
        user.stakes.push(newStake);
        // update global weight and global pool token count
        totalPoolWeightedShares += stakeWeight;
        totalTokensInPool += _value;

        // mint SNOW token to the Single Pool
        SnowfallERC20(snowToken).mint(address(this), _value);

        // emits Stake event
        emit Staked(
            _staker,
            (user.stakes.length - 1),
            _value,
            block.timestamp,
            lockUntil,
            Stake.YIELD_STAKE_WEIGHT_MULTIPLIER
        );
    }
}
