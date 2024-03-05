import { createContext, useEffect, useState } from "react";
import { Routes, Route, BrowserRouter, useNavigate } from "react-router-dom";
import { ColorModeContext, useMode } from "./hooks/theme.ts";
import { CssBaseline, ThemeProvider } from "@mui/material";
import "./App.css";

import Dashboard from "./pages/Dashboard.tsx";
import { Welcome, welcomeLoader } from "./pages/Welcome.tsx";
import HMI, { hmiInit } from "./pages/Hmi.tsx";
import Home from "./pages/Home.tsx";
import Activity from "./pages/Activity.tsx";
import Manual, { manualInit } from "./pages/Manual.tsx";

import TopBar from "./pages/global/TopBar.tsx";
import ProSideBar from "./pages/global/Sidebar.tsx";

import { SupabaseUserInfo, useSession } from "./hooks/use-session.ts";
import Settings from "./pages/Settings.tsx";
import Planning from "./pages/Planning.tsx";

export const UserContext = createContext<SupabaseUserInfo>({
  session: null,
  profile: null,
});

function Layout() {
  const supabaseUserInfo = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabaseUserInfo.session) {
      navigate("/");
    }
  }, [supabaseUserInfo.session]);

  return (
    <UserContext.Provider value={supabaseUserInfo}>
      <>
        {supabaseUserInfo.session && <ProSideBar />}
        <main className="content">
          <TopBar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/activity" element={<Activity />} />
            <Route
              path="/welcome"
              element={<Welcome />}
              loader={welcomeLoader}
            />
            <Route path="/manual" element={<Manual />} loader={manualInit} />
            <Route path="/hmi" element={<HMI />} loader={hmiInit} />
            <Route path="/planning" element={<Planning />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
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
        <BrowserRouter>
          <div className="app">
            <Layout />
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
