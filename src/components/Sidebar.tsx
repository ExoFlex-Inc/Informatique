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
  Toolbar
} from "@mui/material";

import MuiDrawer from '@mui/material/Drawer';

import type {Theme, CSSObject} from "@mui/material";

import { useNavigate, useLocation } from "react-router-dom";
import { tokens } from "../hooks/theme";
import {
  ChevronLeft,
  HomeOutlined,
  MenuOutlined,
  Tv,
  NavigateNext,
  FeedOutlined,
  FitnessCenter,
  Group,
  Menu,
  VideogameAsset
} from '@mui/icons-material';
import { useUser } from "../hooks/use-user";

interface ProSidebarProps {
  permissions: string;
}

interface ItemProps {
  text: string;
  index: number;
  to: string;
  open: boolean;
}

const Item: React.FC<ItemProps> = ({ text, index, to, open}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(to);
  };

  return (
    <ListItem key={text} disablePadding sx={{ display: 'block' }}>
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
          {index === 0 ? <HomeOutlined /> : index === 1 ? <Group /> : <Tv />}
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("");
  const { user } = useUser();
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const location = useLocation();
  const navigate = useNavigate();
  const page = location.pathname.split("/").pop() || "";

  const [open, setOpen] = useState(true);
  const allAccessPages: string[] = ["/dashboard", "/network", "/hmi"];
  const adminAndDevPages: string[] = ["/planning", "/activity", "/manual"]
  const drawerWidth = 240;

  useEffect(() => {
    let upperCasePage;
    if (page === "hmi") {
      upperCasePage = "HMI";
    } else if (page === "network" || page === "professional_network") {
      upperCasePage = "Network";
    } else {
      upperCasePage = page.charAt(0).toUpperCase() + page.slice(1);
    }
    setSelected(upperCasePage);
  }, [page]);

  useEffect(() => {
    setIsCollapsed(isTablet);
  }, [isTablet]);

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
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton onClick={() => setOpen(!open)}>
            {open ? <ChevronLeft /> : <Menu />}
          </IconButton>
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
        <List>
          {['Dashboard', 'Network', 'HMI'].map((text, index) => (
            <Item
              text={text}
              index={index} 
              to={allAccessPages[index] as string}
              open={open}  
            />
          ))}
          {(permissions === "admin" || permissions === "dev") &&
            ['Planning', 'Activity', 'Manual'].map((text, index) => (
              <Item
                text={text}
                index={index}
                to={adminAndDevPages[index] as string}
                open={open}
              />
          ))}
        </List>
      </Drawer>
    </Box>
  );
}
  // return (
  //   <Box
  //     sx={{
  //       display: "flex",
  //       height: "100%",
  //     }}
  //   >
      {/* <Sidebar
        className="sidebar-no-border"
        backgroundColor={colors.primary[400]}
        collapsed={isCollapsed}
      >
        <Menu
          // menuItemStyles={{
          //   button: ({ level, active, disabled }) => {
          //     if (level === 0)
          //       return {
          //         // color: disabled ? `${colors.primary[200]}` : undefined,
          //         marginRight: "10px",
          //         backgroundColor: active
          //           ? `${colors.blueAccent[500]}`
          //           : `${colors.primary[400]}`,
          //         "&:hover": {
          //           backgroundColor: `${colors.blueAccent[400]}`,
          //           color: "white !important",
          //           fontWeight: "bold !important",
          //         },
          //       };
          //     if (level === 1)
          //       return {
          //         backgroundColor: active
          //           ? `${colors.greenAccent[500]}`
          //           : `${colors.primary[400]}`,
          //         "&:hover": {
          //           backgroundColor:
          //             `${colors.greenAccent[500]}` + " !important",
          //           // color: "white !important",
          //           fontWeight: "bold !important",
          //         },
          //       };
          //   },
          // }}
        >
          <MenuItem
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
            style={{
              margin: "10px 0 20px 0",
              color: colors.grey[100],
              backgroundColor: "transparent",
            }}
            rootStyles={{
              "&:hover": {
                backgroundColor: "transparent !important",
              },
            }}
          >
            {!isCollapsed && (
              <Box
                display="flex"
                justifyContent="end"
                alignItems="center"
                ml="15px"
              >
                <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                  <MenuOutlinedIcon />
                </IconButton>
              </Box>
            )}
          </MenuItem>

          {!isCollapsed && (
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
          )}

          <Box paddingLeft={isCollapsed ? undefined : "10%"}>
            <Item
              title="Dashboard"
              to="/dashboard"
              icon={<HomeOutlinedIcon />}








              selected={selected}
            />
            {(permissions === "dev" || permissions === "admin") && (
              <Item
                title="Planning"
                to="/planning"
                icon={<FitnessCenterIcon />}
                selected={selected}
              />
            )}
            <Item
              title="Network"
              to="/network"
              icon={<GroupIcon />}
              selected={selected}
            />
            {(permissions === "dev" || permissions === "admin") && (
              <Item
                title="Activity"
                to="/activity"
                icon={<FeedOutlinedIcon />}
                selected={selected}
              />
            )}

            <SubMenu label="Control Page" icon={<TvIcon />}>
              <Item
                title="HMI"
                to="/hmi"
                icon={<NavigateNextIcon style={{ fontSize: "small" }} />}
                selected={selected}
              />
              {(permissions === "dev" || permissions === "admin") && (
                <Item
                  title="Manual"
                  to="/manual"
                  icon={<NavigateNextIcon style={{ fontSize: "small" }} />}
                  selected={selected}
                />
              )}
            </SubMenu>
          </Box>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            width="100%"
          >
            <img
              alt="logo"
              width={"200px"}
              height={"200px"}
              src="/assets/logo.png"
              style={{ paddingTop: "50px" }}
            />
          </Box>
        </Menu>
      </Sidebar> */}
    {/* </Box>
  );
}; */}

export default ProSidebar;