import React, { useEffect, useState } from "react";
import Button from "../components/Button.tsx";

import usePlanData from "../hooks/get-plan.ts";
import useStm32 from "../hooks/use-stm32.ts";

import { useMediaQuery } from "@mui/material";

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

export default function HMI() {
  const { planData } = usePlanData();
  const { stm32Data, socket, errorFromStm32 } = useStm32();
  const [nextButtonEnabled, setNextButtonEnabled] = useState(false);

  const isTablet = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (stm32Data && stm32Data.ExerciseIdx !== 0 && stm32Data.AutoState === "Ready") {
      setNextButtonEnabled(true);
    } else {
      setNextButtonEnabled(false);
    }

    if (stm32Data && planData && socket && stm32Data.AutoState === 'WaitingForPlan') {
      let message = `Limits:${planData.limits.angles.eversion};${planData.limits.angles.extension};${planData.limits.angles.dorsiflexion};${planData.limits.torque.eversion};${planData.limits.torque.extension};${planData.limits.torque.dorsiflexion}`;
      planData.plan.forEach((exercise) => {
        message += `;${exercise.exercise};${exercise.repetitions};${exercise.rest};${exercise.target_angle};${exercise.target_torque};${exercise.time}`;
      });
      socket.emit("planData", message);
    }
  }, [stm32Data && stm32Data.AutoState]); // May cause lag, modify if too much lag

  return (
    <div className="plan-grid grid-cols-2 grid-rows-2 gap-4 custom-height mr-10 ml-10">
      <div className="bg-white rounded-2xl">
      </div>
      <div className="bg-white rounded-2xl"></div>
      <div className="bg-white col-span-1 flex flex-col justify-around rounded-2xl mb-5">
        <div className="flex justify-between mt-5 ml-10 mr-10">
            {stm32Data && (stm32Data.AutoState !== "Ready" && stm32Data.AutoState !== "WaitingForPlan") ? (
              <Button
              label="Pause"
              icon={<PauseIcon />}
              mode="Auto"
              action="Control"
              content="Pause"
              disabled={!stm32Data || errorFromStm32}
              color="bg-yellow-500"
            />
            ) : (
              <Button
                label="Start"
                icon={<PlayArrowIcon />}
                mode="Auto"
                action="Control"
                content="Start"
                disabled={!stm32Data || errorFromStm32 || stm32Data.AutoState === "WaitingForPlan"}
                color="bg-green-500"
              />
            )}
            <Button
              label="Stop"
              icon={<StopIcon />}
              mode="Auto"
              action="Control"
              content="Stop"
              disabled={!stm32Data || errorFromStm32 || (stm32Data && stm32Data.AutoState === 'Ready')}
              color="bg-red-500"
            />
            <Button
              label="Next"
              icon={<SkipNextIcon />}
              mode="Auto"
              action="Control"
              content="Next"
              disabled={!stm32Data || !nextButtonEnabled || errorFromStm32}
              color="bg-gray-500"
            />
          </div>
          {stm32Data && stm32Data.AutoState === "Dorsiflexion" && (
            <div className="flex justify-between ml-10 mr-10 items-center">
              <Button
                label="DorsiflexionUp"
                icon={<ArrowUpwardIcon />}
                mode="Auto"
                action="Calib"
                content="dorsiflexionU"
                disabled={!stm32Data || errorFromStm32}
                color="bg-gray-500"
              />
              <Button
                label="DorsiflexionDown"
                icon={<ArrowDownwardIcon />}
                mode="Auto"
                action="Calib"
                content="dorsiflexionD"
                disabled={!stm32Data || errorFromStm32}
                color="bg-gray-500"
              />
            </div>
          ) }
          {stm32Data && stm32Data.AutoState === "Extension" && (
            <div className="flex justify-between ml-10 mr-10 items-center">
              <Button
                label="ExtensionUp"
                icon={<ArrowUpwardIcon />}
                mode="Auto"
                action="Calib"
                content="extensionU"
                disabled={!stm32Data || errorFromStm32}
                color="bg-gray-500"
              />
              <Button
                label="ExtensionDown"
                icon={<ArrowDownwardIcon />}
                mode="Auto"
                action="Calib"
                content="extensionD"
                disabled={!stm32Data || errorFromStm32}
                color="bg-gray-500"
              />
            </div>
          ) }
          {stm32Data && stm32Data.AutoState === "Eversion" && (
            <div className="flex justify-between ml-10 mr-10 items-center">
              <Button
                label="EversionLeft"
                icon={<RotateLeftIcon />}
                mode="Auto"
                action="Calib"
                content="eversionL"
                disabled={!stm32Data || errorFromStm32}
                color="bg-gray-500"
              />
              <Button
                label="EversionRight"
                icon={<RotateRightIcon />}
                mode="Auto"
                action="Calib"
                content="eversionR"
                disabled={!stm32Data || errorFromStm32}
                color="bg-gray-500"
              />
            </div>
          ) }
      </div>
      <div className="bg-white rounded-2xl overflow-auto min-w-0 mb-5">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="divide-x divide-gray-200">
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exercise
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Repetitions
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rest (sec)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {planData && stm32Data && planData.plan.map((item, index) => (
              <tr key={index} className={index === stm32Data.ExerciseIdx ? 'bg-green-200' : (index % 2 === 0 ? 'bg-gray-50' : 'bg-white')}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.exercise}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.repetitions}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.rest}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white rounded-2xl"></div>
      <div className="bg-white rounded-2xl"></div>
    </div>
  );
}
