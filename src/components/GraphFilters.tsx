import { List, ListItem, ListItemButton, ListItemText, Box, Paper } from "@mui/material";
import React from "react";
import useDropdown from "../hooks/use-dropdown.ts";

interface GraphFiltersProps {
  setGraphType: React.Dispatch<React.SetStateAction<string>>;
  setIsGraphFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const GraphFilters: React.FC<GraphFiltersProps> = ({
  setGraphType,
  setIsGraphFilterOpen,
}) => {
  const dropdownRef = useDropdown(setIsGraphFilterOpen);

  function changeGraphType(type: string) {
    setGraphType(type);
    setIsGraphFilterOpen(false);
  }

  return (
    <Box ref={dropdownRef} sx={{display: "flex", zIndex: 30, marginTop: "8px", position: "absolute"}} >
      <Paper>
        <List className="rounded-md ml-4">
          <ListItem disablePadding>
            <ListItemButton onClick={() => changeGraphType("Amplitude")}>
              <ListItemText
                className="w-max"
                primary="Amplitude Graph"
              ></ListItemText>
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => changeGraphType("Rigidity")}>
              <ListItemText
                className="w-max"
                primary="Rigidity Graph"
              ></ListItemText>
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => changeGraphType("Number of repetitions")}
            >
              <ListItemText
                className="w-max"
                primary="Number of repetitions Graph"
              ></ListItemText>
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding></ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => changeGraphType("Feedback")}>
              <ListItemText
                className="w-max"
                primary="Feedback Graph"
              ></ListItemText>
            </ListItemButton>
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default GraphFilters;
