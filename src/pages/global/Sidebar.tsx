import { useState, useEffect, useContext } from "react";
import { Sidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import {
  Box,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import { tokens } from "../../hooks/theme.ts";

import { UserContext } from "../../App.tsx";

import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import TvIcon from "@mui/icons-material/Tv";
import BarChartIcon from "@mui/icons-material/BarChart";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import FeedOutlinedIcon from "@mui/icons-material/FeedOutlined";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import GroupIcon from "@mui/icons-material/Group";
import { supaClient } from "../../hooks/supa-client.ts";

interface ProSidebarProps {
  permissions: string;
}

const Item = ({ title, to, icon, selected, setSelected }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  const handleClick = () => {
    setSelected(title);
    navigate(to);
  };

  return (
    <MenuItem
      active={selected === title}
      style={{
        color: colors.grey[100],
      }}
      onClick={handleClick}
      icon={icon}
    >
      <Typography color={colors.grey[100]}>{title}</Typography>
    </MenuItem>
  );
};

const ProSidebar: React.FC<ProSidebarProps> = (props) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState(
    localStorage.getItem("selected") || "Dashboard",
  );
  const { profile } = useContext(UserContext);
  const isTablet = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    setIsCollapsed(isTablet);
  }, [isTablet]);

  useEffect(() => {
    localStorage.setItem("selected", selected);
  }, [selected]);

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
        <Menu
          menuItemStyles={{
            button: ({ level, active, disabled }) => {
              if (level === 0)
                return {
                  color: disabled ? `${colors.primary[200]}` : undefined,
                  backgroundColor: active
                    ? `${colors.blueAccent[500]}`
                    : `${colors.primary[400]}`,
                  transition: "background-color 0.3s",
                  "&:hover": {
                    backgroundColor:
                      `${colors.blueAccent[400]}` + " !important",
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
                <img
                  alt="profile-user"
                  width={isTablet ? "50px" : "100px"}
                  height={isTablet ? "50px" : "100px"}
                  src={`../assets/user.png`}
                  style={{ cursor: "pointer", borderRadius: "50%" }}
                />
              </Box>

              <Box textAlign="center">
                <Typography
                  variant={isTablet ? "h3" : "h2"}
                  color={colors.grey[100]}
                  fontWeight="bold"
                  sx={{ m: "10px 0 0 0" }}
                >
                  {profile?.username || "Client"}
                </Typography>
                <Typography
                  variant={isTablet ? "h6" : "h5"}
                  color={colors.greenAccent[500]}
                >
                  {profile?.speciality || "Speciality"}
                </Typography>
              </Box>
            </Box>
          )}

          <Box paddingLeft={isCollapsed ? undefined : "10%"}>
            <Item
              title="Dashboard"
              to="/"
              icon={<HomeOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            {/* <SubMenu label="Charts" icon={<BarChartIcon />}>
              <Item
                title="Activity"
                to="/activity"
                icon={<NavigateNextIcon style={{ fontSize: "small" }} />}
                selected={selected}
                setSelected={setSelected}
              />
            </SubMenu> */}
            {(props.permissions === "dev" || props.permissions === "admin") && (
              <Item
                title="Planning"
                to="/planning"
                icon={<FitnessCenterIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            )}
            {(props.permissions === "dev" || props.permissions === "admin") && (
              <Item
                title="Wellness Network"
                to="/wellness_network"
                icon={<GroupIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            )}

            {(props.permissions === "dev" || props.permissions === "admin") && (
              <Item
                title="Activity"
                to="/activity"
                icon={<FeedOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            )}

            <SubMenu label="Control Page" icon={<TvIcon />}>
              <Item
                title="HMI"
                to="/hmi"
                icon={<NavigateNextIcon style={{ fontSize: "small" }} />}
                selected={selected}
                setSelected={setSelected}
              />
              {(props.permissions == "dev" ||
                props.permissions === "admin") && (
                <Item
                  title="Manual"
                  to="/manual"
                  icon={<NavigateNextIcon style={{ fontSize: "small" }} />}
                  selected={selected}
                  setSelected={setSelected}
                />
              )}
            </SubMenu>
            {/* <Item
              title="Settings"
              to="/settings"
              icon={<SettingsOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            /> */}
          </Box>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            position="absolute"
            bottom="0"
            width="100%"
          >
            <img
              alt="logo"
              width={"250px"}
              height={"250px"}
              src={`../assets/logo.png`}
            />
          </Box>
        </Menu>
      </Sidebar>
    </Box>
  );
};

export default ProSidebar;
