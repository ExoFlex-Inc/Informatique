import { useContext, useState, useRef, useEffect } from "react";
import { ColorModeContext } from "../hooks/theme.ts";

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

export default function TopBar() {
  const { user } = useUser();
  const theme = useTheme();
  // const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);

  const menuRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

    if (window.confirm("Are you sure you want to log out?")) {
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

        queryClient.clear();

        await deleteToken(messaging);

        navigate("/login", { replace: true });
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error logging out:", error.message);
        } else {
          console.error("Error logging out:", error);
        }

        alert("An error occurred while logging out. Please try again.");
      }
    }
  };

  const onProfileClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
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
        {user && ( // Check if session exists
          <Notification />
        )}
        {user && (
          <IconButton className="h-14" onClick={onProfileClick}>
            <Avatar
              ref={avatarRef}
              src={
                user?.avatar_blob_url
                  ? user.avatar_blob_url
                  : "/assets/user.png"
              }
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
    </Box>
  );
}
