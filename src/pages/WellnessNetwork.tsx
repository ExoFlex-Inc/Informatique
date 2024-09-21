import UserList from "../components/UsersList.tsx";
import UserSearchBar from "../components/UserSearchBar.tsx";
import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { useUserProfile } from "../hooks/use-profile.ts";
import { useNavigate } from "react-router-dom";
import { useRelations } from "../hooks/use-relations.ts";
import Loading from "../components/Loading.tsx";

export default function WellnessNetwork() {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const { relations, isLoading } = useRelations();

  const [filteredRelations, setFilteredRelations] = useState([relations]);

  useEffect(() => {
    setFilteredRelations(relations);
  }, [relations]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="flex items-center gap-4 relative">
        <UserSearchBar
          sx={{ width: 500 }}
          setSearchQuery={setFilteredRelations}
          users={relations}
        />
        {(profile?.permissions === "dev" ||
          profile?.permissions === "client") && (
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
