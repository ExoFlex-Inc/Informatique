import { createContext, useEffect, useState } from "react";
import {
  Route,
  Outlet,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { ColorModeContext, useMode } from "./hooks/theme.ts";
import { CssBaseline, ThemeProvider } from "@mui/material";
import "./App.css";

import Dashboard from "./pages/Dashboard.tsx";
import { Welcome, welcomeLoader } from "./pages/Welcome.tsx";
import HMI, { hmiInit } from "./pages/Hmi.tsx";
import Home from "./pages/Home.tsx";
import Activity from "./pages/Activity.tsx";
import Manual, { manualInit } from "./pages/Manual.tsx";
import Settings from "./pages/Settings.tsx";
import Planning, { planInit } from "./pages/Planning.tsx";

import TopBar from "./pages/global/TopBar.tsx";
import ProSideBar from "./pages/global/Sidebar.tsx";

import { SupabaseUserInfo, useSession } from "./hooks/use-session.ts";
import Sequence from "./pages/Sequence.tsx";

export const UserContext = createContext<SupabaseUserInfo>({
  session: null,
  profile: null,
});

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/activity" element={<Activity />} />
      <Route path="/welcome" element={<Welcome />} loader={welcomeLoader} />
      <Route path="/manual" element={<Manual />} />
      <Route path="/hmi" element={<HMI />} />
      <Route path="/planning" element={<Planning />} />
      <Route path="/settings" element={<Settings />} />
    </Route>,
  ),
);

function Layout() {
  const supabaseUserInfo = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!supabaseUserInfo.session) {
      localStorage.setItem("lastLocation", location.pathname);
    }
  }, [supabaseUserInfo.session, location.pathname]);

  useEffect(() => {
    const lastLocation = localStorage.getItem("lastLocation");
    if (lastLocation) {
      navigate(lastLocation);
    }
  }, [navigate]);
  
  return (
    <UserContext.Provider value={supabaseUserInfo}>
      <>
        {supabaseUserInfo.session && <ProSideBar />}
        <main className="content">
          <TopBar />
          <Outlet />
        </main>
      </>
    </UserContext.Provider>
  );
}

function App() {
  const [theme, colorMode] = useMode();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="app">
          <RouterProvider router={router} />
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
