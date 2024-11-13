import type { Request, Response } from "express";
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

let prevSpeeds = {
  dorsiflexion: [] as number[],
  eversion: [] as number[],
  extension: [] as number[],
};

let saveData = {
  recorded_date: new Date()
    .toLocaleString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZoneName: "short",
    })
    .replace(" 24:", " 00:"),
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
  speeds: {
    dorsiflexion: [] as number[],
    eversion: [] as number[],
    extension: [] as number[],
  },
  repetitions_done: 0,
  repetitions_target: 0,
};

let exerciseId: number | null = null;
let recodState = "start";

const getSavedData = asyncHandler(async (_: Request, res: Response) => {
  try {
    if (!saveData) {
      res.status(404).send("No data available.");
      return;
    }

    res.status(200).json({
      data: saveData,
    });
    resetSaveData();
  } catch (error) {
    console.error("Error in getSavedData:", error);
    res.status(500).send("An error occurred while retrieving data.");
  }
});

const clearData = asyncHandler(async (_: Request, res: Response) => {
  try {
    resetSaveData();
    res.status(200).send("Data cleared successfully.");
  } catch (error) {
    console.error("Error in clearData:", error);
    res.status(500).send("An error occurred while clearing data.");
  }
});

function resetSaveData() {
  saveData = {
    recorded_date: new Date()
      .toLocaleString("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZoneName: "short",
      })
      .replace(" 24:", " 00:"),
    angles: {
      dorsiflexion: [],
      eversion: [],
      extension: [],
    },
    angle_max: {
      dorsiflexion: 0,
      eversion: 0,
      extension: 0,
    },
    torques: {
      dorsiflexion: [],
      eversion: [],
      extension: [],
    },
    torque_max: {
      dorsiflexion: 0,
      eversion: 0,
      extension: 0,
    },
    speeds: {
      dorsiflexion: [],
      eversion: [],
      extension: [],
    },
    repetitions_done: 0,
    repetitions_target: 0,
  };

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
  prevSpeeds = {
    dorsiflexion: [],
    eversion: [],
    extension: [],
  };

  return true;
}

