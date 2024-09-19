import UserList from "../components/UsersList.tsx";
import UserSearchBar from "../components/UserSearchBar.tsx";
import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { useUserProfile } from "../hooks/use-profile.ts";
import { useNavigate } from "react-router-dom";

export default function WellnessNetwork() {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const [listOfUsers, setListOfUsers] = useState<any[]>([]);

  return (
    <div>
      <div className="flex items-center gap-4 relative">
        <UserSearchBar sx={{ width: 500 }} setListOfUsers={setListOfUsers} />
        {profile?.permissions == "dev" || profile?.permissions == "client" ? (
          <Button
            variant="contained"
            color="info"
            onClick={() => {
              navigate("/professional_network");
            }}
          >
            Add Professional
          </Button>
        ) : (
          true
        )}
      </div>
      <UserList setListOfUsers={setListOfUsers} listOfUsers={listOfUsers} />
    </div>
  );
}
