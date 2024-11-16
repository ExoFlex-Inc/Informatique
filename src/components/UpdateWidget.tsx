import React, { useEffect, useState } from "react";
import {
  Button,
  Typography,
  CircularProgress,
  Box,
  Alert,
  Snackbar,
} from "@mui/material";

interface UpdateWidgetProps {
  onCheckUpdates: () => Promise<boolean>;
  onUpdate: () => Promise<void>;
}

const UpdateWidget: React.FC<UpdateWidgetProps> = ({
  onCheckUpdates,
  onUpdate,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertSeverity, setAlertSeverity] = useState<
    "error" | "warning" | "info" | "success"
  >();
  const [open, setOpen] = useState(false);

  // Function to check for updates
  const checkUpdates = async () => {
    setError(null);

    try {
      const isUpdateAvailable = await onCheckUpdates();
      setUpdateAvailable(isUpdateAvailable);

      if (isUpdateAvailable) {
        setAlertMessage("A new update is available.");
        setAlertSeverity("warning");
        setOpen(true);
      }
    } catch (err) {
      setError("Failed to check for updates.");
      setAlertMessage("Failed to check for updates.");
      setAlertSeverity("error");
      setOpen(true);
    }
  };

  useEffect(() => {
    checkUpdates();

    const intervalId = setInterval(() => {
      checkUpdates();
    }, 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const handleUpdate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await onUpdate();
      setUpdateAvailable(false);
      setAlertMessage("Update successful!");
      setAlertSeverity("success");
      setOpen(true);
    } catch (err) {
      setError("Failed to update.");
      setAlertMessage("Failed to update.");
      setAlertSeverity("error");
      setOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  return (
    <>
      <Snackbar
        open={open}
        autoHideDuration={5000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleClose}
          severity={alertSeverity}
          action={
            !isLoading && updateAvailable ? (
              <Button color="inherit" size="small" onClick={handleUpdate}>
                UPDATE NOW
              </Button>
            ) : null
          }
        >
          {isLoading ? (
            <>
              <CircularProgress
                size={20}
                sx={{ marginRight: 1, verticalAlign: "middle" }}
              />
              Updating...
            </>
          ) : (
            alertMessage
          )}
        </Alert>
      </Snackbar>
    </>
  );
};

export default UpdateWidget;
