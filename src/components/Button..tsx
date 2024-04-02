import React, { useRef, useState } from "react";

interface ButtonProps {
  label: string;
  mode?: string;
  action?: string;
  content?: string;
  onMouseDown?: () => void;
  onClick?: () => void;
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
  let message = content

  const sendingRequests = async () => {
    try {
      const response = await fetch("http://localhost:3001/hmi-button-click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: mode, action: action, content: message }),
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

  const getPlanRequests = async () => {
    try {
      const responseGetPlanning = await fetch("http://localhost:3001/get-plan", {
        method: "GET",
      });
  
      if (responseGetPlanning.ok) {
        console.log("Plan retrieved successfully.");
        const planData = await responseGetPlanning.json();
        console.log("Plan data:", planData);
        return { loaded: true, planData: planData };
      } else {
        console.error("Failed to retrieve plan.");
        window.alert("Failed to retrieve plan.");
        return { loaded: false, planData: null };
      }
    } catch (error) {
      console.error("An error occurred:", error);
      window.alert("An error occurred: " + error);
      return { loaded: false, planData: null };
    }
  }

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

  const handleMouseDown = async(e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.button === 2) {
      handleMouseUp();
    }

    if (e.button === 0) {
      // Start sending requests with interval for mouse down event
      if (action === "Increment"){
        intervalRef.current = setInterval(sendingRequests, 20);
        // Add event listener for mouseup
        const handleMouseUpWithIntervalClear = () => {
          handleMouseUp();
          window.removeEventListener("mouseup", handleMouseUpWithIntervalClear); 
      }
      window.removeEventListener("mouseup", handleMouseUpWithIntervalClear);  //TO DO: Check if its necessary

      }
      else if (action === "Plan") {
        try {
          const { loaded, planData } = await getPlanRequests();
          if (loaded && planData) {
            const plan = planData[0].plan_content.plan;
            const limits = planData[0].plan_content.limits;
            message = `Limits:${limits.angles.eversion};${limits.angles.extension};${limits.angles.dorsiflexion};${limits.torque.eversion};${limits.torque.extension};${limits.torque.dorsiflexion}`;
            plan.forEach((exercise) => {
              message += `;${exercise.exercise};${exercise.repetitions};${exercise.sets};${exercise.rest};${exercise.target_angle};${exercise.target_torque};${exercise.time}`;
            });
            console.log("Retrieved plan data:", message);

            sendingRequests()

          } else {
            console.error("Failed to retrieve plan data.");
          }
        } catch (error) {
          console.error("Error retrieving plan data:", error);
        }
      }
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
