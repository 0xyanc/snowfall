// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./CorePool.sol";

error SnowfallEthPool__CannotCallThisFunction();

/**
 * @title LP Token Pool accepting SNOW/ETH LP token for the stakes.
 * @author Yannick C.
 * @notice This pool gets 90% of the yield farming rewards to incentivise deep liquidity of SNOW.
 *         Most of the functionalities come from CorePool except for claimYieldRewards.
 */
contract SnowfallEthPool is CorePool {
    constructor(address _snowToken, address _lpToken) {
        snowToken = _snowToken;
        lpToken = _lpToken;
        // This pool accepts the lp token for staking
        poolToken = _lpToken;

        // init the reward per second: 90% of rewards for LP pool - 10% for Single pool
        rewardPerSecond = uint192(
            (Stake.INITIAL_TOTAL_REWARD_PER_SECOND * 9) / 10
        );
    }

    /**
     * @dev claim all pendingYield from the sender as a 1-year locked stake in the Single Pool
     */
    function claimYieldRewards() external override {
        // get link to a user data structure, we will write into it later
        User storage user = users[msg.sender];
        // update user state
        _updateReward(msg.sender);
        // check pending yield rewards to claim and save to memory
        uint256 pendingYieldToClaim = uint256(user.pendingYield);
        // if pending yield is zero - just return silently
        if (pendingYieldToClaim == 0) return;
        // clears user pending yield
        user.pendingYield = 0;

        // if this is the LP Pool call the Single Pool to create a new stake
        CorePool(singlePoolAddress).stakeFromLPPool(
            msg.sender,
            pendingYieldToClaim
        );

        // emits an event
        emit ClaimYieldRewards(msg.sender, pendingYieldToClaim);
    }

    /**
     * @notice this function always reverts as it should only be implemented in the Single
     */
    function stakeFromLPPool(
        address _staker,
        uint256 _value
    ) external pure override {
        revert SnowfallEthPool__CannotCallThisFunction();
    }
}
