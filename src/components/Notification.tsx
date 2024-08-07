import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import { useEffect, useState, useRef } from "react";
import { useProfileContext } from "../context/profileContext.tsx";
import { supaClient } from "../hooks/supa-client.ts";
import { refuseRequest, acceptRequest, fetchNotifications } from "../controllers/relationsController.ts";
import { List, ListItem, createTheme, Grid, Badge, Paper, Button, IconButton, ThemeProvider, Box, ListItemText, Avatar, ListItemAvatar, Typography } from "@mui/material";

const Notification = () => {
    const [isNotifications, setIsNotifications] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [avatars, setAvatars] = useState<(string | null | undefined) []>([]);
    const [relations, setRelations] = useState<any[]>([])
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);


    const {profile} = useProfileContext();

    useEffect(() => {
        async function fetchAdminNotifications () {
            const notificationData = await fetchNotifications(profile);
            if (notificationData) {
                if (notificationData.length > 0) {
                    setIsNotifications(true);
                    const clients = await Promise.all(notificationData.map((element: any) => fetchClient(element.client_id))) 
                    setClients(clients);
                    setRelations(notificationData);
                }
            }
        }
        fetchAdminNotifications();
    }, [])

    useEffect(() => {
        const paths = clients.map((client) => client.avatar_url)
        downloadImage(paths)
        if (clients.length == 0) {
            setIsNotifications(false);
        }
    },[clients])

    useEffect(() => {
        const handleClickOutside = (event: any) => {
          if (dropdownRef.current &&
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

    const downloadImage = async (paths: string[]) => {
        const images = await Promise.all(paths.map(async (path) => {
            if(path){
                try {
                    const { data, error } = await supaClient.storage.from('avatars').download(path)
                    if (error) {
                        throw error;
                    }
                    const url = URL.createObjectURL(data)
                    return url;
                } catch (error: any) {
                    console.error('Error downloading image: ', error.message)
                }
            } else {
                return null;
            }
        }))
        setAvatars(images);
    }

    async function fetchClient (clientId: string) {
        const {data, error} = await supaClient
        .from("user_profiles")
        .select()
        .eq("user_id", clientId)
        .single()

        if (error) {
            console.error("Error fetching client notification:", error.message);
        } else {
            return data;
        }
    }

    async function acceptClientRequest (relation: any) {
        const requestAccepted = await acceptRequest(relation);
        if(requestAccepted) {
            filteringNotifications(relation);
        }
    }

    async function refuseClientRequest (relation: any) {
        const isRequestRefuse = await refuseRequest(relation);
        if (isRequestRefuse) {
            filteringNotifications(relation);
        }
    }

    function filteringNotifications (relation: any) {
        const newClients = clients.filter((client) => {
            if (client.user_id == relation.client_id) {
                return false;
            } else {
                return true;
            }
        })
        const newRelation = relations.filter((element) => {
            if (relation.id === element.id) {
                return false;
            } else {
                return true;
            }
        })
        setRelations(newRelation);
        setClients(newClients);
    }

    return (
        <div>
            <IconButton ref={buttonRef} onClick={() => setIsOpen(!isOpen)}>
                {isNotifications ? 
                    <Badge color="error" variant="dot" >
                        <NotificationsOutlinedIcon />
                    </Badge>
                :
                    <NotificationsOutlinedIcon />
                }
            </IconButton>
            {isOpen && 
                <Box ref={dropdownRef} justifyContent="center" sx={{ display: 'flex', position: 'absolute', top: '70px', right: '90px', zIndex: '20' }}>
                    <ThemeProvider
                        theme={createTheme({
                            palette: {
                            mode: 'light',
                            primary: { main: 'rgb(102, 157, 246)' },
                            background: { paper: 'rgb(235, 235, 235)' },
                            },
                        })}
                    >
                        <Paper sx={{width: '30vw'}}>
                            <List>
                                {clients.length > 0 ? (

                                    clients.map((client, index) => 
                                        <ListItem key={index}>
                                            <Grid container >
                                                <Grid className="content-center justify-center" item xs={4}>
                                                    <ListItemAvatar>
                                                        <Avatar src={avatars[index]} />
                                                    </ListItemAvatar>
                                                </Grid>
                                                <Grid item xs={8}>
                                                    <ListItemText
                                                        primary="Connection request"
                                                        secondary={
                                                            <Typography className="text-black">
                                                                {client.username} {client.lastname} sends a connection request
                                                            </Typography>
                                                        }
                                                    />
                                                </Grid>
                                                <Grid className="" item xs={12}>
                                                    <Button onClick={() => acceptClientRequest(relations[index])} color="success">Accept</Button>
                                                    <Button onClick={() => refuseClientRequest(relations[index])} color="error">Refuse</Button>
                                                </Grid>
                                            </Grid>
                                        </ListItem>
                                    )
                                ):
                                    <ListItem >
                                        <ListItemText primary="No notifications"/>
                                    </ListItem>
                                }
                            </List>
                        </Paper>
                    </ThemeProvider>
                </Box>
            }
        </div>
    )
}

export default Notification