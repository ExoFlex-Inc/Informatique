import React from "react";
import PauseIcon from '@mui/icons-material/Pause';

interface PauseButtonProps {
    setGraphPause: React.Dispatch<React.SetStateAction<boolean>>
    graphPause: boolean
}

const setBackgroundColor = ({graphPause} : {graphPause: boolean}) => {
    return graphPause ? 'bg-red-600 rounded' : 'bg-transparent'
}

const PauseButton: React.FC<PauseButtonProps> = ({setGraphPause, graphPause}) => {
    return(
        <button className={setBackgroundColor({graphPause})}  onClick={() => setGraphPause(true)}>
            <PauseIcon/>
        </button>
    ) 
}

export default PauseButton;