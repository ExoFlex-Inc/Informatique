import React, { ChangeEvent } from "react";
import { Side } from "./ToggleSide.tsx";

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
      setLimitRight(limitType, name as Stretch, parsedValue);
    } else {
      setLimitLeft(limitType, name as Stretch, parsedValue);
    }
  };

  return (
    <div className="mt-4 ml-10 mr-10 rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 divide-y divide-gray-200">
          <tr className="bg-gray-50 divide-x divide-gray-200">
            <th
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              colSpan={3}
            >
              Max Torque {side} (Nm)
            </th>
            <th
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              colSpan={3}
            >
              Max Angle {side} (degrees)
            </th>
          </tr>
          <tr className="bg-gray-50 divide-x divide-gray-200">
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dorsiflexion Ankle
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Extension Knee
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Eversion Ankle
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dorsiflexion Ankle
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Extension Knee
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Eversion Ankle
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          <tr>
            {/* Torque Dorsiflexion */}
            <td className="px-6 py-4 whitespace-nowrap">
              <input
                type="number"
                name="dorsiflexion"
                value={
                  side === "Right"
                    ? (effectiveLimitsRight.torque.dorsiflexion ?? "")
                    : (effectiveLimitsLeft.torque.dorsiflexion ?? "")
                }
                onChange={(event) => handleLimitChange(event, "torque", side)}
                className="text-black border border-gray-300 text-center rounded px-2 py-1 w-full"
                min={0}
                max={TORQUE_LIMIT}
              />
            </td>
            {/* Torque Extension */}
            <td className="px-6 py-4 whitespace-nowrap">
              <input
                type="number"
                name="extension"
                value={
                  side === "Right"
                    ? (effectiveLimitsRight.torque.extension ?? "")
                    : (effectiveLimitsLeft.torque.extension ?? "")
                }
                onChange={(event) => handleLimitChange(event, "torque", side)}
                className="text-black border border-gray-300 text-center rounded px-2 py-1 w-full"
                min={0}
                max={TORQUE_LIMIT}
              />
            </td>
            {/* Torque Eversion */}
            <td className="px-6 py-4 whitespace-nowrap">
              <input
                type="number"
                name="eversion"
                value={
                  side === "Right"
                    ? (effectiveLimitsRight.torque.eversion ?? "")
                    : (effectiveLimitsLeft.torque.eversion ?? "")
                }
                onChange={(event) => handleLimitChange(event, "torque", side)}
                className="text-black border border-gray-300 text-center rounded px-2 py-1 w-full"
                min={0}
                max={TORQUE_LIMIT}
              />
            </td>
            {/* Angle Dorsiflexion */}
            <td className="px-6 py-4 whitespace-nowrap">
              <input
                type="number"
                name="dorsiflexion"
                value={
                  side === "Right"
                    ? (effectiveLimitsRight.angles.dorsiflexion ?? "")
                    : (effectiveLimitsLeft.angles.dorsiflexion ?? "")
                }
                onChange={(event) => handleLimitChange(event, "angle", side)}
                className="text-black border border-gray-300 text-center rounded px-2 py-1 w-full"
                min={0}
                max={ANGLE_LIMIT}
              />
            </td>
            {/* Angle Extension */}
            <td className="px-6 py-4 whitespace-nowrap">
              <input
                type="number"
                name="extension"
                value={
                  side === "Right"
                    ? (effectiveLimitsRight.angles.extension ?? "")
                    : (effectiveLimitsLeft.angles.extension ?? "")
                }
                onChange={(event) => handleLimitChange(event, "angle", side)}
                className="text-black border border-gray-300 text-center rounded px-2 py-1 w-full"
                min={0}
                max={ANGLE_LIMIT}
              />
            </td>
            {/* Angle Eversion */}
            <td className="px-6 py-4 whitespace-nowrap">
              <input
                type="number"
                name="eversion"
                value={
                  side === "Right"
                    ? (effectiveLimitsRight.angles.eversion ?? "")
                    : (effectiveLimitsLeft.angles.eversion ?? "")
                }
                onChange={(event) => handleLimitChange(event, "angle", side)}
                className="text-black border border-gray-300 text-center rounded px-2 py-1 w-full"
                min={0}
                max={ANGLE_LIMIT}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ExercisesLimitsTable;
