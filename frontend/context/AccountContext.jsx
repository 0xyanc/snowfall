import { createContext, useContext } from "react";
import { useAccount } from "wagmi";

const AccountContext = createContext();

export function useAccountProvider() {
  const context = useContext(AccountContext);

  if (!context) {
    throw new Error("useAccountProvider must be used within a AccountProvider");
  }
  return context;
}

export const AccountProvider = ({ children }) => {
  const { address, isConnected } = useAccount();
  return (
    <AccountContext.Provider
      value={{
        address,
        isConnected,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};