const insertInitialDataToSupabase = async (): Promise<boolean> => {
  try {
    // Fetch the authenticated user
    const { data: authData, error: authError } =
      await supaClient.auth.getUser();

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

    const repetitions_target = planData.plan.plan
      .map((set: any) => set.repetitions)
      .reduce((a: number, b: number) => a + b, 0);
    saveData.repetitions_target = repetitions_target;

    // Insert the data into Supabase
    const { data, error } = await supaClient
      .from("exercise_data")
      .insert([{ data: saveData, user_id: profile.id }])
      .select("id")
      .single();

    if (error) {
      console.error("Error inserting initial data into Supabase:", error);
      return false;
    } else {
      console.log(
        "Initial data successfully inserted to Supabase with ID:",
        data.id,
      );
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
const togglePushInterval = (state: string) => {
  if (state === "start" && !pushInterval) {
    if (!exerciseId) {
      console.error(
        "Cannot start push interval. Initial data has not been inserted.",
      );
      return;
    }

    pushInterval = setInterval(() => {
      updateDataToSupabase();
    }, PUSH_INTERVAL_MS);
    console.log("Push interval started");
  } else if (state === "stop" && pushInterval) {
    clearInterval(pushInterval);
    pushInterval = null;
    console.log("Push interval stopped");
  }
};

// Function to handle recording start/stop
const recordingStm32Data = async (req: Request, res: Response) => {
  try {
    const { state } = req.body;

    // Validate request body
    if (typeof state !== "string") {
      return res
        .status(400)
        .send(
          "Invalid request. Please provide a 'state' field with a string value.",
        );
    }

    if (state === "start") {
      // Clear previous data if needed
      resetSaveData();

      // Insert initial JSON data
      if (recodState !== "pause") {
        const initialInsertSuccess = await insertInitialDataToSupabase();
        if (!initialInsertSuccess) {
          return res
            .status(500)
            .send("Failed to start recording. Initial data insert failed.");
        }
      }
      // Start recording
      recodState = "start";
      togglePushInterval("start");
      return res
        .status(200)
        .send({ exercise_id: exerciseId, message: "Recording started." });
    } else if (state === "pause") {
      recodState = "pause";
      togglePushInterval("stop");
      return res
        .status(200)
        .send({ exercise_id: exerciseId, message: "Recording paused." });
    } else if (state === "stop") {
      // Stop recording
      recodState = "stop";
      togglePushInterval("stop");
      return res
        .status(200)
        .send({ exercise_id: exerciseId, message: "Recording stopped." });
    }
  } catch (error) {
    // Handle unexpected errors
    console.error("Error in recordingStm32Data:", error);
    return res.status(500).send("An unexpected error occurred.");
  }
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
  let scannerPort: string | undefined;
  if (process.env["NODE_ENV"] === "production") {
    scannerPort = "/dev/ttyACM0";
  } else {
    if (process.env["ROBOT"] === "true") {
      const ports = await SerialPort.list();
      const foundPort = ports.find(
        (port) => port.manufacturer === "STMicroelectronics",
      );

      if (foundPort) {
        scannerPort = foundPort.path;
      }
    } else {
      scannerPort = process.env["HMI_SERIAL_PORT"];
    }
  }

  if (scannerPort) {
    console.log("Scanner port:", scannerPort);

    // Initialize new SerialPort based on scannerPort type
    const newSerialPort = new SerialPort({
      path: scannerPort,
      baudRate: 115200,
    });

    newSerialPort.on("error", (error) => {
      console.log("Serial port error:", error.message);
      togglePushInterval("stop");
      resetSaveData();
      setSerialPort(null);
    });

    newSerialPort.on("close", () => {
      console.log("Serial port closed");
      io.emit("serialPortClosed", "Serial port closed");
      togglePushInterval("stop");
      resetSaveData();
      setSerialPort(null);
    });

    newSerialPort.on("open", () => {
      console.log("Serial port opened.");
      res.status(200).send("Serial port initialized and ready.");
    });

    newSerialPort.on("data", (data) => {
      receivedDataBuffer += data.toString();
      setReceivedDataBuffer(receivedDataBuffer);

      while (
        receivedDataBuffer.includes("{") &&
        receivedDataBuffer.includes("}")
      ) {
        const startIdx = receivedDataBuffer.indexOf("{");
        const endIdx = receivedDataBuffer.indexOf("}") + 1;
        const jsonDataString = receivedDataBuffer.substring(startIdx, endIdx);

        try {
          // if (recodState === "stop" || recodState === "pause") {
          //   return;
          // }
          const parsedData = JSON.parse(jsonDataString);
          io.emit("stm32Data", parsedData);

          // Append new data to prevAngles and prevTorques
          prevAngles.dorsiflexion.push(parsedData.Positions[0]);
          prevAngles.eversion.push(parsedData.Positions[1]);
          prevAngles.extension.push(parsedData.Positions[2]);

          prevTorques.dorsiflexion.push(parsedData.Torques[0]);
          prevTorques.eversion.push(parsedData.Torques[1]);
          prevTorques.extension.push(parsedData.Torques[2]);

          prevSpeeds.dorsiflexion.push(parsedData.Speed[0]);
          prevSpeeds.eversion.push(parsedData.Speed[1]);
          prevSpeeds.extension.push(parsedData.Speed[2]);

          // Update saveData with new values
          saveData = {
            ...saveData,
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
            speeds: {
              dorsiflexion: [...prevSpeeds.dorsiflexion],
              eversion: [...prevSpeeds.eversion],
              extension: [...prevSpeeds.extension],
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

export { initializeSerialPort, recordingStm32Data, getSavedData, clearData };
