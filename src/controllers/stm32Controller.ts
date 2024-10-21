import { Request, Response } from "express";
import { SerialPort } from "serialport";
import asyncHandler from "express-async-handler";
import {
  getSerialPort,
  setSerialPort,
  getReceivedDataBuffer,
  setReceivedDataBuffer,
} from "../managers/serialPort.ts";
import { io } from "../server.ts";
import supaClient from "../utils/supabaseClient.ts";

const PUSH_INTERVAL_MS = 5000; // Push data every 5 seconds
let pushInterval: NodeJS.Timeout | null = null;

let prevAngles = {
  dorsiflexion: [] as number[],
  eversion: [] as number[],
  extension: [] as number[],
};

let prevTorques = {
  dorsiflexion: [] as number[],
  eversion: [] as number[],
  extension: [] as number[],
};

let saveData = {
  recorded_date: new Date().toLocaleString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  }),
  angles: {
    dorsiflexion: [] as number[],
    eversion: [] as number[],
    extension: [] as number[],
  },
  angle_max: {
    dorsiflexion: 0,
    eversion: 0,
    extension: 0,
  },
  torques: {
    dorsiflexion: [] as number[],
    eversion: [] as number[],
    extension: [] as number[],
  },
  torque_max: {
    dorsiflexion: 0,
    eversion: 0,
    extension: 0,
  },
  repetitions_done: 0,
  repetitions_target: 0,
};

let exerciseId: number | null = null;

const insertInitialDataToSupabase = async (): Promise<boolean> => {
  try {
    // Fetch the authenticated user
    const { data: authData, error: authError } = await supaClient.auth.getUser();
    
    if (authError || !authData?.user) {
      throw new Error("User not authenticated or error fetching user.");
    }

    const profile = authData.user;

    const { data: planData, error: planError } = await supaClient
      .from("plans")
      .select("*")
      .eq("user_id", profile.id)
      .single();

    if (planError) {
      console.error("Error fetching plan data from Supabase:", planError);
      return false;
    }

    const repetitions_target = planData.plan.plan.map((set: any) => set.repetitions).reduce((a: number, b: number) => a + b, 0);
    saveData.repetitions_target = repetitions_target;


    // Insert the data into Supabase
    const { data, error } = await supaClient
      .from("exercise_data")
      .insert([{ data: saveData, user_id: profile.id}])
      .select("id")
      .single();

    if (error) {
      console.error("Error inserting initial data into Supabase:", error);
      return false; 
    } else {
      console.log("Initial data successfully inserted to Supabase with ID:", data.id);
      exerciseId = data.id;
      return true; 
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error("Error during insert operation:", err.message);
    } else {
      console.error("An unknown error occurred.");
    }
    return false;
  }
};

// Function to update modified parts of the JSON in Supabase
const updateDataToSupabase = async () => {
  if (!exerciseId) {
    console.error("Error: exerciseId is not set.");
    return;
  }

  // Only update modified fields using the stored exerciseId
  const { error } = await supaClient
    .from("exercise_data")
    .update({
      data: saveData, // Update the jsonb column
    })
    .eq("id", exerciseId); // Use the stored exerciseId for the update

  if (error) {
    console.error("Error updating data in Supabase:", error);
  } else {
    console.log("Data successfully updated in Supabase");
  }
};

// Function to toggle the push interval for periodic updates
const togglePushInterval = (start: boolean) => {
  if (start && !pushInterval) {
    if (!exerciseId) {
      console.error("Cannot start push interval. Initial data has not been inserted.");
      return;
    }

    pushInterval = setInterval(() => {
      updateDataToSupabase();
    }, PUSH_INTERVAL_MS);
    console.log("Push interval started");
  } else if (!start && pushInterval) {
    clearInterval(pushInterval);
    pushInterval = null;
    console.log("Push interval stopped");
  }
};

// Function to handle recording start/stop
const recordingStm32Data = async (req: Request, res: Response) => {
  try {
    const { start } = req.body;
    
    // Validate request body
    if (typeof start !== "boolean") {
      return res
        .status(400)
        .send("Invalid request. Please provide a 'start' field with a boolean value.");
    }

    if (start) {
      // Clear previous data if needed
      const clearSuccess = await clearPreviousData();
      if (!clearSuccess) {
        return res.status(500).send("Failed to clear previous data.");
      }

      // Insert initial JSON data
      const initialInsertSuccess = await insertInitialDataToSupabase(); 
      if (!initialInsertSuccess) {
        return res.status(500).send("Failed to start recording. Initial data insert failed.");
      }

      // Start recording
      togglePushInterval(true); 
      return res.status(200).send("Recording started.");
    } else {
      // Stop recording
      togglePushInterval(false);
      return res.status(200).send("Recording stopped.");
    }
  } catch (error) {
    // Handle unexpected errors
    console.error("Error in recordingStm32Data:", error);
    return res.status(500).send("An unexpected error occurred.");
  }
};

