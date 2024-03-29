import React from "react";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface PlayButtonProps {
    setGraphPause: React.Dispatch<React.SetStateAction<boolean>>
    graphPause: boolean
}

const setBackgroundColor = ({graphPause} : {graphPause: boolean}) => {
    return graphPause ? 'bg-transparent' : 'bg-green-600 rounded'
}

const PlayButton: React.FC<PlayButtonProps> = ({setGraphPause, graphPause}) => {
    return(
        <div className="rounded">
            <button className={setBackgroundColor({graphPause})}  onClick={() => setGraphPause(false)}>
                <PlayArrowIcon/>
            </button>
        </div>
    ) 
}

export default PlayButton;