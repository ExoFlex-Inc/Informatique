import React, { useRef, useState } from "react";

interface ButtonProps {
  label: string;
  mode?: string;
  action?: string;
  content?: string;
  onMouseDown?: () => void;
  className?: string;
  disabled?: boolean;
  onError: (error: boolean) => void;
}

const Button: React.FC<ButtonProps> = ({
  label,
  mode,
  action,
  content,
  className,
  disabled,
  onError,
}) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startSendingRequests = async () => {
    try {
      const response = await fetch("http://localhost:3001/hmi-button-click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: mode, action: action, content: content }),
      });

      if (response.ok) {
        console.log("Button click sent successfully.");
      } else {
        console.error("Failed to send button click.");
        clearInterval(intervalRef.current!);
        onError(true);
      }
    } catch (error) {
      console.error("An error occurred:", error);
      clearInterval(intervalRef.current!);
      onError(true);
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

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {

    if (e.button === 0) {

      // Start sending requests with interval for mouse down event
      intervalRef.current = setInterval(startSendingRequests, 20);

      // Add event listener for mouseup
      window.addEventListener("mouseup", handleMouseUp);
    }
  };

  return (
    <button
      className={`bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded ${className}`}
      onMouseDown={handleMouseDown}
      disabled={disabled}
    >
      {label}
    </button>
  );
};

export default Button;
