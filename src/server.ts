import express, { Application } from "express";
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
import exerciseDataRoute from "./routes/exerciseDataRoutes.ts";
import notificationRoute from "./routes/notificationRoutes.ts";
import { getSerialPort } from "./managers/serialPort.ts";
import { supabaseMiddleware } from "./middlewares/supabaseMiddleware.ts";
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
app.use(
  cors({
    origin: "http://localhost:1337",
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(supabaseMiddleware);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/relations", relationsRoutes);
app.use("/exercise-data", exerciseDataRoute);
app.use("/notification", notificationRoute);
app.use("/stm32", serialPortRoutes);
app.use("/plan", planRoutes);

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
