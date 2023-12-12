import { useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../App.tsx";
import Login from "../pages/Login.tsx";
import UserMenu from "../pages/UserMenu.tsx";
import logo from "../assets/logo.png";

export default function NavBar() {
  const { session } = useContext(UserContext);

  return (
    <nav className="nav-bar">
      <Link className="nav-logo-link" to="/home">
        <img
          id="logo"
          className="nav-logo"
          src={logo}
          alt="logo"
          style={{ width: "30%", height: "auto" }}
        />
      </Link>
      <ul className="nav-right-list">
        <li className="nav-auth-item">
          {session && session.user ? <UserMenu /> : <Login />}
        </li>
      </ul>
    </nav>
  );
}
