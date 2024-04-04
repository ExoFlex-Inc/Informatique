import React, { useEffect, useState } from "react";
import Button from "../components/Button..tsx";

import usePlanData from "../hooks/get-plan.ts";
import useStm32 from "../hooks/use-stm32.ts";

import { useMediaQuery } from "@mui/material";

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import StopIcon from '@mui/icons-material/Stop';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

export default function HMI() {
  const { planData } = usePlanData();
  const { stm32Data, errorFromStm32 } = useStm32();
  const [currentCellIndex, setCurrentCellIndex] = useState(0);
  const [currentExercice, setCurrentExercice] = useState(null);

  const isTablet = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if(planData){

      // console.log(planData)
      // console.log(planData.plan[0].exercise)
      setCurrentExercice(planData.plan[currentCellIndex].exercise)
    }

  }, [currentCellIndex, planData]);

  const handleNextButtonClick = () => {
    if (currentCellIndex < planData.plan.length - 1) {
      setCurrentCellIndex(prevIndex => prevIndex + 1);
      setCurrentExercice(planData.plan[currentCellIndex+1].exercise)
    }
  };

  return (
    <div className="plan-grid grid-cols-2 grid-rows-2 gap-4 custom-height mr-10 ml-10">
      <div className="bg-white rounded-2xl">
      </div>
      <div className="bg-white rounded-2xl"></div>
      <div className="bg-white col-span-1 flex flex-col justify-around rounded-2xl mb-5">
        <div className="flex justify-between mt-5 ml-10 mr-10">
            <Button
              label="Start"
              icon={<PlayArrowIcon />}
              mode="Auto"
              action="Control"
              content="Start"
              disabled={errorFromStm32 || (stm32Data && stm32Data.autoState !== 'Ready')}
              className={`bg-green-500 ${isTablet ? 'w-12 h-12' : 'w-16 h-16'}`}
            />
            <Button
              label="Stop"
              icon={<StopIcon />}
              mode="Auto"
              action="Control"
              content="Stop"
              disabled={errorFromStm32 || (stm32Data && stm32Data.autoState === 'Ready')}
              className={`bg-red-500 ${isTablet ? 'w-12 h-12' : 'w-16 h-16'}`}
            />
            <Button
              label="Next"
              icon={<SkipNextIcon />}
              mode="Auto"
              action="Control"
              content="Next"
              disabled={errorFromStm32}
              className={`bg-gray-500 ${isTablet ? 'w-12 h-12' : 'w-16 h-16'}`}
              onClick={handleNextButtonClick}
            />
          </div>
          {currentExercice === "Dorsiflexion" && (
            <div className="flex justify-between ml-10 mr-10 items-center">
              <Button
                label="DorsiflexionUp"
                icon={<ArrowUpwardIcon />}
                mode="Auto"
                action="Calib"
                content="dorsiflexionU"
                disabled={errorFromStm32}
                className={`bg-gray-500 ${isTablet ? 'w-20 h-20' : 'w-28 h-28'}`}
              />
              <Button
                label="DorsiflexionDown"
                icon={<ArrowDownwardIcon />}
                mode="Auto"
                action="Calib"
                content="dorsiflexionD"
                disabled={errorFromStm32}
                className={`bg-gray-500 ${isTablet ? 'w-20 h-20' : 'w-28 h-28'}`}
              />
            </div>
          ) }
          {currentExercice === "Extension" && (
            <div className="flex justify-between ml-10 mr-10 items-center">
              <Button
                label="ExtensionUp"
                icon={<ArrowUpwardIcon />}
                mode="Auto"
                action="Calib"
                content="extensionU"
                disabled={errorFromStm32}
                className={`bg-gray-500 ${isTablet ? 'w-20 h-20' : 'w-28 h-28'}`}
              />
              <Button
                label="ExtensionDown"
                icon={<ArrowDownwardIcon />}
                mode="Auto"
                action="Calib"
                content="extensionD"
                disabled={errorFromStm32}
                className={`bg-gray-500 ${isTablet ? 'w-20 h-20' : 'w-28 h-28'}`}
              />
            </div>
          ) }
          {currentExercice === "Eversion" && (
            <div className="flex justify-between ml-10 mr-10 items-center">
              <Button
                label="EversionLeft"
                icon={<RotateLeftIcon />}
                mode="Auto"
                action="Calib"
                content="eversionL"
                disabled={errorFromStm32}
                className={`bg-gray-500 ${isTablet ? 'w-20 h-20' : 'w-28 h-28'}`}
              />
              <Button
                label="EversionRight"
                icon={<RotateRightIcon />}
                mode="Auto"
                action="Calib"
                content="eversionR"
                disabled={errorFromStm32}
                className={`bg-gray-500 ${isTablet ? 'w-20 h-20' : 'w-28 h-28'}`}
              />
            </div>
          ) }
          <div className="mb-5">
            {stm32Data && (
              <div className="flex justify-center">
                {/* <h2 className="text-xl text-black">Current Exercice: {planData.plan[stm32Data.exerciseIdx]}</h2> */}
              </div>
            )}
          </div>
      </div>
      <div className="bg-white rounded-2xl overflow-auto min-w-0 mb-5"> {/* Apply rounded-2xl class here */}
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
            {planData && planData.plan.map((item, index) => (
              <tr key={index} className={index === currentCellIndex ? 'bg-green-200' : (index % 2 === 0 ? 'bg-gray-50' : 'bg-white')}>
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
