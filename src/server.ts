import express, { Application,  } from 'express';
import { SerialPort } from 'serialport';
import cors from 'cors';
import fs from "fs";
import path from 'path';
import { supaClient } from './hooks/supa-client.ts';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();
let port: SerialPort | null = null;  
let receivedDataBuffer: string = ''; 

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
    extension: []
  };
}

let jsonFilename = '';
let machine_id = '';

/*
..######..########.########..####....###....##..........########...#######..########..########
.##....##.##.......##.....##..##....##.##...##..........##.....##.##.....##.##.....##....##...
.##.......##.......##.....##..##...##...##..##..........##.....##.##.....##.##.....##....##...
..######..######...########...##..##.....##.##..........########..##.....##.########.....##...
.......##.##.......##...##....##..#########.##..........##........##.....##.##...##......##...
.##....##.##.......##....##...##..##.....##.##..........##........##.....##.##....##.....##...
..######..########.##.....##.####.##.....##.########....##.........#######..##.....##....##...
*/


app.post('/initialize-serial-port', (_, res) => {

  const closeSerialPort = () => {
    if (port && port.isOpen) {
      port.close((err) => {
        if (err) {
          console.error('Error closing the port:', err.message);
        } else {
          console.log('Serial port closed.');
        }
      });
    }
  };

  const createJSON = () => {
    const now = new Date();
    
    // Extracting only the date part from the current timestamp
    const datePart = now.toISOString().split('T')[0]; // Extracts the date part
    
    jsonFilename = `./machineAngles/${datePart}.json`;
  
    fs.writeFile(jsonFilename, JSON.stringify(machineData), (err) => {
      if (err) {
        console.error('Error writing to JSON file:', err);
      } else {
        console.log(`Data has been written to ${jsonFilename}`);
      }
    });
  }

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

    // Check if the port is already open
    if (port && port.isOpen) {
      console.log("Serial port is already connected");

      createJSON();

      res.status(200).send('Serial port is already connected.');
      return;
    }
  

  SerialPort.list().then((ports) => {
    const scannerPort = ports.find((port) => port.manufacturer === 'STMicroelectronics');

    if (scannerPort) {
      console.log('Scanner port:', scannerPort.path);
      port = new SerialPort({
        path: scannerPort.path,
        baudRate: 115200,
      });

      port.on('error', (error) => {
        console.error('Error opening the port:', error.message);
        machineData = resetMachineData();
        closeSerialPort();
      });

      port.on('open', () => {
        console.log('Serial port opened.');

        // Create a JSON file with today's date and time
        createJSON();
      });

      // Add event listener for data received from the serial port
      port.on('data', (data) => {
        console.log('Received data:', data.toString());
        receivedDataBuffer += data.toString();

        // Check if the received data forms a valid JSON
        try {

          const jsonData = JSON.parse(receivedDataBuffer);

          if (jsonData) {
            console.log('Received JSON:', jsonData);
          
            const currentTime = new Date(); // Get the current timestamp
          
            // Loop through the keys in jsonData
            for (const key in jsonData) {
              if (key in machineData) {
                const formattedTime = formatTime(currentTime);
                if (Array.isArray(machineData[key])) {
                  // Check if it's an array, then push the value along with the timestamp to the array
                  machineData[key].push({ data: jsonData[key], time: formattedTime });
                } else {
                  // If it's not an array, update the value with an object containing the data and timestamp
                  machineData[key] = { data: jsonData[key], time: formattedTime };
                }
              }
            }        
            // Optionally, save the updated machineData to the JSON file
            const machineDataString = JSON.stringify(machineData);
            fs.writeFile(jsonFilename, machineDataString, (err) => {
              if (err) {
                console.error('Error writing to file:', err);
              } else {
                console.log(`Data has been written to ${jsonFilename}`);
              }
            });
            // Reset the buffer for new data
            receivedDataBuffer = '';
            res.status(200).send('Data received and processed successfully.');
          } else {
            res.status(400).json({ message: 'Invalid JSON data in the request.' });
          }
        } catch (error) {
          // If the data does not form a complete JSON, keep buffering
        }
      });

      res.status(200).send('Serial port initialized and ready.');
    } else {
      console.error('No scanner port found.');
      res.status(500).send('No scanner port found.');
    }
  });
});

