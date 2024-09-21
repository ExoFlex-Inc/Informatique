import { Button } from "@mui/material";
import UserSearchBar from "../components/UserSearchBar.tsx";
import UserList from "../components/UsersList.tsx";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../hooks/use-profile.ts";
import { useState, useEffect } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { useAdminProfile } from "../hooks/use-admin.ts";
import Loading from "../components/Loading.tsx";

const ProfessionalNetwork = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const { admins, isLoading } = useAdminProfile();

  const [filteredUsers, setFilteredUsers] = useState(admins)

  useEffect(() => {
    setFilteredUsers(admins);
  }, [admins]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="flex items-center gap-4 relative">
        <UserSearchBar
          sx={{ width: 500 }}
          setSearchQuery={setFilteredUsers}
          users={admins}
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
      <UserList listOfUsers={filteredUsers} />
    </div>
  );
};

export default ProfessionalNetwork;