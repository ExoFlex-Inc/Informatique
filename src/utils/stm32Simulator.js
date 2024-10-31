import { SerialPort } from "serialport";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Polyfill __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from two directories up
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Configure the serial port (replace with your virtual port path)
const portPath = process.env.STM32_SERIAL_PORT; // Replace with your actual virtual port path
const baudRate = 115200;

// Create and open the serial port
const port = new SerialPort({
  path: portPath,
  baudRate: 115200,
});


// Function to generate random position and torque values
function generateRandomData(numMotors) {
  const positions = Array.from({ length: numMotors }, () => Math.floor(Math.random() * 21) + 10);
  const torques = Array.from({ length: numMotors }, () => Math.floor(Math.random() * 21));
  const currents = Array.from({ length: numMotors }, () => Math.floor(Math.random() * 21));
  return { positions, torques, currents };
}

// Function to create a JSON message similar to the C function's output
function createJsonMessage() {
  const { positions, torques, currents } = generateRandomData(3);
  const message = {
    Mode: "Automatic",
    AutoState: "Stretching",
    HomingState: "",
    ExerciseIdx: 0,
    Repetitions:1,
    ErrorCode: 0b10101,
    Positions: positions,
    Torques: torques,
    Current: currents,
  };
  return JSON.stringify(message);
}

// Periodically send JSON data over the serial port
const sendInterval = 5000;
const sendData = () => {
  const jsonMessage = createJsonMessage();
  port.write(jsonMessage + '\n', (err) => {
    if (err) {
      return console.error('Error writing to port:', err.message);
    }
    console.log('Sent JSON:', jsonMessage);
  });
};

// Set up interval for sending data
const intervalId = setInterval(sendData, sendInterval);

// Close port and clear interval on process exit
process.on('SIGINT', () => {
  clearInterval(intervalId);
  port.close((err) => {
    if (err) {
      console.error('Error closing port:', err.message);
    } else {
      console.log('Serial port closed.');
    }
    process.exit();
  });
});