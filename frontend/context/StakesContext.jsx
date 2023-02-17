import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { useContractProvider } from "./ContractContext";
import { ethers } from "ethers";
import { WEIGHT_MULTIPLIER } from "@/util/Constants";

const StakesContext = createContext();

export function useStakesProvider() {
  const context = useContext(StakesContext);

  if (!context) {
    throw new Error("useStakesProvider must be used within a StakesProvider");
  }
  return context;
}

export const StakesProvider = ({ children }) => {
  const { readSinglePoolContract, readLpPoolContract, provider } = useContractProvider();
  const { address, isConnected } = useAccount();
  const [stakes, _setStakes] = useState([]);
  const stakesRef = useRef(stakes);
  const setStakes = (data) => {
    stakesRef.current = data;
    _setStakes(data);
  };

  // filters needed to retrieve the stake and unstake events
  let singlePoolStakeFilter;
  let lpPoolStakeFilter;
  let singlePoolUnstakeFilter;
  let lpPoolUnstakeFilter;

  useEffect(() => {
    if (isConnected) {
      // init filters with the connected address
      singlePoolStakeFilter = readSinglePoolContract.filters.Staked(address);
      lpPoolStakeFilter = readSinglePoolContract.filters.Staked(address);
      singlePoolUnstakeFilter = readSinglePoolContract.filters.Unstake(address);
      lpPoolUnstakeFilter = readSinglePoolContract.filters.Unstake(address);
      // load all staking/unstaking events
      loadStakingEvents();
      // subscribe to upcoming events
      subscribeToEvents();
    }
    return () => {
      // remove all the listeners
      readSinglePoolContract.off("Staked", addStakeListener);
      readSinglePoolContract.off("Unstake", removeStakeListener);
      readLpPoolContract.off("Staked", addStakeListener);
      readLpPoolContract.off("Unstake", removeStakeListener);
    };
  }, [address, isConnected]);

  // subscribe to all stake and unstake events to build the list
  const subscribeToEvents = async () => {
    const startBlockNumber = await provider.getBlockNumber();
    // Listening to Staked events on Single Pool
    readSinglePoolContract.on(
      singlePoolStakeFilter,
      (account, stakeId, value, stakeTime, lockedUntil, stakeWeight, event) =>
        addStakeListener(
          account,
          stakeId,
          value,
          stakeTime,
          lockedUntil,
          stakeWeight,
          "Single",
          event,
          startBlockNumber
        )
    );
    // Listening to Staked events on LP Pool
    readLpPoolContract.on(lpPoolStakeFilter, (account, stakeId, value, stakeTime, lockedUntil, stakeWeight, event) =>
      addStakeListener(account, stakeId, value, stakeTime, lockedUntil, stakeWeight, "LP", event, startBlockNumber)
    );
    // Listening to Staked events on Single Pool
    readSinglePoolContract.on(singlePoolUnstakeFilter, (account, stakeId, event) =>
      removeStakeListener(account, stakeId + "-Single", event, startBlockNumber)
    );
    // Listening to Staked events on LP Pool
    readLpPoolContract.on(singlePoolUnstakeFilter, (account, stakeId, event) =>
      removeStakeListener(account, stakeId + "-LP", event, startBlockNumber)
    );
  };

  // create a Stake object and add it to the list
  const addStakeListener = (
    account,
    stakeId,
    value,
    stakeTime,
    lockedUntil,
    stakeWeight,
    pool,
    event,
    startBlockNumber
  ) => {
    if (event.blockNumber <= startBlockNumber) return;
    const newStake = {
      account,
      stakeId: stakeId.toString(),
      value: ethers.utils.formatEther(value.toString()),
      stakeTime: new Date(stakeTime.toString() * 1000),
      lockedUntil: new Date(lockedUntil.toString() * 1000),
      pool,
      id: stakeId + "-" + pool,
      weight: stakeWeight.toString(),
    };
    let stakeList = [...stakesRef.current, newStake];
    stakeList.sort((a, b) => a.lockedUntil - b.lockedUntil);
    setStakes(stakeList);
  };

  // remove the Stake with id=stakeId from the list
  const removeStakeListener = (account, id, event, startBlockNumber) => {
    if (event.blockNumber <= startBlockNumber) return;
    let stakeList = [...stakesRef.current];
    const index = stakeList.findIndex((element) => element.id === id);
    stakeList.splice(index, 1);
    stakeList.sort((a, b) => a.lockedUntil - b.lockedUntil);
    setStakes(stakeList);
  };

  // load all the staking events since the SC deployment
  const loadStakingEvents = async () => {
    const contractDeployBlock = parseInt(process.env.NEXT_PUBLIC_SC_DEPLOY_BLOCK);
    const currentBlockNumber = await provider.getBlockNumber();

    // arrays containing the events
    let singlePoolStakeEvents = [];
    let lpPoolStakeEvents = [];
    let singlePoolUnstakeEvents = [];
    let lpPoolUnstakeEvents = [];

    // retrieve all events by batch of 3000 blocks since SC deployment
    for (let startBlock = contractDeployBlock; startBlock < currentBlockNumber; startBlock += 3000) {
      const endBlock = Math.min(currentBlockNumber, startBlock + 2999);
      const allSinglePoolStakeEvents = await readSinglePoolContract.queryFilter(
        singlePoolStakeFilter,
        startBlock,
        endBlock
      );
      const allLpPoolStakeEvents = await readLpPoolContract.queryFilter(lpPoolStakeFilter, startBlock, endBlock);
      const allSinglePoolUnstakeEvents = await readSinglePoolContract.queryFilter(
        singlePoolUnstakeFilter,
        startBlock,
        endBlock
      );
      const allLpPoolUnstakeEvents = await readLpPoolContract.queryFilter(lpPoolUnstakeFilter, startBlock, endBlock);
      singlePoolStakeEvents = [...singlePoolStakeEvents, ...allSinglePoolStakeEvents];
      lpPoolStakeEvents = [...lpPoolStakeEvents, ...allLpPoolStakeEvents];
      singlePoolUnstakeEvents = [...singlePoolUnstakeEvents, ...allSinglePoolUnstakeEvents];
      lpPoolUnstakeEvents = [...lpPoolUnstakeEvents, ...allLpPoolUnstakeEvents];
    }
    let stakeList = [];
    // add all the single pool stakes to the list
    singlePoolStakeEvents.map((event) => {
      stakeList.push({
        account: event.args.account,
        stakeId: event.args.stakeId.toString(),
        value: ethers.utils.formatEther(event.args.value.toString()),
        stakeTime: new Date(event.args.stakeTime.toString() * 1000),
        lockedUntil: new Date(event.args.lockedUntil.toString() * 1000),
        pool: "Single",
        id: event.args.stakeId.toString() + "-Single",
        weight: event.args.stakeWeight.toString(),
      });
    });
    // remove the single pool unstakes from the list
    singlePoolUnstakeEvents.map((event) => {
      const index = stakeList.findIndex((element) => element.id === event.args.stakeId.toString() + "-Single");
      stakeList.splice(index, 1);
    });
    // add all the lp pool stakes to the list
    lpPoolStakeEvents.map((event) => {
      stakeList.push({
        account: event.args.account,
        stakeId: event.args.stakeId.toString(),
        value: ethers.utils.formatEther(event.args.value.toString()),
        stakeTime: new Date(event.args.stakeTime.toString() * 1000),
        lockedUntil: new Date(event.args.lockedUntil.toString() * 1000),
        pool: "LP",
        id: event.args.stakeId.toString() + "-LP",
        weight: event.args.stakeWeight.toString(),
      });
    });
    // remove the single pool unstakes from the list
    lpPoolUnstakeEvents.map((event) => {
      const index = stakeList.findIndex((element) => element.id === event.args.stakeId.toString() + "-LP");
      stakeList.splice(index, 1);
    });
    // sort the list by unlock date
    stakeList.sort((a, b) => a.lockedUntil - b.lockedUntil);
    setStakes(stakeList);
  };

  return (
    <StakesContext.Provider
      value={{
        stakes,
      }}
    >
      {children}
    </StakesContext.Provider>
  );
};
