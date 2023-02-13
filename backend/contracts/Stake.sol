// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

/**
 * @dev Stake library the Single and LP Pool.
 *
 * @dev Manage weight calculation and store constants
 *      related to stake period, weights, multipliers and rewards.
 */
library Stake {
    struct Data {
        /// @dev token amount staked
        uint120 value;
        /// @dev locking period - from
        uint64 lockedFrom;
        /// @dev locking period - until
        uint64 lockedUntil;
        /// @dev indicates if the stake was created as a yield reward
        bool isYield;
    }

    /**
     * @dev Stake weighted share is proportional to the stake value and time locked.
     *      Scaled to 1e6 to avoir loss in precision
     */
    uint256 internal constant WEIGHT_MULTIPLIER = 5 * 1e6;

    /// @dev Minimum weight value of the stake that is added to the weight multiplier calculation
    uint256 internal constant BASE_WEIGHT = 1e6;

    /// @dev Minimum period that someone can lock a stake for - 1 month
    // uint256 internal constant MIN_STAKE_PERIOD = 30 days;
    uint256 internal constant MIN_STAKE_PERIOD = 1 seconds;

    /// @dev Fixed lock period for claimed yield - 1 year
    uint256 internal constant YIELD_STAKE_PERIOD = 365 days;

    /// @dev Maximum period that someone can lock a stake for - 5 years
    uint256 internal constant MAX_STAKE_PERIOD = 1825 days;

    /// @dev Rewards per weight are stored multiplied by 1e20.
    uint256 internal constant REWARD_PER_SHARE_MULTIPLIER = 1e20;

    /// @dev Claimed yield is always locked for 1 year there weight is 2
    uint256 internal constant YIELD_STAKE_WEIGHT_MULTIPLIER = 2 * 1e6;

    /// @dev initial reward per second 39,499,007,936,507,900 (scaled by 1e18)
    uint256 internal constant INITIAL_TOTAL_REWARD_PER_SECOND =
        39499007936507900;

    /// @dev update reward/sec ratio every week (7*24*3600)
    uint256 internal constant SECONDS_PER_UPDATE = 604800;

    /**
     * @dev Stake weighted share is proportional to stake value and time locked.
     *      Time locked goes from 1 month to 5 years
     *      More time locked means more weight for the stake, weight going from 1 to 5.
     *      1 year lock => weight of 2 / 5 year lock => weight of 5
     * @param _stake data about the stake which is used to calculate its weighted share
     * @return weightShares of the stake
     */
    function weightedShares(
        Data storage _stake
    ) internal view returns (uint256) {
        return
            uint256(
                (((_stake.lockedUntil - _stake.lockedFrom) *
                    WEIGHT_MULTIPLIER) /
                    MAX_STAKE_PERIOD +
                    BASE_WEIGHT) * _stake.value
            );
    }

    /**
     * @dev Calculate the rewards earned by the staker since the last distribution
     *      Scaled down since reward per share was scaled up
     *
     * @param _weightedShares total weighted shares to calculate earnings
     * @param _rewardPerShare reward per share
     * @param _rewardPerSharePaid last reward per weight value used for staker earnings
     * @return rewards earned by staker
     */
    function earned(
        uint256 _weightedShares,
        uint256 _rewardPerShare,
        uint256 _rewardPerSharePaid
    ) internal pure returns (uint256) {
        return
            (_weightedShares * (_rewardPerShare - _rewardPerSharePaid)) /
            REWARD_PER_SHARE_MULTIPLIER;
    }

    /**
     * @dev Calculate the reward per share, scaled up to avoid loss in precision
     *
     * @param _reward yield reward
     * @param _globalWeightedShares total weighted shares in the pool
     * @return reward per share value
     */
    function getRewardPerShare(
        uint256 _reward,
        uint256 _globalWeightedShares
    ) internal pure returns (uint256) {
        return (_reward * REWARD_PER_SHARE_MULTIPLIER) / _globalWeightedShares;
    }
}
