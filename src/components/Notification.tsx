import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import { useEffect, useState, useRef } from "react";
import { useUserProfile } from "../hooks/use-profile.ts";
import { messaging, onMessage } from "../utils/firebaseClient.ts"; // Import Firebase messaging instance

import {
  List,
  ListItem,
  Grid,
  Badge,
  Paper,
  Button,
  IconButton,
  ThemeProvider,
  Box,
  ListItemText,
  Avatar,
  ListItemAvatar,
  Typography,
  createTheme,
} from "@mui/material";

const Notification = () => {
  const [isNotifications, setIsNotifications] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]); // State for notifications
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const { profile } = useUserProfile();

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef, buttonRef, setIsOpen]);

  // Listen for FCM notifications
  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Message received. ", payload);
      const { title, body } = payload.notification;

      setNotifications((prev) => [
        { title, body, timestamp: new Date() },
        ...prev,
      ]);

      setIsNotifications(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div>
      <IconButton ref={buttonRef} onClick={() => setIsOpen(!isOpen)}>
        {isNotifications ? (
          <Badge color="error" variant="dot">
            <NotificationsOutlinedIcon />
          </Badge>
        ) : (
          <NotificationsOutlinedIcon />
        )}
      </IconButton>
      {isOpen && (
        <Box
          ref={dropdownRef}
          justifyContent="center"
          sx={{
            display: "flex",
            position: "absolute",
            top: "70px",
            right: "90px",
            zIndex: "20",
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
            <Paper sx={{ width: "30vw" }}>
              <List>
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <ListItem key={index}>
                      <Grid container>
                        <Grid
                          className="content-center justify-center"
                          item
                          xs={4}
                        >
                          <ListItemAvatar>
                            <Avatar />
                          </ListItemAvatar>
                        </Grid>
                        <Grid item xs={8}>
                          <ListItemText
                            primary={notification.title}
                            secondary={
                              <Typography className="text-black">
                                {notification.body}
                              </Typography>
                            }
                          />
                        </Grid>
                      </Grid>
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No notifications" />
                  </ListItem>
                )}
              </List>
            </Paper>
          </ThemeProvider>
        </Box>
      )}
    </div>
  );
};

export default Notification;