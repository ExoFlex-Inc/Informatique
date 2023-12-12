import { createContext, useEffect } from "react";
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  useNavigate,
} from "react-router-dom";

import "./App.css";

import { Welcome, welcomeLoader } from "./pages/Welcome.tsx";
import HMI, { hmiInit } from "./pages/Hmi.tsx";
import Home from "./pages/Home.tsx";
import Activity from "./pages/Activity.tsx";
import Manual, { manualInit } from "./pages/Manual.tsx";

import NavBar from "./components/NavBar.tsx";

import { SupashipUserInfo, useSession } from "./hooks/use-session.ts";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "home",
        element: <Home />,
      },
      {
        path: "activity",
        element: <Activity />,
      },
      {
        path: "welcome",
        element: <Welcome />,
        loader: welcomeLoader,
      },
    ],
  },
  {
    path: "manual",
    element: <Manual />,
    loader: manualInit,
  },
  {
    path: "hmi",
    element: <HMI />,
    loader: hmiInit,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

export const UserContext = createContext<SupashipUserInfo>({
  session: null,
  profile: null,
});

function Layout() {
  const supashipUserInfo = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (supashipUserInfo.session) {
      navigate("/home");
    }
  }, [supashipUserInfo.session, navigate]);

  return (
    <>
      <UserContext.Provider value={supashipUserInfo}>
        <NavBar />
        <Outlet />
      </UserContext.Provider>
    </>
  );
}
