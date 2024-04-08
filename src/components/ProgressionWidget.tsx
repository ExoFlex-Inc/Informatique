import React, { useState, useEffect } from "react";
import CircularProgress, {
CircularProgressProps,
} from '@mui/material/CircularProgress';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

function CircularProgressWithLabel(
props: CircularProgressProps & { value: number },
) {
return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
    <CircularProgress size="9.375rem" variant="determinate" color="success" {...props} />
    <Box
        sx={{
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        }}
    >
        <Typography
        variant="caption"
        component="div"
        color="black"
        fontSize={30}
        >{`${Math.round(props.value)}%`}</Typography>
    </Box>
    </Box>
);
}

interface Props {
    stm32Data: any | null;
    planData: any;
}

export default function ProgressionWidget( {stm32Data, planData} : Props) {
    const [stretchProgress, setStrechProgress] = useState(0);
    const [totalStretch, setTotalStretch] = useState(0);
    const [repetitionProgress, setRepetitionProgress] = useState(0);
    const [totalRepetition, setTotalRepetition] = useState(0);

    // useEffect(() => {
    //   const timer = setInterval(() => {
    //     setSetProgress((oldProgress) => {
    //       if (oldProgress === 100) {
    //         return 0;
    //       }
    //       const diff = Math.random() * 10;
    //       return Math.min(oldProgress + diff, 100);
    //     });
    //   }, 500);

    //   return () => {
    //     clearInterval(timer);
    //   } 
    // }, []);

    useEffect(() => {
        setStrechProgress(stretchProgress + 1);
        setRepetitionProgress(stm32Data?.Repetitions);
      }, [stm32Data?.Repetitions]);
      
    useEffect(() => {
        setTotalRepetition(planData?.plan?.[stm32Data?.ExerciseIdx].Repetitions)
    },[planData, stm32Data?.ExerciseIdx]);

    useEffect(() => {
        planData?.plan.forEach((plan: any) => {
            setTotalStretch(totalStretch + plan.Repetitions);
        })
    },[planData]);

    return (
        <div className="">
            <div className="flex justify-center mb-2.5">
            <CircularProgressWithLabel value={stretchProgress}/>
            </div>
            <p className="text-black justify-center flex mb-7">
            Stretch Progress
            </p>
            <p className="text-black justify-center flex mb-1 text-xl">
            { Math.round(repetitionProgress/10) + '/10'}
            </p>
            <div className="flex justify-center mb-1">
            <Box sx={{ width: '75%' }}>
                <LinearProgress color="success" variant="determinate" value={repetitionProgress} />
            </Box>
            </div>
            <p className="text-black justify-center flex">
            Repetitions Progress
            </p>
        </div>
    );
}