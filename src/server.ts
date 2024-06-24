import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import serialPortRoutes from "./routes/serialPort.ts";
import supabaseRoutes from "./routes/supabase.ts";
import hmiRoutes from "./routes/hmi.ts";
import localServerRoutes from "./routes/localServer.ts";
import { getSerialPort } from "./managers/serialPort.ts";

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "http://localhost:1337",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(cors());

app.use("/api/serial-port", serialPortRoutes);
app.use("/api/supabase", supabaseRoutes);
app.use("/api/hmi", hmiRoutes);
app.use("/api/local-server", localServerRoutes);

io.on("connection", (socket) => {
  console.log("A client connected");

  socket.on("planData", (planData) => {
    const serialPort = getSerialPort();
    if (serialPort && serialPort.isOpen) {
      serialPort.write(planData, (err: any) => {
        if (err) {
          console.error("Error writing to serial port:", err);
        } else {
          console.log("Data sent to serial port:", planData);
        }
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});

export { io };

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("SIGINT", () => {
  console.log("\n Server is shutting down...");
  const serialPort = getSerialPort();
  if (serialPort && serialPort.isOpen) {
    serialPort.close((err: any) => {
      if (err) {
        console.error("Error closing the port:", err.message);
      } else {
        console.log("Serial port closed.");
      }
    });
  }
  httpServer.close(() => {
    console.log("\n Server closed.");
    process.exit(0);
  });
});
