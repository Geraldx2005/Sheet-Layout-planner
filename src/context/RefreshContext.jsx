import { createContext, useContext, useState, useCallback } from "react";

const RefreshContext = createContext();

export const RefreshProvider = ({ children }) => {
  const [resetSignal, setResetSignal] = useState(false);

  const handleRefresh = useCallback(() => {
    setResetSignal(Math.random()); // always unique key
  }, []);

  return (
    <RefreshContext.Provider
      value={{
        resetSignal,
        handleRefresh,
      }}
    >
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => useContext(RefreshContext);
