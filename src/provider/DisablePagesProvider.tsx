import React, { useState, useMemo } from "react";
import { DisablePagesContext } from "../context/DisablePagesContext";

interface ProSidebarProviderProps {
  children: React.ReactNode;
}

export const DisablePagesProvider: React.FC<ProSidebarProviderProps> = ({
  children,
}) => {
  const [disabledItems, setDisabledItems] = useState<string[]>([]);

  const disableItem = (text: string) => {
    setDisabledItems((prev) => (prev.includes(text) ? prev : [...prev, text]));
  };

  const enableItem = (text: string) => {
    setDisabledItems((prev) => prev.filter((item) => item !== text));
  };

  const contextValue = useMemo(
    () => ({
      disabledItems,
      disableItem,
      enableItem,
    }),
    [disabledItems],
  );

  return (
    <DisablePagesContext.Provider value={contextValue}>
      {children}
    </DisablePagesContext.Provider>
  );
};
