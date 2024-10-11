import {
    RadioGroup,
    FormControlLabel,
    Radio,
    FormControl,
    FormLabel,
} from "@mui/material";
import { blue } from "@mui/material/colors";
import { useEffect, useState } from "react";
import useStm32 from "../hooks/use-stm32.ts";

export type Side = "Right" | "Left";

interface ToggleSideProps {
    side: Side;
    setSide: React.Dispatch<React.SetStateAction<Side>>
}

const ToggleSide: React.FC<ToggleSideProps> = ({side, setSide}) => {

    const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSide(event.target.value as Side);
    };

    const [disabled, setDisabled] = useState(false);
    const {stm32Data} = useStm32();

    useEffect(() => {
        
    }, [stm32Data])

    return (
        <FormControl>
            <FormLabel
                sx={{ "&.Mui-focused": { color: blue[600] } }}
                id="demo-controlled-radio-buttons-group"
            >
                Side
            </FormLabel>
            <RadioGroup
                aria-labelledby="demo-controlled-radio-buttons-group"
                name="controlled-radio-buttons-group"
                onChange={handleToggleChange}
                value={side}
            >
                <FormControlLabel
                    disabled = {disabled}
                    value="Left"
                    control={<Radio sx={{ "&.Mui-checked": { color: blue[600] } }} />}
                    label="Left"
                />
                <FormControlLabel
                    disabled = {disabled}
                    value="Right"
                    control={<Radio sx={{ "&.Mui-checked": { color: blue[600] } }} />}
                    label="Right"
                />
            </RadioGroup>
      </FormControl>
    )
}

export default ToggleSide;