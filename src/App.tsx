import {
  Route,
  Outlet,
  Navigate,
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
import Activity from "./pages/Activity.tsx";
import Manual from "./pages/Manual.tsx";
import TermsAndConditions from "./pages/TermsAndConditions.tsx";
import Settings from "./pages/Settings.tsx";
import Planning from "./pages/Planning.tsx";
import WellnessNetwork from "./pages/WellnessNetwork.tsx";
import Profile from "./pages/Profile.tsx";
import Forbidden from "./pages/Forbidden.tsx";
import HMI from "./pages/Hmi.tsx";

import PrivateRoutes from "./components/PrivateRoutes.tsx";
import ProSideBar from "./components/Sidebar.tsx";
import TopBar from "./components/TopBar.tsx";

import { useUserProfile } from "./hooks/use-profile.ts";

import { QueryClient} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import Login from "./pages/Login.tsx";
import Loading from "./components/Loading.tsx";
import { useSupabaseSession } from "./hooks/use-session.ts";
import ErrorBoundary from "./components/ErrorBoundary.tsx"; 

// Create a query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

// Set up persistence with localStorage
const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
});

// Create the router for your app
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Routes without layout */}
      <Route element={<PublicRoutes />}>
        <Route path="/login" element={<Login />} />
        <Route path="/termsAndConditions" element={<TermsAndConditions />} />
        <Route path="/forbidden" element={<Forbidden />} />
      </Route>

      {/* Routes with AppLayout */}
      <Route element={<AppLayout />}>
        <Route
          element={<PrivateRoutes requiredPermissions={["dev", "client"]} />}
        >
          <Route path="/professional_network" element={<ProfessionalNetwork />} />
        </Route>

        <Route element={<PrivateRoutes requiredPermissions={["dev", "admin"]} />}>
          <Route path="/activity" element={<Activity />} />
          <Route path="/manual" element={<Manual />} />
          <Route path="/planning" element={<Planning />} />
        </Route>

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/wellness_network" element={<WellnessNetwork />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/hmi" element={<HMI />} />
      </Route>
    </>
  )
);

function PublicRoutes() {
  const {
    profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
  } = useUserProfile();

  const isLoading = isProfileLoading 
  const isError = isProfileError
  const error = profileError

  // Handle loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <Loading />
      </div>
    );
  }

  // Handle error state
  if (isError) {
    console.error('Error fetching profile or session:', error);
    return <Outlet />;
  }

  // If the user is authenticated, redirect to the dashboard
  if (profile) {
    return <Navigate to="/dashboard" />;
  }

  // If the user is not authenticated, render the public route components
  return <Outlet />;
}

function AppLayout() {
  const {
    profile,
    isLoading: isProfileLoading,
    isFetching: isProfileFetching,
    isError: isProfileError,
    isStale: isProfileStale,
    status: profileStatus,
  } = useUserProfile();

  const {
    session,
    isLoading: isSessionLoading,
    isFetching: isSessionFetching,
    isError: isSessionError,
  } = useSupabaseSession();

  // Determine the overall loading and error states
  const isLoading = isProfileLoading || isSessionLoading;
  const isFetching = isProfileFetching || isSessionFetching;
  const isError = isProfileError || isSessionError;

    if (isError) {
    queryClient.clear();
    return <Navigate to="/login" />;
  }

  if (isLoading || isFetching || profileStatus === "pending") {
    return (
      <div className="loading-container">
        <Loading />
      </div>
    );
  }

  if (isProfileStale) {
    console.log("Profile data is stale.");
  }

  if (profileStatus === "success") {
    if (profile && session) {
      return (
        <>
          <ProSideBar permissions={profile.permissions} />
          <main className="content overflow-hidden">
            <TopBar />
            <Outlet />
          </main>
        </>
      );
    } else {
      return <Navigate to="/login" />;
    }
  }

  // Handle any other statuses if necessary
  return null;
}

function App() {
  const [theme, colorMode] = useMode();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: localStoragePersister }}
        >
          <ErrorBoundary>
            <div className="app">
              <RouterProvider router={router} />
            </div>
          </ErrorBoundary>
          <ReactQueryDevtools initialIsOpen={false} />
        </PersistQueryClientProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;