import { Box, CircularProgress } from "@mui/material";

const Loading = () => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
    >
  <CircularProgress color="secondary" />
    </Box>
  );
};

export default Loading;
