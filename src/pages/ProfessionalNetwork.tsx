import { Button } from "@mui/material";
import UserSearchBar from "../components/UserSearchBar.tsx";
import UserList from "../components/UsersList.tsx";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../hooks/use-profile.ts";
import { useState, useEffect } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { useAdminProfile } from "../hooks/use-admin.ts";
import Loading from "../components/Loading.tsx";
import { useRelations } from "../hooks/use-relations.ts";
import { useFetchPendingRelations } from "../hooks/use-relations.ts";

const ProfessionalNetwork = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const { admins, isLoading: adminLoading } = useAdminProfile();
  const { relations, isLoading: relationsLoading } = useRelations();
  const { notifications, isLoading: notificationsLoading } =
    useFetchPendingRelations();

  const [filteredUsers, setFilteredUsers] = useState(admins);

  useEffect(() => {
    let filteredAdmin = admins;

    if (relations && filteredAdmin) {
      relations.forEach((relation: { user_id: string }) => {
        filteredAdmin = filteredAdmin.filter((admin: { user_id: string }) =>
          relation.user_id == admin.user_id ? false : true,
        );
      });
    }
    if (notifications && filteredAdmin) {
      notifications.forEach((notification: { receiver_id: string }) => {
        filteredAdmin = filteredAdmin.filter((admin: { user_id: string }) =>
          notification.receiver_id == admin.user_id ? false : true,
        );
      });
    }
    setFilteredUsers(filteredAdmin);
  }, [notifications, relations]);

  if (adminLoading || relationsLoading || notificationsLoading) {
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
      <UserList
        listOfUsers={filteredUsers}
        setFilteredUsers={setFilteredUsers}
      />
    </div>
  );
};

export default ProfessionalNetwork;
