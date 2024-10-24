import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { getSerialPort } from "../managers/serialPort.ts";

const handleButtonClick = asyncHandler(async (req: Request, res: Response) => {
  let dataToSend = "{";

  Object.values(req.body).forEach((value) => {
    if (value) {
      dataToSend += value + ";"
    }
  })

  dataToSend += "}"

  console.log(`Button clicked:${dataToSend}`);

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
