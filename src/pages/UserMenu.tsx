import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../App.tsx';
import { supaClient } from "../hooks/supa-client.ts";
import { useNavigate } from 'react-router-dom';

export default function UserMenu() {
  const { profile } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    supaClient.auth.signOut();
    navigate('/');
  };

  return (
    <div>
      <ul className="nav-right-list">
        <li className="nav-message-board-list-item">
          <Link to="/activity" className="nav-message-board-link">
            Activity
          </Link>
        </li>
        <li className="nav-message-board-list-item">
          <div className="flex flex-col">
            <h2>Welcome {profile?.username || 'dawg'}.</h2>
            <button
              onClick={handleLogout}
              className="user-menu-logout-button"
            >
              Logout
            </button>
          </div>
        </li>
      </ul>
    </div>
  );
}
