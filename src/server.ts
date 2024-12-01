import express from "express";
import type { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import authRoutes from "./routes/authRoutes.ts";
import serialPortRoutes from "./routes/stm32Routes.ts";
import planRoutes from "./routes/planRoutes.ts";
import userRoutes from "./routes/userRoutes.ts";
import relationsRoutes from "./routes/relationsRoutes.ts";
import statRoutes from "./routes/statRoutes.ts";
import exerciseDataRoute from "./routes/exerciseDataRoutes.ts";
import notificationRoute from "./routes/notificationRoutes.ts";
import dockerRoutes from "./routes/dockerRoutes.ts";
import { getSerialPort } from "./managers/serialPort.ts";
import { supabaseMiddleware } from "./middlewares/supabaseMiddleware.ts";
import "./config/passportConfig.ts";
import rateLimit from "express-rate-limit";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import WebSocket from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env.production" });
} else {
  dotenv.config({ path: ".env" });
}

if (process.env["ROBOT"] === "false") {
  const scriptPath = path.resolve(__dirname, "../src/utils/stm32Simulator.sh");

  // Run socat for the STM32 simulator
  const myShellScript = exec(`bash ${scriptPath} 2>&1`, (error, stdout, _) => {
    if (error) {
      console.error(`Error executing script: ${error.message}`);
      return;
    }
    console.log(`Script output: ${stdout}`);
  });

  // Capture and log stdout data in real-time from socat
  if (myShellScript.stdout) {
    myShellScript.stdout.on("data", (data) => {
      console.log(`Output: ${data}`);
    });
  }
}

const app: Application = express();
const httpServer = createServer(app);
const wss = new WebSocket.Server({ port: 8080 });

// Store server start time
const SERVER_START_TIME = Date.now();

// Track if server is fully initialized
let serverReady = false;

wss.on("connection", (ws) => {
  console.log("Client connected");

  if (serverReady) {
    console.log("Server is ready, sending status to client");
    ws.send(
      JSON.stringify({
        type: "SERVER_STATUS",
        status: "READY",
        startTime: SERVER_START_TIME,
      }),
    );
    serverReady = false;
  }

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// Configure Socket.IO with CORS
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "http://localhost:1338",
    methods: ["GET", "POST"],
  },
});

// Configure Express with CORS
app.use(
  cors({
    origin: "http://localhost:1338",
    credentials: true,
  }),
);

app.use(express.static(path.join(__dirname, "../public")));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests from this IP, please try again after 15 minutes",
});

app.use("/auth", limiter);

app.use(express.json());
app.use(cookieParser());
app.use(supabaseMiddleware);

app.use(
  session({
    secret: process.env["SESSION_SECRET"] || "default_secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env["NODE_ENV"] === "production" },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/relations", relationsRoutes);
app.use("/exercise-data", exerciseDataRoute);
app.use("/stat", statRoutes);
app.use("/notification", notificationRoute);
app.use("/stm32", serialPortRoutes);
app.use("/plan", planRoutes);
app.use("/docker", dockerRoutes);

let lastCallTime = 0;

io.on("connection", (socket) => {
  console.log("A client connected");

  socket.on("sendDataToStm32", (data) => {
    const currentTime = Date.now();

    if (lastCallTime !== 0) {
      const timeDifference = currentTime - lastCallTime;
      if (timeDifference > 200) {
        console.log(
          `Time since last socket call passed 200: ${timeDifference} ms`,
        );
      }
    }

    lastCallTime = currentTime;

    const serialPort = getSerialPort();

    if (serialPort && serialPort.isOpen) {
      serialPort.write(data, (err) => {
        if (err) {
          console.error("Error writing to serial port:", err);
        } else {
          console.log("Data sent to serial port:", data);
        }
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});

export { io };

const PORT = process.env["PORT"] || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Set server as ready after everything is initialized
  serverReady = true;

  // Notify all connected clients that server is ready
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "SERVER_STATUS",
          status: "READY",
          startTime: SERVER_START_TIME,
        }),
      );
    }
  });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));

  // Handle client-side routing
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  });
}

process.on("SIGINT", () => {
  console.log("\n Server is shutting down...");
  serverReady = false; // Mark server as not ready during shutdown

  // Notify all clients that server is shutting down
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "SERVER_STATUS",
          status: "SHUTTING_DOWN",
          startTime: SERVER_START_TIME,
        }),
      );
    }
  });

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

  wss.close(() => {
    console.log("WebSocket server closed.");
    httpServer.close(() => {
      console.log("\n HTTP server closed.");
      process.exit(0);
    });
  });
});
