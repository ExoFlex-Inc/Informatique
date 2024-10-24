import { Paper, Typography, Grid, Box, Icon } from "@mui/material";
import Button from "./Button.tsx";
import { ReactNode } from "react";
import { stm32DataType } from "../hooks/use-stm32.ts";
interface MotorControlWidgetProps {
  title: string;
  icon: ReactNode;
  labels: string[];
  mode: string;
  action: string;
  color: string;
  stm32Data: stm32DataType | null;
  disabled?: boolean;
}

export default function MotorControlWidget({
  title,
  icon,
  labels,
  mode,
  action,
  stm32Data,
  disabled = false,
}: MotorControlWidgetProps) {
  return (
    <Paper
      elevation={3}
      sx={{
        width: "100%",
        maxWidth: 400,
        m: 1,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          bgcolor: "blueAccent.main",
          color: "primary.contrastText",
          p: 1,
          textAlign: "center",
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom>
          {title}
        </Typography>
        {icon}
      </Box>
      <Box sx={{ p: 2, bgcolor: "white" }}>
        <Grid container spacing={2}>
          {labels.map((label, index) => (
            <Grid item xs={6} key={index}>
              <Button
                label={label}
                mode={mode}
                action={action}
                content={label}
                color="blueAccent.main hover:bg-blue-700 text-white"
                disabled={disabled || stm32Data?.Mode == "ChangeSide"}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Paper>
  );
}
