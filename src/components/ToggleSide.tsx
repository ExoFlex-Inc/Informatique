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
import { getSerialPort } from "../managers/serialPort.ts";

export type Side = "Right" | "Left" | null;

interface ToggleSideProps {
    setSide?: React.Dispatch<React.SetStateAction<Side>>
}

const ToggleSide: React.FC<ToggleSideProps> = ({setSide}) => {

    const serialPort = getSerialPort();
    const [localSide, setLocalSide] = useState<Side>(null);

    const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (serialPort && stm32Data) {
            const message = `{${stm32Data.AutoState};${event.target.value};}`;
            serialPort.write(message, (err: any) => {
                if (err) {
                    console.error("Error writing to serial port:", err);
                } else {
                    console.log("Data sent to serial port:", message);
                }
            });
        }
    };

    const [disabled, setDisabled] = useState(true);
    const {stm32Data} = useStm32();

    useEffect(() => {
        if(stm32Data?.AutoState == "ready" || stm32Data?.AutoState == "waitingforplan") {
            setLocalSide(stm32Data?.CurrentLegSide as Side)
        }
    }, [stm32Data?.AutoState])

    useEffect(() => {
        if (setSide) {
            setSide(localSide);
        }
    }, [localSide])

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
                value={localSide}
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