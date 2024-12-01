import React, { useRef } from "react";
import { IconButton, Button as MuiButton, Typography } from "@mui/material";

interface LongPressButtonProps {
  label?: string;
  icon?: React.ReactNode;
  mode?: string;
  action?: string;
  content?: string;
  mainColor?: string;
  hoverColor?: string;
  textColor?: string;
  disabled?: boolean;
  socket?: any;
}

const HmiButtonMovement: React.FC<LongPressButtonProps> = ({
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
  const pressStartTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendingRequests = async (
    mode: string | undefined,
    action: string | undefined,
    content: string | undefined,
  ) => {
    try {
      const dataToSend = `{${mode || ""};${action || ""};${content || ""};}`;
      console.log(`Long press request: ${dataToSend}`);
      socket.emit("sendDataToStm32", dataToSend);
    } catch (error) {
      console.error("An error occurred:", error);
      clearIntervalRef();
    }
  };

  const clearIntervalRef = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleStart = (
    e:
      | React.MouseEvent<HTMLButtonElement>
      | React.TouchEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    pressStartTimeRef.current = Date.now();

    if (action === "Increment" || action === "Tightening") {
      intervalRef.current = setInterval(
        () => sendingRequests(mode, action, content),
        50,
      );
    } else {
      sendingRequests(mode, action, content);
    }

    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchend", handleEnd);
  };

  const handleEnd = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    window.removeEventListener("mouseup", handleEnd);
    window.removeEventListener("touchend", handleEnd);
  };

  return icon ? (
    <IconButton
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onContextMenu={(e) => e.preventDefault()}
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
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onContextMenu={(e) => e.preventDefault()}
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

export default HmiButtonMovement;
