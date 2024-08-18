import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import authentificationRoutes from "./routes/authentificationRoutes.ts";
import serialPortRoutes from "./routes/serialPortRoutes.ts";
import planRoutes from "./routes/planRoutes.ts";
import wellnessNetworkRoutes from "./routes/wellnessNetworkRoutes.ts";
import hmiRoutes from "./routes/hmiRoutes.ts";
import userRoutes from "./routes/userRoutes.ts";
import localServerRoutes from "./routes/localServerRoutes.ts";
import wellnessNetworkRoutes from "./routes/wellnessNetworkRoutes.ts";
import { getSerialPort } from "./managers/serialPort.ts";
import "./config/passportConfig.ts";

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

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret", // Use a strong secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" }, // Use secure cookies in production
  })
);


app.use(passport.initialize());
app.use(passport.session());


app.use("/api", authentificationRoutes);
app.use("/api", serialPortRoutes);
app.use("/api", userRoutes);
app.use("/api", planRoutes);
app.use("/api", hmiRoutes);
app.use("/api", wellnessNetworkRoutes);

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
