import React, { ReactNode } from "react";
import { Scrollbar } from "react-scrollbars-custom";

interface CustomScrollbarProps {
  children: ReactNode;
}

const CustomScrollbar: React.FC<CustomScrollbarProps> = ({ children }) => {
  return (
    <Scrollbar
      thumbYProps={{ style: { backgroundColor: "#2BB673" } }}
      trackYProps={{ style: { backgroundColor: "#2B5BB6", margin: "5px" } }}
    >
      {children}
    </Scrollbar>
  );
};

export default CustomScrollbar;