// Function to clear accumulated data
const clearPreviousData = () => {
  prevAngles = {
    dorsiflexion: [],
    eversion: [],
    extension: [],
  };
  prevTorques = {
    dorsiflexion: [],
    eversion: [],
    extension: [],
  };

  return true;
};

// Function to initialize serial port
const initializeSerialPort = asyncHandler(async (_, res: Response) => {
  const serialPort = getSerialPort();
  let receivedDataBuffer = getReceivedDataBuffer();

  if (serialPort && serialPort.isOpen) {
    console.log("Serial port already initialized.");
    res.status(200).send("Serial port already initialized.");
    return;
  }

  const ports = await SerialPort.list();
  const scannerPort = ports.find(
    (port) => port.manufacturer === "STMicroelectronics"
  );

  if (scannerPort) {
    console.log("Scanner port:", scannerPort.path);
    const newSerialPort = new SerialPort({
      path: scannerPort.path,
      baudRate: 115200,
    });

    newSerialPort.on("error", (error) => {
      console.log("Serial port error:", error.message);
      togglePushInterval(false); // Stop interval on error
    });

    newSerialPort.on("close", () => {
      console.log("Serial port closed");
      io.emit("serialPortClosed", "Serial port closed");
      togglePushInterval(false); // Stop interval when port is closed
      setSerialPort(null);
    });

    newSerialPort.on("open", () => {
      console.log("Serial port opened.");
      res.status(200).send("Serial port initialized and ready.");
    });

    newSerialPort.on("data", (data) => {
      receivedDataBuffer += data.toString();
      setReceivedDataBuffer(receivedDataBuffer);

      while (receivedDataBuffer.includes("{") && receivedDataBuffer.includes("}")) {
        const startIdx = receivedDataBuffer.indexOf("{");
        const endIdx = receivedDataBuffer.indexOf("}") + 1;
        const jsonDataString = receivedDataBuffer.substring(startIdx, endIdx);

        try {
          const parsedData = JSON.parse(jsonDataString);
          io.emit("stm32Data", parsedData);

          // Append new data to prevAngles and prevTorques
          prevAngles.dorsiflexion.push(parsedData.Positions[0]);
          prevAngles.eversion.push(parsedData.Positions[1]);
          prevAngles.extension.push(parsedData.Positions[2]);

          prevTorques.dorsiflexion.push(parsedData.Torques[0]);
          prevTorques.eversion.push(parsedData.Torques[1]);
          prevTorques.extension.push(parsedData.Torques[2]);

          // Update saveData with new values
          saveData = {
            ...saveData, // Preserve previous data
            angles: {
              dorsiflexion: [...prevAngles.dorsiflexion],
              eversion: [...prevAngles.eversion],
              extension: [...prevAngles.extension],
            },
            angle_max: {
              dorsiflexion: Math.max(...prevAngles.dorsiflexion),
              eversion: Math.max(...prevAngles.eversion),
              extension: Math.max(...prevAngles.extension),
            },
            torques: {
              dorsiflexion: [...prevTorques.dorsiflexion],
              eversion: [...prevTorques.eversion],
              extension: [...prevTorques.extension],
            },
            torque_max: {
              dorsiflexion: Math.max(...prevTorques.dorsiflexion),
              eversion: Math.max(...prevTorques.eversion),
              extension: Math.max(...prevTorques.extension),
            },
            repetitions_done: parsedData.Repetitions,
          };

        } catch (err) {
          console.error("Error parsing JSON:", err);
        }

        // Remove the processed data from the buffer
        receivedDataBuffer = receivedDataBuffer.slice(endIdx);
        setReceivedDataBuffer(receivedDataBuffer);
      }
    });

    setSerialPort(newSerialPort);
  } else {
    setSerialPort(null);
    console.error("No scanner port found.");
    res.status(500).send("No scanner port found.");
  }
});

// Function to handle button clicks and send data to serial port
const handleButtonClick = asyncHandler(async (req: Request, res: Response) => {
  const { mode, action, content } = req.body;
  console.log(`Button clicked: {${mode};${action};${content};}`);

  const dataToSend = `{${mode};${action};${content};}`;
  const serialPort = getSerialPort();

  if (serialPort && serialPort.isOpen) {
    serialPort.write(dataToSend, (err: any) => {
      if (err) {
        console.error("Error writing to serial port:", err);
        res.status(500).send("Serial Error");
      } else {
        console.log("Data sent to serial port:", dataToSend);
        res.status(200).send("Data sent to serial port.");
      }
    });
  } else {
    res.status(500).send("Serial port not available.");
  }
});

export { initializeSerialPort, recordingStm32Data, handleButtonClick };