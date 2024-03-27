import express, { Application, Request, Response, NextFunction } from "express";
import { SerialPort } from "serialport";
import cors from "cors";
import fs from "fs";
import path from "path";
import { supaClient } from "./hooks/supa-client.ts";
import dotenv from "dotenv";

dotenv.config();

const app: Application = express();
let port: SerialPort | null = null;
let receivedDataBuffer: string = "";

app.use(express.json());
app.use(cors());

// Define the interface for machine data
interface MachineData {
  dorsiflexion: number[];
  eversion: number[];
  extension: number[];
  [key: string]: any;
}

// Initialize machine data
let machineData: MachineData = {
  dorsiflexion: [],
  eversion: [],
  extension: [],
};

// Function to reset only specific properties of MachineData
function resetMachineData(): MachineData {
  return {
    dorsiflexion: [],
    eversion: [],
    extension: [],
  };
}

let jsonFilename = "";
let machine_id = "";


/*
..######..########.########..####....###....##..........########...#######..########..########
.##....##.##.......##.....##..##....##.##...##..........##.....##.##.....##.##.....##....##...
.##.......##.......##.....##..##...##...##..##..........##.....##.##.....##.##.....##....##...
..######..######...########...##..##.....##.##..........########..##.....##.########.....##...
.......##.##.......##...##....##..#########.##..........##........##.....##.##...##......##...
.##....##.##.......##....##...##..##.....##.##..........##........##.....##.##....##.....##...
..######..########.##.....##.####.##.....##.########....##.........#######..##.....##....##...
*/

app.post("/initialize-serial-port", (_, res) => {
  const closeSerialPort = () => {
    if (port && port.isOpen) {
      port.close((err) => {
        if (err) {
          console.error("Error closing the port:", err.message);
        } else {
          console.log("Serial port closed.");
        }
      });
    } else {
      console.warn("Serial port is not open. No need to close.");
    }
  };

  if (port && port.isOpen) {
    res.status(200).send("Serial port already initialized.");
  } else {
    SerialPort.list().then((ports) => {
      const scannerPort = ports.find(
        (port) => port.manufacturer === "STMicroelectronics",
      );

      if (scannerPort) {
        console.log("Scanner port:", scannerPort.path);
        port = new SerialPort({
          path: scannerPort.path,
          baudRate: 115200,
        });

        port.on("error", (error) => {
          console.error("Error opening the port:", error.message);
          machineData = resetMachineData();
          closeSerialPort();
        });

        port.on("open", () => {
          console.log("Serial port opened.");
          res.status(200).send("Serial port initialized and ready.");
        });
      } else {
        console.error("No scanner port found.");
        res.status(500).send("No scanner port found.");
      }
    });
  }
});

app.post("/reset-serial-port", (_, res) => {
  try {
    machineData = resetMachineData();

    // Close the serial port when the server is closed
    if (port && port.isOpen) {
      port.close((err) => {
        if (err) {
          console.error("Error closing the port:", err.message);
        } else {
          console.log("Serial port closed.");
        }
      });
    }

    // Respond with a success message
    res
      .status(200)
      .json({ message: "Serial port reset successful", machineData });
  } catch (error: any) {
    // Handle errors and respond with an error message
    res
      .status(500)
      .json({ message: "Error resetting serial port", error: error.message });
  }
});

