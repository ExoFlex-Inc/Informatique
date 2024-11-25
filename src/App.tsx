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
import { useEffect,useRef, useState } from "react";
import UpdateWidget from "./components/UpdateWidget";

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

// const checkForUpdates = async () => {
//   // Mock API call for checking updates
//   const response = await fetch("http://localhost:3001/docker/check-updates");
//   const data = await response.json();
//   return data.updateAvailable;
// };

// const performUpdate = async () => {
//   // Mock API call to perform update
//   const response = await fetch("http://localhost:3001/docker/update", { method: "POST" });
//   if (!response.ok) {
//     throw new Error("Update failed");
//   }
// };

import { createContext, useContext } from 'react';

const WebSocketContext = createContext<{
  isReconnecting: boolean;
  lastReconnectAttempt: number;
}>({
  isReconnecting: false,
  lastReconnectAttempt: 0,
});

function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastReconnectAttempt, setLastReconnectAttempt] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const maxReconnectAttempts = 50;

  useEffect(() => {
    const connectWebSocket = () => {
      if (reconnectAttemptRef.current >= maxReconnectAttempts) {
        console.error('Failed to connect to server after maximum attempts');
        return;
      }

      setIsReconnecting(true);
      const ws = new WebSocket('ws://localhost:8080');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsReconnecting(false);
        reconnectAttemptRef.current = 0;
        setLastReconnectAttempt(0);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'SERVER_STATUS' && data.status === 'READY') {
            console.log('Refresh page to load new version');
            // Clear react-query cache before reload to ensure fresh data
            queryClient.clear();
            // Add a small delay to ensure cache is cleared
            setTimeout(() => {
              window.location.href=window.location.href;
            }, 3000);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsReconnecting(true);
        reconnectAttemptRef.current++;
        setLastReconnectAttempt(reconnectAttemptRef.current);
        
        const currentWs = wsRef.current;
        if (currentWs) {
          currentWs.close();
          wsRef.current = null;
        }
        
        setTimeout(connectWebSocket, 2000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsReconnecting(true);
      };
    };

    connectWebSocket();

    return () => {
      const ws = wsRef.current;
      if (ws) {
        ws.close();
        wsRef.current = null;
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isReconnecting, lastReconnectAttempt }}>
      {children}
    </WebSocketContext.Provider>
  );
}

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

  // Handle loading state
  if (isLoading) {
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
        {/* <UpdateWidget
            onCheckUpdates={checkForUpdates}
            onUpdate={performUpdate}
        /> */}
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
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: localStoragePersister }}
        >
          <WebSocketProvider>
            <ErrorBoundary>
              <div className="app">
                <RouterProvider router={router} />
              </div>
            </ErrorBoundary>
            <ReactQueryDevtools initialIsOpen={false} />
          </WebSocketProvider>
        </PersistQueryClientProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
