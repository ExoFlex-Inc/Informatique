import { Box, CircularProgress } from "@mui/material";

const Loading = () => {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: "calc(50% - 50px)",
      }}
    >
      <CircularProgress size="100px" color="secondary" />
    </Box>
  );
};

export default Loading;
