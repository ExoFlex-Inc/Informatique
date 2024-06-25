import { SerialPort } from "serialport";

let serialPort: SerialPort | null = null;
let receivedDataBuffer: string = "";

const getSerialPort = () => serialPort;
const setSerialPort = (port: SerialPort | null) => {
  serialPort = port;
};

const getReceivedDataBuffer = () => receivedDataBuffer;
const setReceivedDataBuffer = (buffer: string) => {
  receivedDataBuffer = buffer;
};

export {
  getSerialPort,
  setSerialPort,
  getReceivedDataBuffer,
  setReceivedDataBuffer,
};
