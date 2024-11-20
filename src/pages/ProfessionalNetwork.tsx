import { Button } from "@mui/material";
import UserSearchBar from "../components/UserSearchBar.tsx";
import UserList from "../components/UsersList.tsx";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { useAdminProfile } from "../hooks/use-admin.ts";
import Loading from "../components/Loading.tsx";
import { useRelations } from "../hooks/use-relations.ts";
import { useFetchPendingRelations } from "../hooks/use-relations.ts";
import { useUser } from "../hooks/use-user.ts";

const ProfessionalNetwork = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { admins, isLoading: adminLoading } = useAdminProfile();
  const { relations, isLoading: relationsLoading } = useRelations();
  const { notifications, isLoading: notificationsLoading } =
    useFetchPendingRelations();

  const isLoading = adminLoading || relationsLoading || notificationsLoading;
  const [filteredUsers, setFilteredUsers] = useState(admins);
  const [filteredSearchBarUsers, setFilteredSearchBarUsers] = useState(admins);

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
    setFilteredSearchBarUsers(filteredAdmin)
  }, [admins, notifications, relations]);

  return (
    <div className="custom-height relative flex flex-col m-6">
      <div className="flex items-center gap-4 relative">
        <UserSearchBar
          sx={{ width: 500 }}
          setSearchQuery={setFilteredUsers}
          users={filteredSearchBarUsers}
        />

        {user?.permissions == "dev" || user?.permissions == "client" ? (
          <Button
            sx={{ marginBottom: "8px" }}
            variant="contained"
            color="inherit"
            endIcon={<CloseIcon color="error" />}
            onClick={() => {
              navigate("/network");
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
      {isLoading && <Loading />}
    </div>
  );
};

export default ProfessionalNetwork;
