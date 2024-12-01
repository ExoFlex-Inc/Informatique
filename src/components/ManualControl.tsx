import {
  Drawer,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  useTheme,
} from "@mui/material";
import {
  ArrowBack,
  ArrowForward,
  ArrowUpward,
  ArrowDownward,
  Compress,
  Expand,
} from "@mui/icons-material";

import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useState } from "react";
import Button from "./Button.tsx";
import type { stm32DataType } from "../hooks/use-stm32.ts";
import { useEffect } from "react";
import { tokens } from "../hooks/theme";
import HmiButtonMovement from "./HmiButtonMovement.tsx";
import HmiButtonClick from "./HmiButtonClick.tsx";

interface ManualControlProps {
  errorFromStm32: string | null;
  stm32Data: stm32DataType | null;
  socket: any;
}

const ManualControl = ({
  errorFromStm32,
  stm32Data,
  socket,
}: ManualControlProps) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isManualControlOpen, setIsManualControlOpen] = useState(false);
  const [changeSideDisabled, setChangeSideDisable] = useState(true);

  useEffect(() => {
    if (stm32Data?.Mode == "Automatic") {
      if (
        stm32Data.AutoState == "Ready" ||
        stm32Data.AutoState == "WaitingForPlan"
      ) {
        setChangeSideDisable(false);
      } else {
        setChangeSideDisable(true);
      }
    } else if (stm32Data?.Mode == "ChangeSide") {
      setChangeSideDisable(true);
    } else if (stm32Data?.Mode == "Manual") {
      setChangeSideDisable(false);
    }
  }, [stm32Data?.AutoState, stm32Data?.Mode]);

  return (
    <Box sx={{ justifyContent: "center", display: "flex", marginY: "5px" }}>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <IconButton
            onClick={() => setIsManualControlOpen(!isManualControlOpen)}
            sx={{
              color: "white",
              backgroundColor: "blueAccent.main",
              "&:hover": {
                backgroundColor: "#1D4ED8",
              },
            }}
          >
            <KeyboardArrowUpIcon />
          </IconButton>
        </Box>
      </Box>
      <Drawer
        anchor="bottom"
        variant="persistent"
        open={isManualControlOpen}
        onClose={() => setIsManualControlOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            overflow: "hidden",
            maxHeight: "80vh",
          },
        }}
      >
        <Box
          sx={{
            p: 1,
            background: `linear-gradient(45deg, #1F2A40 5%, #140f80 90%)`,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <IconButton
              onClick={() => setIsManualControlOpen(!isManualControlOpen)}
              sx={{
                color: "white",
                backgroundColor: "blueAccent.main",
                "&:hover": {
                  backgroundColor: "#1D4ED8",
                },
              }}
            >
              <KeyboardArrowDownIcon />
            </IconButton>
          </Box>
          <Grid container wrap="nowrap" spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ background: "#141b2d" }}>
                <CardContent
                  sx={{
                    "&.MuiCardContent-root:last-child": {
                      padding: "5px",
                    },
                    height: "120px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography sx={{ color: "white" }} noWrap variant="button">
                    Anatomical Movement
                  </Typography>
                  <Box
                    sx={{
                      flexGrow: 1,
                      alignContent: "center",
                      flexDirection: "column",
                    }}
                  >
                    <Grid container>
                      <Grid item xs={4}>
                        <Typography
                          sx={{
                            justifyContent: "center",
                            display: "flex",
                            color: "white",
                          }}
                          variant="subtitle1"
                        >
                          Eversion
                        </Typography>
                        <Box
                          sx={{
                            justifyContent: "center",
                            display: "flex",
                            gap: "40px",
                          }}
                        >
                          <HmiButtonMovement
                            mode="Manual"
                            action="Increment"
                            content={
                              stm32Data?.CurrentLegSide == "LegIsLeft"
                                ? "EversionO"
                                : "EversionI"
                            }
                            mainColor="blueAccent.main"
                            hoverColor="blueAccent.hover"
                            textColor="white"
                            disabled={
                              errorFromStm32 !== "0" || changeSideDisabled
                            }
                            icon={<ArrowBack />}
                            socket={socket}
                          />

                          <HmiButtonMovement
                            mode="Manual"
                            action="Increment"
                            content={
                              stm32Data?.CurrentLegSide == "LegIsLeft"
                                ? "EversionI"
                                : "EversionO"
                            }
                            mainColor="blueAccent.main"
                            hoverColor="blueAccent.hover"
                            textColor="white"
                            disabled={
                              errorFromStm32 !== "0" || changeSideDisabled
                            }
                            icon={<ArrowForward />}
                            socket={socket}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography
                          sx={{
                            justifyContent: "center",
                            display: "flex",
                            color: "white",
                          }}
                          variant="subtitle1"
                        >
                          Dorsiflexion
                        </Typography>
                        <Box
                          sx={{
                            justifyContent: "center",
                            display: "flex",
                            gap: "40px",
                          }}
                        >
                          <HmiButtonMovement
                            mode="Manual"
                            action="Increment"
                            content="DorsiflexionU"
                            mainColor="blueAccent.main"
                            hoverColor="blueAccent.hover"
                            textColor="white"
                            disabled={
                              errorFromStm32 !== "0" || changeSideDisabled
                            }
                            icon={<ArrowUpward />}
                            socket={socket}
                          />
                          <HmiButtonMovement
                            mode="Manual"
                            action="Increment"
                            content="DorsiflexionD"
                            mainColor="blueAccent.main"
                            hoverColor="blueAccent.hover"
                            textColor="white"
                            disabled={
                              errorFromStm32 !== "0" || changeSideDisabled
                            }
                            icon={<ArrowDownward />}
                            socket={socket}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={4} sx={{ justifyItems: "center" }}>
                        <Typography
                          sx={{
                            justifyContent: "center",
                            display: "flex",
                            color: "white",
                          }}
                          variant="subtitle1"
                        >
                          Extension
                        </Typography>
                        <Box
                          sx={{
                            justifyContent: "center",
                            display: "flex",
                            gap: "40px",
                          }}
                        >
                          <HmiButtonMovement
                            mode="Manual"
                            action="Increment"
                            content="ExtensionU"
                            mainColor="blueAccent.main"
                            hoverColor="blueAccent.hover"
                            textColor="text-white"
                            disabled={
                              errorFromStm32 !== "0" || changeSideDisabled
                            }
                            icon={<ArrowUpward />}
                            socket={socket}
                          />
                          <HmiButtonMovement
                            mode="Manual"
                            action="Increment"
                            content="ExtensionD"
                            mainColor="blueAccent.main"
                            hoverColor="blueAccent.hover"
                            textColor="text-white"
                            disabled={
                              errorFromStm32 !== "0" || changeSideDisabled
                            }
                            icon={<ArrowDownward />}
                            socket={socket}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ background: "#141b2d" }}>
                <CardContent
                  sx={{
                    height: "120px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography
                    variant="button"
                    gutterBottom
                    sx={{ color: "white" }}
                  >
                    Foot Fastening
                  </Typography>
                  <Box
                    sx={{
                      flexGrow: 1,
                      alignContent: "center",
                      flexDirection: "column",
                    }}
                  >
                    <Box
                      sx={{
                        justifyContent: "center",
                        display: "flex",
                        gap: "40px",
                      }}
                    >
                      <HmiButtonMovement
                        mode="Manual"
                        action="Tightening"
                        content="Forward"
                        mainColor="blueAccent.main"
                        hoverColor="blueAccent.hover"
                        textColor="white"
                        disabled={changeSideDisabled}
                        icon={<Compress />}
                        socket={socket}
                      />
                      <HmiButtonMovement
                        mode="Manual"
                        action="Tightening"
                        content="Backward"
                        mainColor="blueAccent.main"
                        hoverColor="blueAccent.hover"
                        textColor="white"
                        disabled={changeSideDisabled}
                        icon={<Expand />}
                        socket={socket}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ background: "#141b2d" }}>
                <CardContent
                  sx={{
                    height: "120px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography
                    variant="button"
                    gutterBottom
                    sx={{ color: "white" }}
                  >
                    Switch Side
                  </Typography>
                  <Box
                    sx={{
                      flexGrow: 1,
                      alignContent: "center",
                      flexDirection: "column",
                    }}
                  >
                    {stm32Data?.Mode !== "ChangeSide" ? (
                      <Box
                        sx={{
                          justifyContent: "center",
                          display: "flex",
                          gap: "40px",
                        }}
                      >
                        <HmiButtonClick
                          mode="ChangeSide"
                          mainColor={
                            stm32Data?.CurrentLegSide == "LegIsRight"
                              ? "blueAccent.main"
                              : ""
                          }
                          hoverColor={
                            stm32Data?.CurrentLegSide == "LegIsRight"
                              ? "blueAccent.hover"
                              : ""
                          }
                          textColor="white"
                          disabled={
                            changeSideDisabled ||
                            errorFromStm32 !== "0" ||
                            stm32Data?.CurrentLegSide == "LegIsLeft"
                          }
                          icon={<ArrowBack />}
                          socket={socket}
                        />
                        <HmiButtonClick
                          mode="ChangeSide"
                          mainColor={
                            stm32Data?.CurrentLegSide == "LegIsLeft"
                              ? "blueAccent.main"
                              : ""
                          }
                          hoverColor={
                            stm32Data?.CurrentLegSide == "LegIsLeft"
                              ? "blueAccent.hover"
                              : ""
                          }
                          textColor="white"
                          disabled={
                            changeSideDisabled ||
                            errorFromStm32 !== "0" ||
                            stm32Data?.CurrentLegSide == "LegIsRight"
                          }
                          icon={<ArrowForward />}
                          socket={socket}
                        />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: "flex",
                          gap: "20px",
                          justifyContent: "center",
                        }}
                      >
                        <CircularProgress color="secondary" />
                        <Typography
                          variant="subtitle1"
                          sx={{ alignContent: "center", color: "white" }}
                        >
                          Changing side
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Drawer>
    </Box>
  );
};

export default ManualControl;