app.post('/reset-serial-port', (_, res) => {
  try {
    machineData = resetMachineData();

  // Close the serial port when the server is closed
  if (port && port.isOpen) {
    port.close((err) => {
      if (err) {
        console.error('Error closing the port:', err.message);
      } else {
        console.log('Serial port closed.');
      }
    });
  }
    
    // Respond with a success message
    res.status(200).json({ message: 'Serial port reset successful', machineData });
  } catch (error: any) {
    // Handle errors and respond with an error message
    res.status(500).json({ message: 'Error resetting serial port', error: error.message });
  }
});

/*
.##.....##....###.....######..##.....##.####.##....##.########
.###...###...##.##...##....##.##.....##..##..###...##.##......
.####.####..##...##..##.......##.....##..##..####..##.##......
.##.###.##.##.....##.##.......#########..##..##.##.##.######..
.##.....##.#########.##.......##.....##..##..##..####.##......
.##.....##.##.....##.##....##.##.....##..##..##...###.##......
.##.....##.##.....##..######..##.....##.####.##....##.########
*/

app.post('/hmi-button-click', (req, res) => {
  const { buttonClicked } = req.body;
  console.log('Button clicked:', buttonClicked);

  if (!port) {
    console.error('Serial port is not initialized.');
    res.status(500).send('Serial port is not initialized.');
    return;
  }

  const dataToSend =  buttonClicked;
  
  port.write(dataToSend, (err) => {
    if (err) {
      console.error('Error writing to serial port:', err);
      res.status(500).send('Error writing to serial port.');
    } else {
      console.log('Data sent to serial port:', dataToSend);
      res.status(200).send('Data sent to serial port.');
    }
  });
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


app.post('/push-supabase', async (_, res) => {

  const folderPath = './machineAngles';

  try {
    const files = await fs.promises.readdir(folderPath);

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(folderPath, file);

        try {
          const fileData = await fs.promises.readFile(filePath, 'utf8');
          const fileContent = JSON.parse(fileData);

          // Extract the filename without the extension
          const fileName = filePath.split('/').pop()?.replace('.json', '');

          if (machine_id) {

            const { data: { user } } = await supaClient.auth.getUser()
            const { data, error } = await supaClient.rpc('push_angle', {
              machine_id: machine_id,
              user_id: user?.id,
              angles: fileContent,
              created_at:fileName
            });

            if (error) {
              console.error(`Error for file ${file}:`, error);
              // You may choose to break the loop if there's an error in one file
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

    res.status(200).send('machineAngles sent to supabase.');
  } catch (err) {
    console.error('Error reading directory:', err);
    res.status(500).send('Error reading directory');
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

app.post('/setup-local-server', async (req, res) => {
  const access_token = req.body.access_token;
  const refresh_token = req.body.refresh_token;

  const { data: { session } } = await supaClient.auth.setSession({
    access_token,
    refresh_token
  });

  if (session) {
    const { data, error } = await supaClient.rpc('get_or_create_machine_for_user', { search_id: session.user.id });

    if (error) {
      res.status(500).json({ error: 'Error setting up local server' });
    } else {

      machine_id = data;

      res.status(200).send('local server has been setup');
    }
  } else {
    res.status(401).json({ error: 'Session not established' });
  }
});

const server = app.listen(3001, () => {
  console.log('Server is running on port 3001');
});

// Close the serial port when the server is closed
process.on('SIGINT', () => {
  console.log('\n Server is shutting down...');
  // Close the serial port when the server is closed
  if (port && port.isOpen) {
    port.close((err) => {
      if (err) {
        console.error('Error closing the port:', err.message);
      } else {
        console.log('Serial port closed.');
      }
    });
  }
  // Close the server
  server.close(() => {
    console.log('\n Server closed.');
    process.exit(0);
  });
});
