import { List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { useEffect, useRef } from "react";
import React from "react";

interface GraphFiltersProps {
    setGraphType: React.Dispatch<React.SetStateAction<string>>;
    setIsGraphFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const GraphFilters: React.FC<GraphFiltersProps> = ({setGraphType, setIsGraphFilterOpen}) => {
    const dropdownRef = useRef(null);

    function changeGraphType (type: string) {
        setGraphType(type);
        setIsGraphFilterOpen(false);
    }

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsGraphFilterOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        };
    }, [dropdownRef]);

    return (
        <div ref={dropdownRef} className="flex w-min mt-2">
            <List className="bg-gray-600 rounded-md ml-4">
                <ListItem disablePadding>
                    <ListItemButton onClick={() => changeGraphType("Rigidity")}>
                        <ListItemText className="w-max" primary="Rigidity Graph"></ListItemText>
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton onClick={() => changeGraphType("Amplitude")}>
                        <ListItemText className="w-max" primary="Amplitude Graph"></ListItemText>
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton onClick={() => changeGraphType("Number of repetitions")}>
                        <ListItemText className="w-max" primary="Number of repetitions Graph"></ListItemText>
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton onClick={() => changeGraphType("Total seance time")}>
                        <ListItemText className="w-max" primary="Total seance time Graph"></ListItemText>
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton onClick={() => changeGraphType("Tendacy")}>
                        <ListItemText className="w-max" primary="Tendacy and evolution Graph"></ListItemText>
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton onClick={() => changeGraphType("Feedback")}>
                        <ListItemText className="w-max" primary="Feedback Graph"></ListItemText>
                    </ListItemButton>
                </ListItem>
            </List>
        </div>
    );
}

export default GraphFilters;