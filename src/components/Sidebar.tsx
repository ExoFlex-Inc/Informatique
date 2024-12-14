import { useState, useEffect, useContext } from "react";
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

import MuiDrawer from "@mui/material/Drawer";

import type { Theme, CSSObject } from "@mui/material";

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
} from "@mui/icons-material";
import { useUser } from "../hooks/use-user";
import { DisablePagesContext } from "../context/DisablePagesContext";

interface ProSidebarProps {
  permissions: string;
}

interface ItemProps {
  text: string;
  to: string;
  open: boolean;
  disabled?: boolean;
}

const Item: React.FC<ItemProps> = ({ text, to, open, disabled }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const backgroundColor = theme.palette.mode === "dark" ? "#2B5BB6" : "#7da9f7";

  const handleClick = () => {
    if (!disabled) navigate(to);
  };

  return (
    <ListItem
      key={text}
      disablePadding
      sx={{
        display: "block",
        backgroundColor: location.pathname === to ? backgroundColor : "",
      }}
    >
      <ListItemButton
        sx={[
          {
            minHeight: 48,
            px: 2.5,
          },
          open
            ? {
                justifyContent: "initial",
              }
            : {
                justifyContent: "center",
              },
        ]}
        onClick={handleClick}
      >
        <ListItemIcon
          sx={[
            {
              minWidth: 0,
              justifyContent: "center",
            },
            open
              ? {
                  mr: 3,
                }
              : {
                  mr: "auto",
                },
          ]}
        >
          {}
          {text === "Dashboard" ? (
            <HomeOutlined />
          ) : text === "Network" ? (
            <Group />
          ) : text === "HMI" ? (
            <Tv />
          ) : text === "Planning" ? (
            <FitnessCenter />
          ) : text === "Activity" ? (
            <FeedOutlined />
          ) : (
            <VideogameAsset />
          )}
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
  const [open, setOpen] = useState(true);
  const drawerWidth = 240;
  const { disabledItems, disableItem, enableItem } =
    useContext(DisablePagesContext);
  const menuItems = [
    {
      text: "Dashboard",
      to: "/dashboard",
      permissions: "all",
    },
    {
      text: "Network",
      to: "/network",
      permissions: "all",
    },
    {
      text: "Planning",
      to: "/planning",
      permissions: ["admin", "dev"],
    },
    {
      text: "Activity",
      to: "/activity",
      permissions: ["admin", "dev"],
    },
    {
      text: "HMI",
      to: "/hmi",
      permissions: "all",
    },
    {
      text: "Manual",
      to: "/manual",
      permissions: ["admin", "dev"],
    },
  ];

  const openedMixin = (theme: Theme): CSSObject => ({
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: "hidden",
  });

  const closedMixin = (theme: Theme): CSSObject => ({
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: "hidden",
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up("sm")]: {
      width: `calc(${theme.spacing(8)} + 1px)`,
    },
  });

  const DrawerHeader = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
  }));

  const Drawer = styled(MuiDrawer, {
    shouldForwardProp: (prop) => prop !== "open",
  })(({ theme }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    variants: [
      {
        props: ({ open }) => open,
        style: {
          ...openedMixin(theme),
          "& .MuiDrawer-paper": openedMixin(theme),
        },
      },
      {
        props: ({ open }) => !open,
        style: {
          ...closedMixin(theme),
          "& .MuiDrawer-paper": closedMixin(theme),
        },
      },
    ],
  }));

  useEffect(() => {
    setOpen(!isTablet);
  }, [isTablet]);

  return (
    <DisablePagesContext.Provider
      value={{ disabledItems, disableItem, enableItem }}
    >
      <Box sx={{ display: "flex" }}>
        <Drawer variant="permanent" sx={{ zIndex: 30 }} open={open}>
          <DrawerHeader>
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: open ? "end" : "center",
              }}
            >
              <IconButton onClick={() => setOpen(!open)}>
                {open ? <ChevronLeft /> : <Menu />}
              </IconButton>
            </Box>
          </DrawerHeader>
          {open && (
            <Box mb="5px">
              <Box display="flex" justifyContent="center" alignItems="center">
                <Avatar
                  src={user.avatar_url ? user.avatar_url : "/assets/user.png"}
                  sx={{ height: "83px", width: "83px", position: "flex" }}
                />
              </Box>

              <Box textAlign="center">
                <Typography
                  className={
                    user?.first_name.length < 15 ? "text-4xl" : "text-xl"
                  }
                  variant="h2"
                  color={colors.grey[100]}
                  fontWeight="bold"
                  sx={{ m: "10px 0 0 0" }}
                >
                  {user?.first_name || "Client"}
                </Typography>
                <Typography variant="h5" color={colors.greenAccent[500]}>
                  {user?.speciality || "Speciality"}
                </Typography>
              </Box>
            </Box>
          )}
          <List sx={{ paddingY: "0px" }}>
            {menuItems
              .filter((item) => {
                if (item.permissions === "all") return true;
                if (Array.isArray(item.permissions)) {
                  return item.permissions.includes(permissions);
                }
                return item.permissions === permissions;
              })
              .map((item) => (
                <Item
                  key={item.text}
                  text={item.text}
                  to={item.to}
                  open={open}
                  disabled={disabledItems.includes(item.text)}
                />
              ))}
          </List>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="end"
            height="100%"
            paddingBottom="5px"
          >
            <img
              alt="logo"
              src="/assets/logo.png"
              style={{
                paddingTop: "10px",
                height: "auto",
                maxWidth: open ? "45%" : "80%",
              }}
            />
          </Box>
        </Drawer>
      </Box>
    </DisablePagesContext.Provider>
  );
};

export default ProSidebar;
