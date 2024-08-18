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
import Notification from "../../components/Notification.tsx";

import Login from "../../components/Login.tsx";
import { useNavigate } from "react-router-dom";
import { useAvatarContext } from "../../context/avatarContext.tsx";
import { useProfileContext } from "../../context/profileContext.tsx";

export default function TopBar() {
  const { session } = useProfileContext();
  const theme = useTheme();
  // const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);

  const menuRef = useRef(null);
  const avatarRef = useRef(null);
  const navigate = useNavigate();
  const { profile } = useProfileContext();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { avatarUrl } = useAvatarContext();

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
        const response = await fetch('http://localhost:3001/api/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (response.ok) {
          setIsMenuOpen(false);
  
          window.location.href = '/';
        } else {
          console.error('Logout error:', data.error);
          alert('Logout failed: ' + data.error);
        }
      } catch (error) {
        console.error('Logout failed:', error);
        alert('An error occurred during logout. Please try again.');
      }
    }
  };

  const onProfileClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <Box className="nav-bar relative justify-end">
      <Box className="flex items-center">
        {session && ( // Check if session exists
          <IconButton onClick={colorMode.toggleColorMode}>
            {theme.palette.mode === "dark" ? (
              <DarkModeOutlinedIcon />
            ) : (
              <LightModeOutlinedIcon />
            )}
          </IconButton>
        )}
        {session && ( // Check if session exists
          <Notification />
        )}
        {session && ( // Check if session exists
          <IconButton>
            <SettingsOutlinedIcon />
          </IconButton>
        )}
        {session && (
          <IconButton className="h-14" onClick={onProfileClick}>
            <Avatar ref={avatarRef} src={avatarUrl ? avatarUrl : Icon} />
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
                {profile?.permissions == "client" && (
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
                )}
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
