import { Request, Response } from "express";
import { SerialPort } from "serialport";
import asyncHandler from "express-async-handler";
import { getSerialPort, setSerialPort, getReceivedDataBuffer, setReceivedDataBuffer } from "../managers/serialPort.ts";
import { io } from "../server.ts"; 

const initializeSerialPort = asyncHandler(async (req: Request, res: Response) => {
  const serialPort = getSerialPort();
  let receivedDataBuffer = getReceivedDataBuffer();

  if (serialPort && serialPort.isOpen) {
    console.log("Serial port already initialized.");
    res.status(200).send("Serial port already initialized.");
    return;
  }

  const ports = await SerialPort.list();
  const scannerPort = ports.find(
    (serialPort) => serialPort.manufacturer === "STMicroelectronics"
  );

  if (scannerPort) {
    console.log("Scanner port:", scannerPort.path);
    if (!serialPort || !serialPort.isOpen) {
      const newSerialPort = new SerialPort({
        path: scannerPort.path,
        baudRate: 115200,
      });

      newSerialPort.on("error", (error) => {
        console.log("Serial port error:", error.message);
      });

      newSerialPort.on("close", () => {
        console.log("Serial port closed");
        io.emit("serialPortClosed", "Serial port closed");
        setSerialPort(null);
      });

      newSerialPort.on("open", () => {
        console.log("Serial port opened.");
        res.status(200).send("Serial port initialized and ready.");
      });

      newSerialPort.on("data", (data) => {
        receivedDataBuffer += data.toString();
        setReceivedDataBuffer(receivedDataBuffer);

        for (let i = 0; i < receivedDataBuffer.length; i++) {
          if (receivedDataBuffer[i] === "{") {
            receivedDataBuffer = receivedDataBuffer.slice(i);
            setReceivedDataBuffer(receivedDataBuffer);
          } else if (receivedDataBuffer[i] === "}") {
            const jsonDataString = receivedDataBuffer.substring(0, i + 1);
            try {
              io.emit("stm32Data", JSON.parse(jsonDataString));
            } catch (err) {
              console.error("Error parsing JSON", err);
            }
            receivedDataBuffer = receivedDataBuffer.slice(i + 1);
            setReceivedDataBuffer(receivedDataBuffer);
          }
        }
      });

      setSerialPort(newSerialPort);
    } else {
      console.log("Serial port already initialized.");
      res.status(200).send("Serial port already initialized.");
    }
  } else {
    setSerialPort(null);
    console.error("No scanner port found.");
    res.status(500).send("No scanner port found.");
  }
});

export { initializeSerialPort };
