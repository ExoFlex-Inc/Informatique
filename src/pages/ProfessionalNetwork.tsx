import { Button } from "@mui/material";
import UserSearchBar from "../components/UserSearchBar.tsx";
import UserList from "../components/UsersList.tsx";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../hooks/use-profile.ts";
import { useState, useEffect } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { useAdminProfile } from "../hooks/use-admin.ts";

const ProfessionalNetwork = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const [listOfUsers, setListOfUsers] = useState<any[]>([]);

  return (
    <div>
      <div className="flex items-center gap-4 relative">
        <UserSearchBar
          sx={{ width: 500 }}
          setListOfUsers={setListOfUsers}
          listOfUsers={listOfUsers}
        />
        {profile?.permissions == "dev" || profile?.permissions == "client" ? (
          <Button
            variant="contained"
            color="inherit"
            endIcon={<CloseIcon color="error" />}
            onClick={() => {
              navigate("/wellness_network");
            }}
          >
            Cancel action
          </Button>
        ) : (
          true
        )}
      </div>
      <UserList setListOfUsers={setListOfUsers} listOfUsers={listOfUsers} />
    </div>
  );
};

export default ProfessionalNetwork;
