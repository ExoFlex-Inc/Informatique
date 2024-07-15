import { createContext, useState } from "react";
import {
  Route,
  Outlet,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";
import { ColorModeContext, useMode } from "./hooks/theme.ts";
import { CssBaseline, ThemeProvider } from "@mui/material";
import "./App.css";

import Dashboard from "./pages/Dashboard.tsx";
import { Welcome, welcomeLoader } from "./pages/Welcome.tsx";
import HMI from "./pages/Hmi.tsx";
import Activity from "./pages/Activity.tsx";
import Manual from "./pages/Manual.tsx";
import TermsAndConditions from "./pages/TermsAndConditions.tsx";
import Settings from "./pages/Settings.tsx";
import Planning from "./pages/Planning.tsx";
import WellnessNetwork from "./pages/WellnessNetwork.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

import TopBar from "./pages/global/TopBar.tsx";
import ProSideBar from "./pages/global/Sidebar.tsx";

import { SupabaseUserInfo, useSession } from "./hooks/use-session.ts";
import Profile from "./pages/Profile.tsx";
import { AvatarProvider } from "./context/avatarContext.tsx";
import { UserProvider } from "./context/profileContext.tsx";
import { UserProfile } from "./hooks/use-session.ts";
import { Session } from "@supabase/supabase-js";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route path="/dashboard" element={<Dashboard />} />
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
          <ProtectedRoute component={Manual} requiredPermission={["dev"]} />
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
      <Route path="/profile" element={<Profile />}/>
    </Route>,
  ),
);

function Layout() {

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  const UserContext = createContext<SupabaseUserInfo>({
    session,
    profile,
    setSession,
    setProfile
  });

  const supabaseUserInfo = useSession();

  return (
    <UserContext.Provider value={supabaseUserInfo}>
      <>
        {supabaseUserInfo.session && supabaseUserInfo.profile && (
          <ProSideBar permissions={supabaseUserInfo.profile.permissions} />
        )}
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
          <UserProvider>
            <AvatarProvider>
              <div className="app">
                <RouterProvider router={router} />
              </div>
            </AvatarProvider>
          </UserProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
