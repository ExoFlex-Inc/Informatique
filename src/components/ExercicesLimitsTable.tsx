import { Limits } from "../pages/Planning.tsx";


interface ExercicesLimitsTableProps {
    side: string;
    limitsLeft: Limits;
    limitsRight: Limits;
    setLimitsLeft: React.Dispatch<React.SetStateAction<Limits>>;
    setLimitsRight: React.Dispatch<React.SetStateAction<Limits>>;
}

const ExercicesLimitsTable: React.FC<ExercicesLimitsTableProps> = ({side,
    limitsLeft,
    limitsRight,
    setLimitsLeft,
    setLimitsRight
}) => {

    const handleTorqueLimitChange = (event, side: string) => {
        const { name, value } = event.target;
        let parsedValue = value !== "" ? Math.min(65, Math.max(0, parseInt(value))) : 0;

        if (side === "Right") {
            setLimitsRight((prevLimits) => ({
            ...prevLimits,
            torque: { ...prevLimits.torque, [name]: parsedValue },
            }));
        } else {
            setLimitsLeft((prevLimits) => ({
            ...prevLimits,
            torque: { ...prevLimits.torque, [name]: parsedValue },
            }));
        }
    };

    const handleAngleLimitChange = (event, side: string) => {
        const { name, value } = event.target;
        let parsedValue = value !== "" ? Math.min(90, Math.max(0, parseInt(value))) : 0;

        if (side === "Right") {
            setLimitsRight((prevLimits) => ({
            ...prevLimits,
            angles: { ...prevLimits.angles, [name]: parsedValue },
            }));
        } else {
            setLimitsLeft((prevLimits) => ({
            ...prevLimits,
            angles: { ...prevLimits.angles, [name]: parsedValue },
            }));
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
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  name="dorsiflexion"
                  value={side === "Right" ? 
                    limitsRight.torque.dorsiflexion :
                    limitsLeft.torque.dorsiflexion
                  }
                  onChange={side === "Right" ?
                    (event) => handleTorqueLimitChange(event, 'Right') :
                    (event) => handleTorqueLimitChange(event, 'Left')
                  }
                  className="text-black border border-gray-300 text-center rounded px-2 py-1 w-full"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  name="extension"
                  value={side === "Right" ? 
                    limitsRight.torque.extension :
                    limitsLeft.torque.extension
                  }
                  onChange={side === "Right" ?
                    (event) => handleTorqueLimitChange(event, 'Right') :
                    (event) => handleTorqueLimitChange(event, 'Left')
                  }
                  className="text-black border border-gray-300 text-center rounded px-2 py-1 w-full"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  name="eversion"
                  value={side === "Right" ? 
                    limitsRight.torque.eversion :
                    limitsLeft.torque.eversion
                  }
                  onChange={side === "Right" ?
                    (event) => handleTorqueLimitChange(event, 'Right') :
                    (event) => handleTorqueLimitChange(event, 'Left')
                  }
                  className="text-black border border-gray-300 text-center rounded px-2 py-1 w-full"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  name="dorsiflexion"
                  value={side === "Right" ? 
                    limitsRight.angles.dorsiflexion :
                    limitsLeft.angles.dorsiflexion
                  }
                  onChange={side === "Right" ?
                    (event) => handleAngleLimitChange(event, 'Right') :
                    (event) => handleAngleLimitChange(event, 'Left')
                  }
                  className="text-black border border-gray-300 text-center rounded px-2 py-1 w-full"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  name="extension"
                  value={side === "Right" ? 
                    limitsRight.angles.extension :
                    limitsLeft.angles.extension
                  }
                  onChange={side === "Right" ?
                    (event) => handleAngleLimitChange(event, 'Right') :
                    (event) => handleAngleLimitChange(event, 'Left')
                  }
                  className="text-black border border-gray-300 text-center rounded px-2 py-1 w-full"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  name="eversion"
                  value={side === "Right" ? 
                    limitsRight.angles.eversion :
                    limitsLeft.angles.eversion
                  }
                  onChange={side === "Right" ?
                    (event) => handleAngleLimitChange(event, 'Right') :
                    (event) => handleAngleLimitChange(event, 'Left')
                  }
                  className="text-black border border-gray-300 text-center rounded px-2 py-1 w-full"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
}

export default ExercicesLimitsTable;