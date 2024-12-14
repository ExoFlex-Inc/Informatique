import React, { useContext } from "react";
import { IconButton, Button as MuiButton, Typography } from "@mui/material";
import { DisablePagesContext } from "../context/DisablePagesContext";

interface ClickButtonProps {
  label?: string;
  icon?: React.ReactNode;
  mode?: string;
  action?: string;
  content?: string;
  mainColor?: string;
  hoverColor?: string;
  textColor?: string;
  disabled?: any;
  socket?: any;
}

const HmiButtonClick: React.FC<ClickButtonProps> = ({
  label,
  mode,
  action,
  content,
  mainColor,
  hoverColor,
  textColor,
  socket,
  disabled,
  icon,
}) => {
  const { disableItem, enableItem } = useContext(DisablePagesContext);

  const handleClick = async () => {
    if (
      content === "Start" ||
      content === "Stop" ||
      content === "Pause" ||
      mode === "Reset"
    ) {
      try {
        if (content === "Start") {
          console.log("Disabling pages...");
          ["Dashboard", "Network", "Planning", "Activity", "Manual"].forEach(
            disableItem,
          );
        } else {
          console.log("Enabling pages...");
          ["Dashboard", "Network", "Planning", "Activity", "Manual"].forEach(
            enableItem,
          );
        }

        let state;

        if (content) {
          state = content?.toLowerCase();
        } else {
          state = mode?.toLowerCase();
        }
        const response = await fetch("http://localhost:3001/stm32/record", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ state }),
          credentials: "include",
        });

        if (response.ok) {
          const dataToSend = `{${mode || ""};${action || ""};${content || ""};}`;
          console.log(`Click request: ${dataToSend}`);
          socket.emit("sendDataToStm32", dataToSend);
        } else {
          console.error(`Failed to ${action?.toLowerCase()} recording.`);
        }
      } catch (error) {
        console.error("An error occurred:", error);
      }
    } else {
      const dataToSend = `{${mode || ""};${action || ""};${content || ""};}`;
      console.log(`Click request: ${dataToSend}`);
      socket.emit("sendDataToStm32", dataToSend);
    }
  };

  return icon ? (
    <IconButton
      onClick={handleClick}
      size="large"
      sx={{
        color: textColor,
        backgroundColor: mainColor,
        "&.Mui-disabled": {
          color: "gray",
        },
        "&:hover": {
          backgroundColor: hoverColor,
        },
      }}
      disabled={disabled}
    >
      {icon}
    </IconButton>
  ) : (
    <MuiButton
      onClick={handleClick}
      fullWidth
      variant="contained"
      disabled={disabled}
      sx={{
        mt: 3,
        mb: 2,
        color: textColor,
        textTransform: "none",
        fontSize: "1rem",
        backgroundColor: mainColor,
        "&:hover": {
          backgroundColor: hoverColor,
        },
      }}
    >
      <Typography>{label}</Typography>
    </MuiButton>
  );
};

export default HmiButtonClick;
