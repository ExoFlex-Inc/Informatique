import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import { useEffect, useState, useRef } from "react";
import {
  List,
  ListItem,
  Grid,
  Badge,
  Paper,
  IconButton,
  ThemeProvider,
  Box,
  ListItemText,
  Button,
  Typography,
  Avatar,
  ListItemAvatar,
  createTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useNotification } from "../hooks/use-notification.ts";
import { useUser } from "../hooks/use-user.ts";
import { useQueryClient } from "@tanstack/react-query";

const Notification = () => {
  const [isNotifications, setIsNotifications] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState<{
    [key: string]: string;
  }>({});
  const [lastSeenNotifications, setLastSeenNotifications] = useState<string[]>(
    [],
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const queryClient = useQueryClient();
  const { notifications, deleteNotification } = useNotification();
  const { user } = useUser();

  useEffect(() => {
    if (
      notifications &&
      notifications.length > 0 &&
      !notifications.every((n) => lastSeenNotifications.includes(n.id))
    ) {
      setIsNotifications(true);
    }
  }, [notifications, lastSeenNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
  }, [dropdownRef, buttonRef]);

  const handleNotificationClick = () => {
    setIsOpen(!isOpen);
    if (isNotifications) {
      setIsNotifications(false);
      setLastSeenNotifications(notifications.map((n: any) => n.id));
    }
  };

  // Handle Accept action
  const handleAccept = async (notification: any) => {
    if (!user?.user_id) {
      console.error("User profile is missing");
      return;
    }

    setResponseMessage((prev) => ({
      ...prev,
      [notification.id]: "Processing...",
    }));

    try {
      const responseRelation = await fetch(`http://localhost:3001/relations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          client_id: notification.sender_id,
          admin_id: user.user_id,
        }),
      });

      if (!responseRelation.ok) {
        throw new Error("Error accepting relation request");
      }

      queryClient.invalidateQueries({ queryKey: ["relations"] });
      deleteNotification(notification.id);

      setResponseMessage((prev) => ({
        ...prev,
        [notification.id]: "Relation request accepted",
      }));
    } catch (error) {
      console.error("Error accepting relation request:", error);
      setResponseMessage((prev) => ({
        ...prev,
        [notification.id]: "Error processing request",
      }));
    }
  };

  const handleReject = async (notification: any) => {
    setResponseMessage((prev) => ({
      ...prev,
      [notification.id]: "Processing...",
    }));

    try {
      deleteNotification(notification.id);

      setResponseMessage((prev) => ({
        ...prev,
        [notification.id]: "Relation request rejected",
      }));
    } catch (error) {
      console.error("Error rejecting relation request:", error);
      setResponseMessage((prev) => ({
        ...prev,
        [notification.id]: "Error processing request",
      }));
    }
  };

  return (
    <div>
      <IconButton ref={buttonRef} onClick={handleNotificationClick}>
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
            zIndex: 20,
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
            <Paper
              sx={{
                width: "30vw",
                padding: 2,
                maxHeight: "280px",
                overflow: "auto",
              }}
            >
              <List>
                {notifications && notifications.length > 0 ? (
                  notifications.map((notification: any, index: number) => (
                    <ListItem
                      key={notification.id || index}
                      alignItems="flex-start"
                    >
                      <ListItemAvatar>
                        <Avatar alt="Avatar" src={notification.image} />
                      </ListItemAvatar>
                      <Grid container>
                        <Grid item xs={12}>
                          <Box sx={{ display: "flex" }}>
                            <ListItemText
                              primary={
                                <Typography variant="body1" component="span">
                                  {notification.user_name}
                                </Typography>
                              }
                              secondary={
                                <Box>
                                  {notification.body && (
                                    <Typography
                                      variant="body2"
                                      component="span"
                                      className="text-black"
                                      display="block"
                                    >
                                      {notification.body}
                                    </Typography>
                                  )}
                                  <Typography
                                    variant="caption"
                                    component="span"
                                    display="block"
                                    color="textSecondary"
                                  >
                                    {new Date(
                                      notification.created_at,
                                    ).toLocaleString()}
                                  </Typography>
                                </Box>
                              }
                            />
                            {notification.type !== "relation" && (
                              <Box sx={{ alignContent: "center" }}>
                                <IconButton
                                  onClick={() => handleReject(notification)}
                                >
                                  <CloseIcon />
                                </IconButton>
                              </Box>
                            )}
                          </Box>
                          {notification.type === "relation" && (
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                marginTop: 1,
                              }}
                            >
                              {responseMessage[notification.id] ? (
                                <Typography
                                  variant="body2"
                                  color="textSecondary"
                                >
                                  {responseMessage[notification.id]}
                                </Typography>
                              ) : (
                                <>
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    sx={{ marginRight: 1 }}
                                    onClick={() => handleAccept(notification)}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    onClick={() => handleReject(notification)}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                            </Box>
                          )}
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
