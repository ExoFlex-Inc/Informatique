import UserList from "../components/UsersList.tsx";
import UserSearchBar from "../components/UserSearchBar.tsx";
import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useRelations } from "../hooks/use-relations.ts";
import Loading from "../components/Loading.tsx";
import { useUser } from "../hooks/use-user.ts";

export default function Network() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { relations, isLoading } = useRelations();

  const [filteredRelations, setFilteredRelations] = useState([]);

  useEffect(() => {
    setFilteredRelations(relations);
  }, [relations]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loading />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 relative">
        <UserSearchBar
          sx={{ width: 500 }}
          setSearchQuery={setFilteredRelations}
          users={relations}
        />
        {(user?.permissions === "dev" || user?.permissions === "client") && (
          <Button
            variant="contained"
            color="info"
            onClick={() => navigate("/professional_network")}
          >
            Add Professional
          </Button>
        )}
      </div>

      <UserList listOfUsers={filteredRelations} />
    </div>
  );
}
