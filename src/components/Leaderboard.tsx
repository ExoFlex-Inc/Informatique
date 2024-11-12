import { useState, useEffect, useRef } from "react";
import {
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  ButtonGroup,
  Box,
  Grid,
} from "@mui/material";

interface User {
  user_id: any;
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  stats: {
    current_streak: number;
    longest_streak: number;
  };
}

interface LeaderboardProps {
  users: User[];
  currentUser: User;
}

export default function Leaderboard({ users, currentUser }: LeaderboardProps) {
  const [sortBy, setSortBy] = useState<"current_streak" | "longest_streak">(
    "current_streak",
  );
  const [isCurrentUserPinned, setIsCurrentUserPinned] = useState(true);
  const listRef = useRef<HTMLUListElement>(null);

  // Sort users based on selected streak type
  const sortedUsers = [...users].sort(
    (a, b) => b.stats[sortBy] - a.stats[sortBy],
  );

  // Find current user rank within the sorted list
  const currentUserRank = sortedUsers.findIndex(
    (user) => user.user_id === currentUser.user_id,
  );

  useEffect(() => {
    const handleScroll = () => {
      if (listRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = listRef.current;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
        setIsCurrentUserPinned(!isAtBottom);
      }
    };

    const listNode = listRef.current;
    if (listNode) {
      listNode.addEventListener("scroll", handleScroll);
      return () => listNode.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

  return (
    <Grid item xs={12} md={8}>
      <Paper
        elevation={3}
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          height: 450,
          backgroundColor: "white",
          color: "black",
          borderRadius: 2,
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          align="center"
          sx={{ color: "#2196f3", fontWeight: "bold", mb: 3 }}
        >
          LEADERBOARD
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: 3,
          }}
        >
          <ButtonGroup variant="contained" sx={{ "& > *": { mx: 1 } }}>
            <Button
              onClick={() => setSortBy("current_streak")}
              sx={{
                backgroundColor:
                  sortBy === "current_streak" ? "#2196f3" : "#e0e0e0",
                color: sortBy === "current_streak" ? "white" : "black",
                "&:hover": {
                  backgroundColor:
                    sortBy === "current_streak" ? "#1976d2" : "#d5d5d5",
                },
              }}
            >
              CURRENT STREAK
            </Button>
            <Button
              onClick={() => setSortBy("longest_streak")}
              sx={{
                backgroundColor:
                  sortBy === "longest_streak" ? "#2196f3" : "#e0e0e0",
                color: sortBy === "longest_streak" ? "white" : "black",
                "&:hover": {
                  backgroundColor:
                    sortBy === "longest_streak" ? "#1976d2" : "#d5d5d5",
                },
              }}
            >
              LONGEST STREAK
            </Button>
          </ButtonGroup>
        </Box>
        <List
          ref={listRef}
          sx={{
            width: "100%",
            bgcolor: "transparent",
            overflowY: "auto",
            flexGrow: 1,
          }}
        >
          {sortedUsers.map((user, index) => (
            <ListItem
              key={user.user_id}
              sx={{
                py: 1.5,
                borderBottom: "1px solid #e0e0e0",
                "&:last-child": { borderBottom: "none" },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "30px",
                  backgroundColor:
                    index < 3 ? rankColors[index] : "transparent",
                  borderRadius: 1,
                  mr: 2,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ fontWeight: "bold", color: "black" }}
                >
                  {index + 1}.
                </Typography>
              </Box>
              <ListItemAvatar>
                <Avatar
                  alt={user.first_name}
                  src={
                    user.avatar_url
                      ? user.avatar_url
                      : "/assets/user.png"
                  }
                />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography
                    component="span"
                    variant="body1"
                    sx={{ fontWeight: "bold", color: "black" }}
                  >
                    {user.first_name} {user.last_name}
                  </Typography>
                }
              />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  minWidth: "80px",
                }}
              >
                <Typography
                  component="span"
                  variant="h2"
                  sx={{ color: "#666" }}
                >
                  {user.stats[sortBy]} days
                </Typography>
              </Box>
            </ListItem>
          ))}
        </List>
        {isCurrentUserPinned && (
          <Box
            sx={{
              p: 2,
              borderTop: "1px solid #e0e0e0",
              bgcolor: "#f9f9f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography
                variant="body1"
                sx={{ fontWeight: "bold", color: "black", mr: 2 }}
              >
                {currentUserRank + 1}.
              </Typography>
              <Avatar
                alt={currentUser.first_name}
                src={
                  currentUser.avatar_url
                    ? currentUser.avatar_url
                    : "/assets/user.png"
                }
                sx={{ mr: 2 }}
              />
              <Typography
                variant="body1"
                sx={{ fontWeight: "bold", color: "black" }}
              >
                {currentUser.first_name} {currentUser.last_name}
              </Typography>
            </Box>
            <Typography component="span" variant="h2" sx={{ color: "#666" }}>
              {currentUser.stats[sortBy]} days
            </Typography>
          </Box>
        )}
      </Paper>
    </Grid>
  );
}
