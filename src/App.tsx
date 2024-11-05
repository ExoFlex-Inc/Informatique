import {
  Route,
  Outlet,
  Navigate,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
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
import Network from "./pages/Network.tsx";
import Profile from "./pages/Profile.tsx";
import Forbidden from "./pages/Forbidden.tsx";
import HMI from "./pages/Hmi.tsx";

import PrivateRoutes from "./components/PrivateRoutes.tsx";
import ProSideBar from "./components/Sidebar.tsx";
import TopBar from "./components/TopBar.tsx";

import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import Login from "./pages/Login.tsx";
import Loading from "./components/Loading.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import { useUser } from "./hooks/use-user.ts";
import { useEffect, useState } from "react";

// Create a query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
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
          <Route
            path="/professional_network"
            element={<ProfessionalNetwork />}
          />
        </Route>

        <Route
          element={<PrivateRoutes requiredPermissions={["dev", "admin"]} />}
        >
          <Route path="/activity" element={<Activity />} />
          <Route path="/manual" element={<Manual />} />
          <Route path="/planning" element={<Planning />} />
        </Route>

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/network" element={<Network />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/hmi" element={<HMI />} />
      </Route>
    </>,
  ),
);

function PublicRoutes() {
  return <Outlet />;
}

function AppLayout() {
  const { user, isLoading, isError, error } = useUser();
  const queryClient = useQueryClient();

  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    const fetchAvatar = async () => {
      if (user?.avatar_url) {
        setAvatarLoading(true);
        try {
          const avatarResponse = await fetch(
            `http://localhost:3001/user/avatar/${user.user_id}?path=${encodeURIComponent(
              user.avatar_url,
            )}`,
            {
              method: "GET",
              credentials: "include",
            },
          );

          if (avatarResponse.ok) {
            const avatarBlob = await avatarResponse.blob();
            const avatarBlobUrl = URL.createObjectURL(avatarBlob);

            // Update the user data with the avatar blob URL
            queryClient.setQueryData(["user"], (oldData) => ({
              ...(typeof oldData === "object" && oldData !== null
                ? oldData
                : {}),
              avatar_blob_url: avatarBlobUrl,
            }));
          } else {
            console.error("Failed to fetch avatar:", avatarResponse.statusText);
          }
        } catch (err) {
          console.error("Error fetching avatar:", err);
        } finally {
          setAvatarLoading(false);
        }
      }
    };

    fetchAvatar();
  }, [user?.avatar_url]);

  // Handle loading state
  if (isLoading || avatarLoading) {
    return (
      <div className="relative loading-container">
        <Loading />
      </div>
    );
  }

  // Handle errors
  if (isError) {
    console.error("Error fetching user in AppLayout:", error);
    queryClient.clear();
    return <Navigate to="/login" />;
  }

  // Render the app layout only when user exists and avatar is fetched
  if (user) {
    return (
      <>
        <ProSideBar permissions={user.permissions} />
        <main className="content overflow-hidden">
          <TopBar />
          <Outlet />
        </main>
      </>
    );
  }

  return (
    <div className="relative loading-container">
      <Loading />
    </div>
  );
}

function App() {
  const [theme, colorMode] = useMode();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "development") {
        navigator.serviceWorker
          .register("/dev-sw.js")
          .then((registration) => {
            console.log("Dev service worker registered", registration);
          })
          .catch((error) => {
            console.error("Service worker registration failed:", error);
          });
      } else {
        navigator.serviceWorker
          .register("/firebase-messaging-sw.js")
          .then((registration) => {
            console.log(
              "Firebase messaging service worker registered",
              registration,
            );
          })
          .catch((error) => {
            console.error("Service worker registration failed:", error);
          });
      }
    }
  }, []);

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
