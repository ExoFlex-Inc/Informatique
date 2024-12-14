import React, { useContext, useState, useRef, useEffect } from "react";
import {
  Box,
  IconButton,
  useTheme,
  ThemeProvider,
  Divider,
  Paper,
  createTheme,
  Avatar,
  ListItemText,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Snackbar,
  Alert,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import Notification from "./Notification.tsx";
import Login from "./Signup.tsx";
import { useNavigate } from "react-router-dom";
import { deleteToken } from "firebase/messaging";
import { messaging } from "../utils/firebaseClient.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "../hooks/use-user.ts";
import { ColorModeContext } from "../hooks/theme.ts";
import { DisablePagesContext } from "../context/DisablePagesContext.tsx";

export default function TopBar() {
  const { user } = useUser();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info"
  >("success");
  const { disabledItems, disableItem, enableItem } =
    useContext(DisablePagesContext);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const handleLogout = async (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();

    setSnackbarMessage("Logging out...");
    setSnackbarSeverity("info");
    setSnackbarOpen(true);

    try {
      setIsMenuOpen(false);

      const response = await fetch("http://localhost:3001/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          user_id: user?.user_id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to log out");
      }

      await deleteToken(messaging);

      queryClient.clear();

      setSnackbarMessage("Logged out successfully!");
      setSnackbarSeverity("success");
      navigate("/login", { replace: true });
    } catch (error) {
      setSnackbarMessage(
        "An error occurred while logging out. Please try again.",
      );
      setSnackbarSeverity("error");
      console.error("Error logging out:", error);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const onProfileClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <DisablePagesContext.Provider
      value={{ disabledItems, disableItem, enableItem }}
    >
      <Box className="nav-bar relative justify-end">
        <Box className="flex items-center">
          {user && (
            <IconButton onClick={colorMode.toggleColorMode}>
              {theme.palette.mode === "dark" ? (
                <DarkModeOutlinedIcon />
              ) : (
                <LightModeOutlinedIcon />
              )}
            </IconButton>
          )}
          {user && <Notification />}
          {user && (
            <IconButton
              className="h-14"
              onClick={disabledItems.length === 0 ? onProfileClick : undefined}
            >
              <Avatar
                ref={avatarRef}
                src={user?.avatar_url ? user.avatar_url : "/assets/user.png"}
              />
            </IconButton>
          )}
        </Box>

        {user ? (
          isMenuOpen && (
            <Box
              ref={menuRef}
              sx={{
                display: "flex",
                position: "absolute",
                zIndex: 20,
                top: "5rem",
              }}
            >
              <ThemeProvider
                theme={createTheme({
                  palette: {
                    mode: "light",
                    primary: { main: "rgb(102, 157, 246)" },
                    background: { paper: "rgb(235, 235, 235)" },
                  },
                })}
              >
                <Paper>
                  <ListItem>
                    <ListItemButton onClick={() => navigate("/profile")}>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText primary="See Profile" />
                    </ListItemButton>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemButton onClick={handleLogout}>
                      <ListItemIcon>
                        <LogoutIcon />
                      </ListItemIcon>
                      <ListItemText primary="Logout" />
                    </ListItemButton>
                  </ListItem>
                </Paper>
              </ThemeProvider>
            </Box>
          )
        ) : (
          <Login />
        )}

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={5000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </DisablePagesContext.Provider>
  );
}
