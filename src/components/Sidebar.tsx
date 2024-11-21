import { useState, useEffect } from "react";
// import { Sidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import {
  Box,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  Avatar,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  List,
  styled,
} from "@mui/material";

import MuiDrawer from '@mui/material/Drawer';

import type {Theme, CSSObject} from "@mui/material";

import { useNavigate, useLocation } from "react-router-dom";
import { tokens } from "../hooks/theme";
import {
  ChevronLeft,
  HomeOutlined,
  Tv,
  FeedOutlined,
  FitnessCenter,
  Group,
  Menu,
  VideogameAsset,
} from '@mui/icons-material';
import { useUser } from "../hooks/use-user";

interface ProSidebarProps {
  permissions: string;
}

interface ItemProps {
  text: string;
  to: string;
  open: boolean;
}

const Item: React.FC<ItemProps> = ({ text, to, open}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const backgroundColor = theme.palette.mode === "dark" ? "#2B5BB6" : "#7da9f7"

  const handleClick = () => {
    navigate(to);
  };

  return (
    <ListItem key={text} disablePadding sx={{ display: 'block', backgroundColor: location.pathname === to ? backgroundColor : "" }}>
      <ListItemButton
        sx={[
          {
            minHeight: 48,
            px: 2.5,
          },
          open
            ? {
                justifyContent: 'initial',
              }
            : {
                justifyContent: 'center',
              },
        ]}
        onClick={handleClick}
      >
        <ListItemIcon
          sx={[
            {
              minWidth: 0,
              justifyContent: 'center',
            },
            open
              ? {
                  mr: 3,
                }
              : {
                  mr: 'auto',
                },
          ]}
        >
          {}
          {text === "Dashboard" ? <HomeOutlined /> :
            text === "Network" ? <Group /> :
            text === "HMI" ? <Tv /> :
            text === "Planning" ? <FitnessCenter /> :
            text === "Activity" ? <FeedOutlined /> :
            <VideogameAsset />
          }
        </ListItemIcon>
        <ListItemText
          primary={text}
          sx={[
            open
              ? {
                  opacity: 1,
                }
              : {
                  opacity: 0,
                },
          ]}
        />
      </ListItemButton>
    </ListItem>
  );
};

const ProSidebar: React.FC<ProSidebarProps> = ({ permissions }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { user } = useUser();
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const location = useLocation();
  const page = location.pathname.split("/").pop() || "";

  const [open, setOpen] = useState(true);
  const allAccessPages: string[] = ["/dashboard", "/network", "/hmi"];
  const adminAndDevPages: string[] = ["/planning", "/activity", "/manual"]
  const drawerWidth = 240;

  const openedMixin = (theme: Theme): CSSObject => ({
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
  });

  const closedMixin = (theme: Theme): CSSObject => ({
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
      width: `calc(${theme.spacing(8)} + 1px)`,
    },
  });

  const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
  }));

  const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme }) => ({
      width: drawerWidth,
      flexShrink: 0,
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      variants: [
        {
          props: ({ open }) => open,
          style: {
            ...openedMixin(theme),
            '& .MuiDrawer-paper': openedMixin(theme),
          },
        },
        {
          props: ({ open }) => !open,
          style: {
            ...closedMixin(theme),
            '& .MuiDrawer-paper': closedMixin(theme),
          },
        },
      ],
    }),
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer variant="permanent" sx={{zIndex: 30}} open={open}>
        <DrawerHeader>
          <Box sx={{width: "100%", display: "flex", justifyContent: open ? "end" : "center"}}>
            <IconButton onClick={() => setOpen(!open)}>
              {open ? <ChevronLeft /> : <Menu />}
            </IconButton>
          </Box>
        </DrawerHeader>
        {open && 
          <Box mb="25px">
            <Box display="flex" justifyContent="center" alignItems="center">
              <Avatar
                src={user.avatar_url ? user.avatar_url : "/assets/user.png"}
                sx={
                  isTablet
                    ? { width: 50, height: 50 }
                    : { width: 100, height: 100 }
                }
              />
            </Box>

            <Box textAlign="center">
              <Typography
                className={
                  user?.first_name.length < 15 ? "text-4xl" : "text-xl"
                }
                variant={isTablet ? "h3" : "h2"}
                color={colors.grey[100]}
                fontWeight="bold"
                sx={{ m: "10px 0 0 0" }}
              >
                {user?.first_name || "Client"}
              </Typography>
              <Typography
                variant={isTablet ? "h6" : "h5"}
                color={colors.greenAccent[500]}
              >
                {user?.speciality || "Speciality"}
              </Typography>
            </Box>
          </Box>        
        }
        <List sx={{paddingY: "0px"}}>
          {['Dashboard', 'Network', 'HMI'].map((text, index) => (
            <Item
              text={text} 
              to={allAccessPages[index] as string}
              open={open}  
            />
          ))}
          {(permissions === "admin" || permissions === "dev") &&
            ['Planning', 'Activity', 'Manual'].map((text, index) => (
              <Item
                text={text}
                to={adminAndDevPages[index] as string}
                open={open}
              />
          ))}
        </List>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="end"
          height="100%"
          paddingBottom="10px"
        >
          <img
            alt="logo"
            src="/assets/logo.png"
            style={{ paddingTop: "10px", height: "auto", maxWidth: open ? "45%" : "80%"}}
          />
        </Box>
      </Drawer>
    </Box>
  );
}

export default ProSidebar;