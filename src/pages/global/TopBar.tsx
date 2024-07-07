import { useContext, useState, useRef, useEffect } from "react";
import { ColorModeContext, tokens } from "../../hooks/theme.ts";

import { Box, IconButton, useTheme, ThemeProvider, Divider, Paper, createTheme, Avatar, ListItemText, ListItem, List, ListItemButton, ListItemIcon } from "@mui/material";
import People from '@mui/icons-material/People';
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutIcon from '@mui/icons-material/Logout';

import { UserContext } from "../../App.tsx";
import Login from "../../components/Login.tsx";
import { supaClient } from "../../hooks/supa-client.ts";
import { useNavigate } from "react-router-dom";

export default function TopBar() {
  const { session } = useContext(UserContext);
  const theme = useTheme();
  // const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);

  const menuRef = useRef(null);
  const avatarRef = useRef(null);
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && avatarRef.current && !avatarRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      supaClient.auth.signOut();
      setIsMenuOpen(false);
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
          <IconButton>
            <NotificationsOutlinedIcon />
          </IconButton>
        )}
        {session && ( // Check if session exists
          <IconButton>
            <SettingsOutlinedIcon />
          </IconButton>
        )}
        {session && (
          <IconButton className="h-14" onClick={onProfileClick}>
            <Avatar ref={avatarRef} src="../../../public/assets/user.png" />
          </IconButton>
        )}
      </Box>

      {session && session.user ? 
      (
        isMenuOpen && (
          <Box ref={menuRef} sx={{ display: 'flex', position: 'absolute', zIndex: 20, top: '5rem' }}>
            <ThemeProvider
              theme={createTheme({
                palette: {
                  mode: 'light',
                  primary: { main: 'rgb(102, 157, 246)' },
                  background: { paper: 'rgb(235, 235, 235)' },
                },
              })}
            >
              <Paper>
                <ListItem>
                  <ListItemButton onClick={() => navigate('/profile')}>
                    <ListItemIcon>
                      <People />
                    </ListItemIcon>
                    <ListItemText primary="See Profile"/>
                  </ListItemButton>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemButton onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logout"/>
                  </ListItemButton>
                </ListItem>
              </Paper>
            </ThemeProvider>
          </Box>
        )
      ) : <Login />}

    </Box>
  );
}