app.post("/fetch-patient-data", (_, res) => {
  const createJSON = () => {
    const now = new Date();

    // Extracting only the date part from the current timestamp
    const datePart = now.toISOString().split("T")[0];

    jsonFilename = `./machineAngles/${datePart}.json`;

    fs.writeFile(jsonFilename, JSON.stringify(machineData), (err) => {
      if (err) {
        console.error("Error writing to JSON file:", err);
      } else {
        console.log(`Data has been written to ${jsonFilename}`);
      }
    });
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const resetDataBuffer = () => {
    receivedDataBuffer = "";
  };

  if (port) {
    createJSON();

    // Add event listener for data received from the serial port
    port.on("data", (data) => {
      console.log("Received data:", data.toString());
      receivedDataBuffer += data.toString();

      // Check if the received data starts with '{'
      if (!receivedDataBuffer.startsWith("{")) {
        // If it doesn't start with '{', clear the buffer and continue buffering
        resetDataBuffer();
      }

      // Check if the receivedDataBuffer is more than 100 characters
      if (receivedDataBuffer.length > 100) {
        // If it is, clear the buffer
        resetDataBuffer();
      }

      // Check if the received data forms a valid JSON
      try {
        const jsonData = JSON.parse(receivedDataBuffer);

        if (jsonData) {
          console.log("Received JSON:", jsonData);

          const currentTime = new Date(); // Get the current timestamp

          // Loop through the keys in jsonData
          for (const key in jsonData) {
            if (key in machineData) {
              const formattedTime = formatTime(currentTime);
              if (Array.isArray(machineData[key])) {
                // Check if it's an array, then push the value along with the timestamp to the array
                machineData[key].push({
                  data: jsonData[key],
                  time: formattedTime,
                });
              } else {
                // If it's not an array, update the value with an object containing the data and timestamp
                machineData[key] = {
                  data: jsonData[key],
                  time: formattedTime,
                };
              }
            }
          }
          // Optionally, save the updated machineData to the JSON file
          const machineDataString = JSON.stringify(machineData);
          fs.writeFile(jsonFilename, machineDataString, (err) => {
            if (err) {
              console.error("Error writing to file:", err);
            } else {
              console.log(`Data has been written to ${jsonFilename}`);
            }
          });
          // Reset the buffer for new data
          resetDataBuffer();
          res.status(200).send("Data received and processed successfully.");
        } else {
          res
            .status(400)
            .json({ message: "Invalid JSON data in the request." });
        }
      } catch (error) {
        // If the data does not form a complete JSON, keep buffering
      }
    });
  }
});

/*
.##.....##.##.....##.####
.##.....##.###...###..##.
.##.....##.####.####..##.
.#########.##.###.##..##.
.##.....##.##.....##..##.
.##.....##.##.....##..##.
.##.....##.##.....##.####
*/

app.post("/hmi-button-click", (req, res) => {
  const { mode, action, content } = req.body;
  console.log(
    `Button clicked:{${mode};${action};${content};}`,
    mode,
    action,
    content,
  );

  if (!port) {
    console.error("Serial port is not initialized.");
    res.status(500).send("Serial port is not initialized.");
    return;
  }

  const dataToSend = `{${mode};${action};${content};}`;

  port.write(dataToSend, (err) => {
    if (err) {
      console.error("Error writing to serial port:", err);
      res.status(500).send("Error writing to serial port.");
    } else {
      console.log("Data sent to serial port:", dataToSend);
      res.status(200).send("Data sent to serial port.");
    }
  });
});

app.post("/home-machine", (_, res) => {
  if (port && port.isOpen) {
    port.write("home", (err) => {
      if (err) {
        console.error("Error while homing the machine:", err);
        res.status(500).send("Error homing the machine");
      } else {
        console.log("Data sent to serial port:", "home");
        res.status(500).send("Homing was successfully sent");
      }
    });
  }
});

/*
..######..##.....##.########.....###....########.....###.....######..########.....######..########.########..##.....##.########.########.
.##....##.##.....##.##.....##...##.##...##.....##...##.##...##....##.##..........##....##.##.......##.....##.##.....##.##.......##.....##
.##.......##.....##.##.....##..##...##..##.....##..##...##..##.......##..........##.......##.......##.....##.##.....##.##.......##.....##
..######..##.....##.########..##.....##.########..##.....##..######..######.......######..######...########..##.....##.######...########.
.......##.##.....##.##........#########.##.....##.#########.......##.##................##.##.......##...##....##...##..##.......##...##..
.##....##.##.....##.##........##.....##.##.....##.##.....##.##....##.##..........##....##.##.......##....##....##.##...##.......##....##.
..######...#######..##........##.....##.########..##.....##..######..########.....######..########.##.....##....###....########.##.....##
*/

// Middleware to check if session is lost
async function checkSession(_: Request, res: Response, next: NextFunction) {
  try {
    const { data } = await supaClient.auth.getSession();

    const access_token = data.session?.access_token;
    const refresh_token = data.session?.refresh_token;

    if (!access_token || !refresh_token) {
      // Session is lost, handle it here
      console.error("Session lost");
      res.status(401).json({ error: "Session lost" });
    } else {
      console.log(data)
      // Session is still valid, continue with the request
      next();
    }
  } catch (error) {
    console.error("Error checking session:", error);
    res.status(500).json({ error: "Error checking session" });
  }
}

app.post("/push-supabase", checkSession, async (_, res) => {
  const folderPath = "./machineAngles";

  try {
    const files = await fs.promises.readdir(folderPath);

    for (const file of files) {
      if (file.endsWith(".json")) {
        const filePath = path.join(folderPath, file);

        try {
          const fileData = await fs.promises.readFile(filePath, "utf8");
          const fileContent = JSON.parse(fileData);

          // Extract the filename without the extension
          const fileName = filePath.split("/").pop()?.replace(".json", "");

          if (machine_id) {
            const {
              data: { user },
            } = await supaClient.auth.getUser();
            const { data, error } = await supaClient.rpc("push_angle", {
              machine_id: machine_id,
              user_id: user?.id,
              angles: fileContent,
              created_at: fileName,
            });

            if (error) {
              console.error(`Error for file ${file}:`, error);
            } else {
              console.log(`Success for file ${file}:`, data);

              // Delete the file after successful push
              await fs.promises.unlink(filePath);
              console.log(`Deleted file ${file}`);
            }
          }
        } catch (parseError) {
          console.error(`Error parsing JSON for file ${file}:`, parseError);
        }
      }
    }

    res.status(200).send("machineAngles sent to supabase.");
  } catch (err) {
    console.error("Error reading directory:", err);
    res.status(500).send("Error reading directory");
  }
});

app.post("/push-plan-supabase", checkSession, async (req, res) => {
  try{

      const { plan } = req.body;
      const {
        data: { user },
      } = await supaClient.auth.getUser();
      console.log(plan)
      const { data, error } = await supaClient.rpc("push_planning", {
        user_id: user?.id,
        new_plan: plan
      });
    
      if (error) {
        console.error(`Error sending plan:`, error);
      } else {
        console.log(`Success sending plan:`, data);
      }
  } catch (err) {
    console.error("Error sending plan:", err);
    res.status(500).send("Success sending plan");
  }
});
/*
.##........#######...######.....###....##...........######..########.########..##.....##.########.########.
.##.......##.....##.##....##...##.##...##..........##....##.##.......##.....##.##.....##.##.......##.....##
.##.......##.....##.##........##...##..##..........##.......##.......##.....##.##.....##.##.......##.....##
.##.......##.....##.##.......##.....##.##...........######..######...########..##.....##.######...########.
.##.......##.....##.##.......#########.##................##.##.......##...##....##...##..##.......##...##..
.##.......##.....##.##....##.##.....##.##..........##....##.##.......##....##....##.##...##.......##....##.
.########..#######...######..##.....##.########.....######..########.##.....##....###....########.##.....##
*/


app.post("/setup-local-server", async (req, res) => {
  try {
    const access_token = req.body.access_token;
    const refresh_token = req.body.refresh_token;

    const {
      data: { session },
    } = await supaClient.auth.setSession({
      access_token,
      refresh_token,
    });

    if (session) {
      // Optionally, you can perform additional setup actions here
      console.log("Local server setup successful.");
      res.status(200).send("Local server setup successful.");
    } else {
      res.status(401).json({ error: "Session not established" });
    }
  } catch (error) {
    console.error("Error setting up local server:", error);
    res.status(500).json({ error: "Error setting up local server" });
  }
});



/*
..######..########.########..##.....##.########.########......######..########.########.##.....##.########.
.##....##.##.......##.....##.##.....##.##.......##.....##....##....##.##..........##....##.....##.##.....##
.##.......##.......##.....##.##.....##.##.......##.....##....##.......##..........##....##.....##.##.....##
..######..######...########..##.....##.######...########......######..######......##....##.....##.########.
.......##.##.......##...##....##...##..##.......##...##............##.##..........##....##.....##.##.......
.##....##.##.......##....##....##.##...##.......##....##.....##....##.##..........##....##.....##.##.......
..######..########.##.....##....###....########.##.....##.....######..########....##.....#######..##.......
*/

const server = app.listen(3001, () => {
  console.log("Server is running on port 3001");
});

// Close the serial port when the server is closed
process.on("SIGINT", () => {
  console.log("\n Server is shutting down...");
  // Close the serial port when the server is closed
  if (port && port.isOpen) {
    port.close((err) => {
      if (err) {
        console.error("Error closing the port:", err.message);
      } else {
        console.log("Serial port closed.");
      }
    });
  }
  // Close the server
  server.close(() => {
    console.log("\n Server closed.");
    process.exit(0);
  });
});
