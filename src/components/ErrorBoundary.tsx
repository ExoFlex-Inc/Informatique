import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { Box, Typography, Button, Paper, Container } from "@mui/material";
import { Error as ErrorIcon } from "@mui/icons-material";
import { ReactNode } from "react";

// Fallback component to display in case of an error
import { FallbackProps } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Container maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mt: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "error.light",
        }}
      >
        <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h5" component="h2" gutterBottom color="error.dark">
          Oops! Something went wrong
        </Typography>
        <Typography variant="body1" gutterBottom color="error.dark">
          {error.message}
        </Typography>
        <Box mt={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={resetErrorBoundary}
            sx={{ mt: 2 }}
          >
            Try Again
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

const ErrorBoundary = ({ children }: { children: ReactNode }) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Perform any reset logic here
        console.log("Error boundary reset");
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;
