import React, { ReactNode } from "react";
import { Scrollbar } from "react-scrollbars-custom";
import { useTheme } from "@mui/material";

interface CustomScrollbarProps {
  children: ReactNode;
}

const CustomScrollbar: React.FC<CustomScrollbarProps> = ({ children }) => {
  const theme = useTheme();
  const thumbYProps = theme.palette.mode === "dark" ?
    { style: { backgroundColor: "#2BB673" }}
  :
    { style: { backgroundColor: "#9bf7cb" }}
  const trackYProps = theme.palette.mode === "dark" ?
    { style: { backgroundColor: "#2B5BB6", margin: "5px" } }
  :
    { style: { backgroundColor: "#7da9f7", margin: "5px" } }

  return (
    <Scrollbar
      thumbYProps={thumbYProps}
      trackYProps={trackYProps}
    >
      {children}
    </Scrollbar>
  );
};

export default CustomScrollbar;
