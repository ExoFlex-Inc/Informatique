import { Box, Container, Grid } from "@mui/material";
import StretchStreak from "../components/StretchStreak";
import { useStats } from "../hooks/use-stats.ts";
import Loading from "../components/Loading.tsx";
import Leaderboard from "../components/Leaderboard.tsx";
import { useTopUsers, useUser } from "../hooks/use-user.ts";
import CustomScrollbar from "../components/CustomScrollbars.tsx";

export default function Dashboard() {
  const { user } = useUser();
  const { stats, isLoading: statsLoading } = useStats();
  const { users = [], isLoading: usersLoading } = useTopUsers();
  const hasPermissions =
    user.permissions === "dev" || user.permissions === "client";

  if (statsLoading || usersLoading) {
    return (
      <div className="loading-container">
        <Loading />
      </div>
    );
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        bgcolor: "background.default",
        height: "calc(100vh - 100px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CustomScrollbar>
        {hasPermissions && (
          <Container maxWidth="lg">
            <Grid container spacing={3}>
              {stats && (
                <StretchStreak
                  currentStreak={stats.current_streak}
                  longestStreak={stats.longest_streak}
                />
              )}
              <Leaderboard
                users={users}
                currentUser={users?.find((u) => u.user_id === user.user_id)}
              />
            </Grid>
          </Container>
        )}
      </CustomScrollbar>
    </Box>
  );
}
