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
}

const Button: React.FC<ButtonProps> = ({
  label,
  mode,
  action,
  content,
  mainColor,
  hoverColor,
  textColor,
  disabled,
  icon,
}) => {
  const { socket } = useStm32();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendingRequests = async (mode: string | undefined, action: string | undefined, content: string | undefined) => {
    
    if (!socket) {
      console.error("Socket is not available.");
      return;
    }

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
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleMouseUp = () => {
    clearIntervalRef();
    window.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.button === 2) {
      handleMouseUp();
    }

    if (e.button === 0) {
      if (action === "Increment") {
        intervalRef.current = setInterval(() => sendingRequests(mode, action, content), 20);
        window.addEventListener("mouseup", handleMouseUp);
      } else if (content === "Start") {
        sendingStm32RecordingRequests();
        sendingRequests(mode, action, content);
      } else if (content === "Stop" || content === "Pause") {
        sendingStm32StopRecordingRequests();
        sendingRequests(mode, action, content);
      } else {
        sendingRequests(mode, action, content);
      }
    }
  };

  return icon ? (
    <IconButton
      onMouseDown={handleMouseDown}
      size="large"
      sx={{
        backgroundColor: mainColor,
        "&:hover": {
          backgroundColor: hoverColor,
          color: textColor,
        },
      }}
      disabled={disabled}
    >
      {icon}
    </IconButton>
  ) : (
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
      <Typography>{label}</Typography>
    </MuiButton>
  );
};

export default Button;
