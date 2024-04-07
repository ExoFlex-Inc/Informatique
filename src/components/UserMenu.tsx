import { useContext } from "react";
import { UserContext } from "../App.tsx";
import { supaClient } from "../hooks/supa-client.ts";
import { useNavigate } from "react-router-dom";

export default function UserMenu() {
  const { profile } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      supaClient.auth.signOut();
    }
  };

  return (
    <div>
      <ul className="nav-right-list">
        <li className="nav-message-board-list-item">
          <div className="flex flex-col">
            {/* <h2>Welcome {profile?.username || "client"}.</h2> */}
            <button onClick={handleLogout} className="user-menu-logout-button">
              Logout
            </button>
          </div>
        </li>
      </ul>
    </div>
  );
}
