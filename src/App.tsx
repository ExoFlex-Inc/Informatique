import { createContext } from "react";
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  useNavigate,
} from "react-router-dom";
import { Welcome, welcomeLoader } from "./pages/Welcome.tsx";
import NavBar from "./components/NavBar.tsx";
import { SupashipUserInfo, useSession } from "./hooks/use-session.ts";
import "./App.css";
import HMI, { serialConnect } from "./pages/Hmi.tsx";
import Stretch from "./pages/Stretch.tsx";
import Activity from "./pages/Activity.tsx";
import { useEffect } from "react";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "stretch",
        element: <Stretch />,
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
    path: "hmi",
    element: <HMI />,
    loader: serialConnect,
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
      navigate("/stretch");
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
