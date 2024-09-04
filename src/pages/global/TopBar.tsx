import { useContext, useState, useRef, useEffect } from "react";
import { ColorModeContext, tokens } from "../../hooks/theme.ts";

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
import People from "@mui/icons-material/People";
import PersonIcon from "@mui/icons-material/Person";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import Icon from "../../../public/assets/user.png";

import Login from "../../components/Login.tsx";
import { useNavigate } from "react-router-dom";
import { useSupabaseSession } from "../../hooks/use-session.ts";
import { useUserProfile } from "../../hooks/use-profile.ts";

export default function TopBar() {
  const { session } = useSupabaseSession();
  const { profile } = useUserProfile();
  const theme = useTheme();
  // const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);

  const menuRef = useRef(null);
  const avatarRef = useRef(null);
  const navigate = useNavigate();

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

  const handleLogout = async (event) => {
    event.preventDefault();

    if (window.confirm("Are you sure you want to log out?")) {
      try {
        setIsMenuOpen(false);

        const response = await fetch("http://localhost:3001/auth/logout", {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to log out");
        }

        window.location.href = "/";
      } catch (error) {
        console.error("Error logging out:", error.message);

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
        {session && (
          <IconButton onClick={colorMode.toggleColorMode}>
            {theme.palette.mode === "dark" ? (
              <DarkModeOutlinedIcon />
            ) : (
              <LightModeOutlinedIcon />
            )}
          </IconButton>
        )}
        {/* {session && ( // Check if session exists
          <Notification />
        )} */}
        {session && (
          <IconButton>
            <SettingsOutlinedIcon />
          </IconButton>
        )}
        {session && (
          <IconButton className="h-14" onClick={onProfileClick}>
            <Avatar
              ref={avatarRef}
              src={profile?.avatar_url ? profile.avatar_url : Icon}
            />
          </IconButton>
        )}
      </Box>

      {session && session.user ? (
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
                {profile?.permissions == "client" ||
                  ("dev" && (
                    <ListItem>
                      <ListItemButton
                        onClick={() => navigate("/professional_network")}
                      >
                        <ListItemIcon>
                          <People />
                        </ListItemIcon>
                        <ListItemText primary="Professional Network" />
                      </ListItemButton>
                    </ListItem>
                  ))}
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
