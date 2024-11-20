import React, { useRef } from "react";
import { IconButton, Button as MuiButton, Typography } from "@mui/material";
import useStm32 from "../hooks/use-stm32";

interface ButtonProps {
  label?: string;
  icon?: React.ReactNode;
  mode?: string;
  action?: string;
  content?: string;
  onMouseDown?: () => void;
  onClick?: () => void;
  mainColor?: string;
  hoverColor?: string;
  textColor?: string;
  disabled?: boolean;
  socket?: any;
}

const Button: React.FC<ButtonProps> = ({
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
  onClick,
}) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendingRequests = async (
    mode: string | undefined,
    action: string | undefined,
    content: string | undefined,
  ) => {
    try {
      let dataToSend = "{";

      if (mode) {
        dataToSend += `${mode};`;
      }

      if (action) {
        dataToSend += `${action};`;
      }

      if (content) {
        dataToSend += `${content};`;
      }

      dataToSend += "}";

      console.log(`Button clicked: ${dataToSend}`);

      socket.emit("sendDataToStm32", dataToSend);
    } catch (error) {
      console.error("An error occurred:", error);
      clearIntervalRef();
    }
  };

  const sendingStm32RecordingRequests = async () => {
    try {
      const response = await fetch("http://localhost:3001/stm32/record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          state: "start",
        }),
        credentials: "include",
      });

      if (response.ok) {
        console.log("Recording started successfully.");
      } else {
        console.error("Failed to start recording.");
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  const sendingStm32StopRecordingRequests = async () => {
    try {
      const response = await fetch("http://localhost:3001/stm32/record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          state: "stop",
        }),
        credentials: "include",
      });

      if (response.ok) {
        console.log("Recording stopped successfully.");
      } else {
        console.error("Failed to stop recording.");
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  const sendingStm32PauseRecordingRequests = async () => {
    try {
      const response = await fetch("http://localhost:3001/stm32/record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          state: "pause",
        }),
        credentials: "include",
      });

      if (response.ok) {
        console.log("Recording paused successfully.");
      } else {
        console.error("Failed to pause recording.");
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  const clearIntervalRef = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleEnd = () => {
    clearIntervalRef();
    window.removeEventListener("mouseup", handleEnd);
    window.removeEventListener("touchend", handleEnd);
  };

  const handleStart = (
    e:
      | React.MouseEvent<HTMLButtonElement>
      | React.TouchEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault(); // Prevent any unintended default behaviors
    if (action === "Increment") {
      intervalRef.current = setInterval(
        () => sendingRequests(mode, action, content),
        20,
      );
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchend", handleEnd);
    } else if (content === "Start") {
      sendingStm32RecordingRequests();
      sendingRequests(mode, action, content);
    } else if (content === "Pause") {
      sendingStm32PauseRecordingRequests();
      sendingRequests(mode, action, content);
    } else if (content === "Stop") {
      sendingStm32StopRecordingRequests();
      sendingRequests(mode, action, content);
    } else {
      sendingRequests(mode, action, content);
    }
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
      onClick={onClick}
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
        backgroundColor: "blueAccent.main",
        "&:hover": {
          backgroundColor: "blueAccent.hover",
        },
      }}
    >
      <Typography>{label}</Typography>
    </MuiButton>
  );
};

export default Button;
