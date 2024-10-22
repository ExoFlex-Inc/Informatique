import React, { useRef, useState } from "react";
import { Button as MuiButton } from "@mui/material";

interface ButtonProps {
  label: string;
  icon?: React.ReactNode;
  mode?: string;
  action?: string;
  content?: string;
  onMouseDown?: () => void;
  onClick?: () => void;
  color?: string;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  label,
  mode,
  action,
  content,
  disabled,
}) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  let message = content;

  const sendingRequests = async () => {
    try {
      const response = await fetch("http://localhost:3001/stm32/button", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: mode,
          action: action,
          content: message,
        }),
      });

      if (response.ok) {
        console.log("Button click sent successfully.");
      } else {
        console.error("Failed to send button click.");
        clearInterval(intervalRef.current!);
      }
    } catch (error) {
      console.error("An error occurred:", error);
      clearInterval(intervalRef.current!);
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
          start: true,
        }),
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
          start: false,
        }),
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

  const clearIntervalRef = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current!);
      intervalRef.current = null;
    }
  };

  const handleMouseUp = () => {
    clearIntervalRef();
    window.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseDown = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.button === 2) {
      handleMouseUp();
    }

    if (e.button === 0) {
      if (action === "Increment") {
        intervalRef.current = setInterval(sendingRequests, 20);
        window.addEventListener("mouseup", handleMouseUp);
      } else if (content === "Start") {
        sendingStm32RecordingRequests();
        sendingRequests();
      } else if (content === "Stop" || content === "Pause") {
        sendingStm32StopRecordingRequests();
        sendingRequests();
      } else if (action === "Control" || action === "Homing") {
        sendingRequests();
      }
    }
  };

  return (
    <MuiButton
      fullWidth
      variant="contained"
      disabled={disabled}
      sx={{
        mt: 3,
        mb: 2,
        textTransform: "none",
        fontSize: "1rem",
        backgroundColor: "blueAccent.main",
        "&:hover": {
          backgroundColor: "#1e3a8a",
        },
      }}
      onMouseDown={handleMouseDown}
    >
      {label}
    </MuiButton>
  );
};

export default Button;
