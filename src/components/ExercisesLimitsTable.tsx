import React, { ChangeEvent } from "react";
import {
  TableContainer,
  TableHead,
  TableRow,
  TableBody,
  Table,
  TableCell,
  Typography,
  Paper,
} from "@mui/material";
import type { Side } from "./ToggleSide.tsx";

// Define types for better type safety
type LimitType = "torque" | "angle";
type Stretch = "dorsiflexion" | "extension" | "eversion";

// Define constants for limits
const TORQUE_LIMIT = 65;
const ANGLE_LIMIT = 90;

// Interfaces
interface Limits {
  torque: { dorsiflexion: number; extension: number; eversion: number };
  angles: { dorsiflexion: number; extension: number; eversion: number };
}

interface ExercisesLimitsTableProps {
  side: Side;
  limitsLeft: Limits;
  limitsRight: Limits;
  setLimitLeft: (type: LimitType, stretch: Stretch, value: number) => void;
  setLimitRight: (type: LimitType, stretch: Stretch, value: number) => void;
}

const ExercisesLimitsTable: React.FC<ExercisesLimitsTableProps> = ({
  side,
  limitsLeft,
  limitsRight,
  setLimitLeft,
  setLimitRight,
}) => {
  // Define the default limits structure
  const defaultLimits: Limits = {
    torque: { dorsiflexion: 0, extension: 0, eversion: 0 },
    angles: { dorsiflexion: 0, extension: 0, eversion: 0 },
  };

  // Define effective limits
  const effectiveLimitsLeft: Limits = limitsLeft || defaultLimits;
  const effectiveLimitsRight: Limits = limitsRight || defaultLimits;

  // Unified handler function
  const handleLimitChange = (
    event: ChangeEvent<HTMLInputElement>,
    limitType: LimitType,
    side: Side,
  ) => {
    const { name, value } = event.target;

    // Determine the maximum limit based on limit type
    const maxLimit = limitType === "torque" ? TORQUE_LIMIT : ANGLE_LIMIT;

    // Parse the input value
    let parsedValue: number | null = null;
    if (value !== "") {
      const tempValue = parseInt(value, 10);
      if (!isNaN(tempValue)) {
        parsedValue = Math.min(maxLimit, Math.max(0, tempValue));
      }
    }

    // Update the appropriate state based on side and limit type
    if (side === "Right") {
      setLimitRight(limitType, name as Stretch, parsedValue ?? 0);
    } else {
      setLimitLeft(limitType, name as Stretch, parsedValue ?? 0);
    }
  };

  return (
    <TableContainer
      component={Paper}
      sx={{ borderRadius: "12px", bgcolor: "white" }}
    >
      <Table>
        <TableHead className="bg-gray-100">
          <TableRow>
            <TableCell
              sx={{ borderRight: 1, borderColor: "lightgrey" }}
              colSpan={3}
            >
              <Typography align="center" sx={{ color: "gray" }}>
                Max Torque {side} (Nm)
              </Typography>
            </TableCell>
            <TableCell sx={{ borderColor: "lightgrey" }} colSpan={3}>
              <Typography align="center" sx={{ color: "gray" }}>
                Max Angle {side} (degrees)
              </Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ borderRight: 1, borderColor: "lightgrey" }}>
              <Typography align="center" sx={{ color: "gray" }}>
                Dorsiflexion Ankle
              </Typography>
            </TableCell>
            <TableCell sx={{ borderRight: 1, borderColor: "lightgrey" }}>
              <Typography align="center" sx={{ color: "gray" }}>
                Extension Knee
              </Typography>
            </TableCell>
            <TableCell sx={{ borderRight: 1, borderColor: "lightgrey" }}>
              <Typography align="center" sx={{ color: "gray" }}>
                Eversion Ankle
              </Typography>
            </TableCell>
            <TableCell sx={{ borderRight: 1, borderColor: "lightgrey" }}>
              <Typography align="center" sx={{ color: "gray" }}>
                Dorsiflexion Ankle
              </Typography>
            </TableCell>
            <TableCell sx={{ borderRight: 1, borderColor: "lightgrey" }}>
              <Typography align="center" sx={{ color: "gray" }}>
                Extension Knee
              </Typography>
            </TableCell>
            <TableCell sx={{ borderColor: "lightgrey" }}>
              <Typography align="center" sx={{ color: "gray" }}>
                Eversion Ankle
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>
              <input
                type="number"
                name="dorsiflexion"
                value={
                  side === "Right"
                    ? (effectiveLimitsRight.torque.dorsiflexion ?? "")
                    : (effectiveLimitsLeft.torque.dorsiflexion ?? "")
                }
                onChange={(event) => handleLimitChange(event, "torque", side)}
                className="text-black border bg-white border-gray-300 text-center rounded px-2 py-1 w-full"
                min={0}
                max={TORQUE_LIMIT}
              />
            </TableCell>
            <TableCell>
              <input
                type="number"
                name="extension"
                value={
                  side === "Right"
                    ? (effectiveLimitsRight.torque.extension ?? "")
                    : (effectiveLimitsLeft.torque.extension ?? "")
                }
                onChange={(event) => handleLimitChange(event, "torque", side)}
                className="text-black border bg-white border-gray-300 text-center rounded px-2 py-1 w-full"
                min={0}
                max={TORQUE_LIMIT}
              />
            </TableCell>
            <TableCell>
              <input
                type="number"
                name="eversion"
                value={
                  side === "Right"
                    ? (effectiveLimitsRight.torque.eversion ?? "")
                    : (effectiveLimitsLeft.torque.eversion ?? "")
                }
                onChange={(event) => handleLimitChange(event, "torque", side)}
                className="text-black border bg-white border-gray-300 text-center rounded px-2 py-1 w-full"
                min={0}
                max={TORQUE_LIMIT}
              />
            </TableCell>
            <TableCell>
              <input
                type="number"
                name="dorsiflexion"
                value={
                  side === "Right"
                    ? (effectiveLimitsRight.angles.dorsiflexion ?? "")
                    : (effectiveLimitsLeft.angles.dorsiflexion ?? "")
                }
                onChange={(event) => handleLimitChange(event, "angle", side)}
                className="text-black border bg-white border-gray-300 text-center rounded px-2 py-1 w-full"
                min={0}
                max={ANGLE_LIMIT}
              />
            </TableCell>
            <TableCell>
              <input
                type="number"
                name="extension"
                value={
                  side === "Right"
                    ? (effectiveLimitsRight.angles.extension ?? "")
                    : (effectiveLimitsLeft.angles.extension ?? "")
                }
                onChange={(event) => handleLimitChange(event, "angle", side)}
                className="text-black border bg-white border-gray-300 text-center rounded px-2 py-1 w-full"
                min={0}
                max={ANGLE_LIMIT}
              />
            </TableCell>
            <TableCell>
              <input
                type="number"
                name="eversion"
                value={
                  side === "Right"
                    ? (effectiveLimitsRight.angles.eversion ?? "")
                    : (effectiveLimitsLeft.angles.eversion ?? "")
                }
                onChange={(event) => handleLimitChange(event, "angle", side)}
                className="text-black border bg-white border-gray-300 text-center rounded px-2 py-1 w-full"
                min={0}
                max={ANGLE_LIMIT}
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ExercisesLimitsTable;
