import { createContext } from "react";

export const DisablePagesContext = createContext<{
  disabledItems: string[];
  disableItem: (text: string) => void;
  enableItem: (text: string) => void;
}>({
  disabledItems: [], // Add this property to the default value
  disableItem: () => {},
  enableItem: () => {},
});
