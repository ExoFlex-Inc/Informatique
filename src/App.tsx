import { createContext, useState } from "react";
import {
  Route,
  Outlet,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";
import { ColorModeContext, useMode } from "./hooks/theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import "./App.css";

import Dashboard from "./pages/Dashboard";
import ProfessionalNetwork from "./pages/ProfessionalNetwork";
import { Welcome, welcomeLoader } from "./pages/Welcome";
import HMI from "./pages/Hmi";
import Activity from "./pages/Activity";
import Recovery from "./pages/Recovery";
import Manual from "./pages/Manual";
import TermsAndConditions from "./pages/TermsAndConditions";
import Settings from "./pages/Settings";
import Planning from "./pages/Planning";
import WellnessNetwork from "./pages/WellnessNetwork";
import TopBar from "./pages/global/TopBar";
import ProSideBar from "./pages/global/Sidebar";
import Profile from "./pages/Profile";

import ProtectedRoute from "./components/ProtectedRoute";
import { ProfileProvider, useProfileContext } from "./context/profileContext";
import { AvatarProvider } from "./context/avatarContext";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<AppLayout />}>
      <Route path="/recovery" element={<Recovery />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
            component={Dashboard}
            requiredPermission={["client"]}
          />
        }
      />
      <Route
        path="/activity"
        element={
          <ProtectedRoute
            component={Activity}
            requiredPermission={["dev", "admin"]}
          />
        }
      />
      <Route path="/termsAndConditions" element={<TermsAndConditions />} />
      <Route path="/welcome" element={<Welcome />} loader={welcomeLoader} />
      <Route
        path="/manual"
        element={
          <ProtectedRoute
            component={Manual}
            requiredPermission={["dev", "admin"]}
          />
        }
      />
      <Route path="/hmi" element={<HMI />} />
      <Route
        path="/planning"
        element={
          <ProtectedRoute
            component={Planning}
            requiredPermission={["dev", "admin"]}
          />
        }
      />
      <Route path="/settings" element={<Settings />} />
      <Route
        path="/wellness_network"
        element={
          <ProtectedRoute
            component={WellnessNetwork}
            requiredPermission={["dev", "admin"]}
          />
        }
      />
      <Route path="/profile" element={<Profile />} />
      <Route path="/professional_network" element={<ProfessionalNetwork />} />
    </Route>,
  ),
);

function AppLayout() {
  const { session, profile } = useProfileContext();

  return (
    <>
      {session && profile && <ProSideBar permissions={profile.permissions} />}
      <main className="content">
        <TopBar />
        <Outlet />
      </main>
    </>
  );
}

function App() {
  const [theme, colorMode] = useMode();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ProfileProvider>
          <AvatarProvider>   
            <div className="app">
              <RouterProvider router={router} />
            </div>
          </AvatarProvider>
        </ProfileProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;