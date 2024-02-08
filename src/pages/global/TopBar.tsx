import { useContext } from "react";
import { Box, IconButton, useTheme } from '@mui/material';
import { ColorModeContext, tokens } from "../../hooks/theme.ts";

import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

import { UserContext } from "../../App.tsx";
import Login from "../../components/Login.tsx";
import UserMenu from "../../components/UserMenu.tsx";

export default function TopBar() {
  const { session } = useContext(UserContext);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);

  return (
    <Box className="nav-bar justify-end">
      <Box className="flex pb-5 pt-5">
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
      </Box>
      <Box className="flex">
        <ul className="nav-right-list">
          <li className="nav-auth-item">
            {session && session.user ? <UserMenu /> : <Login />}
          </li>
        </ul>
      </Box>
    </Box>
  );
}
