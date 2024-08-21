import React from "react";
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
import Forbidden from "./pages/Forbidden.tsx";

import PrivateRoutes from "./components/PrivateRoutes";

import { AvatarProvider } from "./context/avatarContext";

import useVisibilityChange from "./hooks/use-visibility-change.ts";

import { useSupabaseSession } from "./hooks/use-session.ts";
import { useUserProfile } from "./hooks/use-profile.ts";

// Import necessary modules from React Query
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<AppLayout />}>
      <Route path="/recovery" element={<Recovery />} />

      <Route
        element={<PrivateRoutes requiredPermissions={["dev", "client"]} />}
      >
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      <Route element={<PrivateRoutes requiredPermissions={["dev", "admin"]} />}>
        <Route path="/activity" element={<Activity />} />
        <Route path="/manual" element={<Manual />} />
        <Route path="/planning" element={<Planning />} />
        <Route path="/wellness_network" element={<WellnessNetwork />} />
      </Route>

      <Route path="/termsAndConditions" element={<TermsAndConditions />} />
      <Route path="/welcome" element={<Welcome />} loader={welcomeLoader} />
      <Route path="/hmi" element={<HMI />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/professional_network" element={<ProfessionalNetwork />} />
      <Route path="/forbidden" element={<Forbidden />} />
    </Route>,
  ),
);

function AppLayout() {
  const { session } = useSupabaseSession();
  const { profile } = useUserProfile();

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

  useVisibilityChange();

  const queryClient = new QueryClient();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <AvatarProvider>
            <div className="app">
              <RouterProvider router={router} />
            </div>
          </AvatarProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
