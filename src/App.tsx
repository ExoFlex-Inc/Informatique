import { useEffect } from "react";
import {
  Route,
  Outlet,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  useNavigate,
} from "react-router-dom";
import { ColorModeContext, useMode } from "./hooks/theme.ts";
import { CssBaseline, ThemeProvider } from "@mui/material";
import "./App.css";

import Dashboard from "./pages/Dashboard.tsx";
import ProfessionalNetwork from "./pages/ProfessionalNetwork.tsx";
import HMI from "./pages/Hmi.tsx";
import Activity from "./pages/Activity.tsx";
// import Recovery from "./pages/Recovery.tsx";
import Manual from "./pages/Manual.tsx";
import TermsAndConditions from "./pages/TermsAndConditions.tsx";
import Settings from "./pages/Settings.tsx";
import Planning from "./pages/Planning.tsx";
import WellnessNetwork from "./pages/WellnessNetwork.tsx";
import Profile from "./pages/Profile.tsx";
import Forbidden from "./pages/Forbidden.tsx";

import PrivateRoutes from "./components/PrivateRoutes.tsx";
import Loading from "./components/Loading.tsx";
import ProSideBar from "./components/Sidebar.tsx";
import TopBar from "./components/TopBar.tsx";

import { useSupabaseSession } from "./hooks/use-session.ts";
import { useUserProfile } from "./hooks/use-profile.ts";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<AppLayout />}>
      {/* <Route path="/recovery" element={<Recovery />} /> */}

      <Route
        element={<PrivateRoutes requiredPermissions={["dev", "client"]} />}
      >
        <Route path="/professional_network" element={<ProfessionalNetwork />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      <Route element={<PrivateRoutes requiredPermissions={["dev", "admin"]} />}>
        <Route path="/activity" element={<Activity />} />
        <Route path="/manual" element={<Manual />} />
        <Route path="/planning" element={<Planning />} />
      </Route>

      <Route path="/wellness_network" element={<WellnessNetwork />} />
      <Route path="/termsAndConditions" element={<TermsAndConditions />} />
      <Route path="/hmi" element={<HMI />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/forbidden" element={<Forbidden />} />
    </Route>,
  ),
);

function AppLayout() {
  const navigate = useNavigate();
  const { session, isLoading: isSessionLoading } = useSupabaseSession();
  const { profile, isLoading: isProfileLoading } = useUserProfile();

  useEffect(() => {
    if (!isSessionLoading && !isProfileLoading && (!session || !profile)) {
      navigate("/");
    }
  }, [isSessionLoading, isProfileLoading, session, profile, navigate]);

  if (isSessionLoading || isProfileLoading) {
    return <Loading />;
  }

  return (
    <>
      {session && profile && <ProSideBar permissions={profile.permissions} />}
      <main className="content overflow-hidden">
        <TopBar />
        <Outlet />
      </main>
    </>
  );
}

function App() {
  const [theme, colorMode] = useMode();

  const queryClient = new QueryClient();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <div className="app">
            <RouterProvider router={router} />
          </div>
        </QueryClientProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
