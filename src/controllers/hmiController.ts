import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { getSerialPort } from "../managers/serialPort.ts";

const handleButtonClick = asyncHandler(async (req: Request, res: Response) => {
  const { mode, action, content } = req.body;
  console.log(`Button clicked:{${mode};${action};${content};}`);

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

export { handleButtonClick };
