import type { stm32DataType } from "../hooks/use-stm32.ts";
import { TableContainer, Table, TableCell, TableHead, TableRow, TableBody, Box, Typography, CssBaseline } from "@mui/material";

interface ExerciseOverviewWidgetProps {
  stm32Data?: stm32DataType | null;
  planData: any;
}

const ExerciseOverviewWidget: React.FC<ExerciseOverviewWidgetProps> = ({
  stm32Data,
  planData,
}) => {
  return (
    <Box sx={{display: "flex", flexDirection: "column", height: "calc(100vh - 100px)"}} className="max-h-40">
      <TableContainer sx={{borderRadius: "4px", overflowX: "hidden" }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow sx={{borderColor: "#e5e7eb"}}>
              <TableCell sx={{backgroundColor: "#f9fafb",
                borderColor: "#e5e7eb", 
                color: "black", 
                textAlign: "center", 
                borderRight: 1, 
                borderRightColor: "#e5e7eb"
              }}>
                <Typography>
                  Exercise
                </Typography>
              </TableCell>
              <TableCell sx={{backgroundColor: "#f9fafb", 
                color: "black", 
                textAlign: "center", 
                borderColor: "#e5e7eb"
              }}>
                <Typography>
                  Repetitions
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {planData && Array.isArray(planData.plan)
              ? planData.plan.map(
                  (
                    item: { movement: any[]; repetitions: number; rest: number },
                    index: number,
                  ) =>
                    "movement" in item && (
                      <TableRow
                        key={index}
                        className={
                          index === stm32Data?.ExerciseIdx
                            ? "bg-green-200"
                            : index % 2 === 0
                              ? "bg-gray-50"
                              : "bg-white"
                        }
                      >
                        <TableCell sx={{ borderBottomColor: "#e5e7eb", color: "black", textAlign: "center"}}>
                          {item.movement.map((movement: any, index: number) => (
                            <Typography key={index}>{movement.exercise}</Typography>
                          ))}
                        </TableCell>
                        <TableCell sx={{ borderBottomColor: "#e5e7eb", color: "black", textAlign: "center"}}>
                          {item.repetitions}
                        </TableCell>
                      </TableRow>
                    ),
                )
              : true}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ExerciseOverviewWidget;
