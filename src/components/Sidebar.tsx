import { useState, useEffect } from "react";
import { Sidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import {
  Box,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  Avatar,
} from "@mui/material";

import { useNavigate, useLocation } from "react-router-dom";
import { tokens } from "../hooks/theme";

import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import TvIcon from "@mui/icons-material/Tv";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import FeedOutlinedIcon from "@mui/icons-material/FeedOutlined";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import GroupIcon from "@mui/icons-material/Group";
import Icon from "../../assets/user.png";
import CustomScrollbar from "./CustomScrollbars";
import { useUser } from "../hooks/use-user";

interface ProSidebarProps {
  permissions: string;
}

interface ItemProps {
  title: string;
  to: string;
  icon: React.ReactNode;
  selected: string;
}

const Item: React.FC<ItemProps> = ({ title, to, icon, selected }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(to);
  };

  return (
    <MenuItem
      active={selected === title}
      onClick={handleClick}
      icon={icon}
      prefix={title}
    ></MenuItem>
  );
};

const ProSidebar: React.FC<ProSidebarProps> = ({ permissions }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("");
  const { user } = useUser();
  const isTablet = useMediaQuery("(max-width: 768px)");
  const location = useLocation();
  const page = location.pathname.split("/").pop() || "";

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

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
      }}
    >
      <Sidebar
        className="sidebar-no-border"
        backgroundColor={colors.primary[400]}
        collapsed={isCollapsed}
      >
        <CustomScrollbar>
          <Menu
            menuItemStyles={{
              button: ({ level, active, disabled }) => {
                if (level === 0)
                  return {
                    color: disabled ? `${colors.primary[200]}` : undefined,
                    marginRight: "10px",
                    backgroundColor: active
                      ? `${colors.blueAccent[500]}`
                      : `${colors.primary[400]}`,
                    transition: "background-color 0.3s",
                    "&:hover": {
                      backgroundColor: `${colors.blueAccent[400]}`,
                      color: "white !important",
                      fontWeight: "bold !important",
                    },
                  };
                if (level === 1)
                  return {
                    backgroundColor: active
                      ? `${colors.greenAccent[500]}`
                      : `${colors.primary[400]}`,
                    "&:hover": {
                      backgroundColor:
                        `${colors.greenAccent[500]}` + " !important",
                      color: "white !important",
                      fontWeight: "bold !important",
                    },
                  };
              },
            }}
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
                    src={user.avatar_blob_url ? user.avatar_blob_url : Icon}
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
                src={`../assets/logo.png`}
                style={{ paddingTop: "50px" }}
              />
            </Box>
          </Menu>
        </CustomScrollbar>
      </Sidebar>
    </Box>
  );
};

export default ProSidebar;
