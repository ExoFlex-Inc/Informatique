import {
  RadioGroup,
  Box,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
} from "@mui/material";
import { blue } from "@mui/material/colors";

export type Side = "Right" | "Left";

interface ToggleSideProps {
  setSide: React.Dispatch<React.SetStateAction<Side>>;
  side: Side;
}

const ToggleSide: React.FC<ToggleSideProps> = ({ setSide, side }) => {
  return (
    <Box
      sx={{
        display: "flex",
        gap: "20px",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
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
          onChange={(event) => setSide(event.currentTarget.value as Side)}
          value={side}
        >
          <FormControlLabel
            value="Left"
            control={
              <Radio
                sx={{ "&.Mui-checked": { color: blue[600] }, color: "gray" }}
              />
            }
            label="Left"
          />
          <FormControlLabel
            value="Right"
            control={
              <Radio
                sx={{ "&.Mui-checked": { color: blue[600] }, color: "gray" }}
              />
            }
            label="Right"
          />
        </RadioGroup>
      </FormControl>
    </Box>
  );
};

export default ToggleSide;
