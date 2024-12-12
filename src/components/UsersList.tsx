import {
  Box,
  IconButton,
  Table,
  TableContainer,
  TableCell,
  TableRow,
  TableHead,
  TableBody,
  Typography,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "../hooks/use-user";
import { Send as SendIcon } from "@mui/icons-material";

const UserList: React.FC<UserListProps> = ({
  listOfUsers,
  setFilteredUsers,
}) => {
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const { pathname } = useLocation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "warning" | "info"
  >("success");

  const addToButtonRefs = (el: HTMLButtonElement | null, index: number) => {
    if (el) {
      buttonRefs.current[index] = el;
    }
  };

  const toggleDropdown = (index: number) => {
    setOpenMenuIndex(index === openMenuIndex ? null : index);
  };

  const sendInvitation = async (index: number) => {
    try {
      const response = await fetch("http://localhost:3001/notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          sender_id: user?.user_id,
          receiver_id: listOfUsers?.[index]?.user_id,
          user_name: `${user?.first_name} ${user?.last_name}`,
          image_url: user?.avatar_url,
          type: "relation",
          message: "sent a relation request",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send invitation: ${response.statusText}`);
      }

      const newList = listOfUsers.filter((_, i) => i !== index);
      setFilteredUsers(newList);
      queryClient.invalidateQueries({ queryKey: ["pendingRelations"] });

      setSnackbarMessage("Invitation sent successfully.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error sending invitation:", error);

      setSnackbarMessage("Failed to send invitation.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <>
      <TableContainer component={Paper} sx={{ borderRadius: "12px" }}>
        <Table>
          <TableHead className="bg-gray-100">
            <TableRow>
              <TableCell sx={{ borderColor: "lightgrey" }}>
                <Typography sx={{ display: "flex", color: "gray" }}>
                  First Name
                </Typography>
              </TableCell>
              <TableCell sx={{ borderColor: "lightgrey" }}>
                <Typography sx={{ display: "flex", color: "gray" }}>
                  Last Name
                </Typography>
              </TableCell>
              <TableCell sx={{ borderColor: "lightgrey" }}>
                <Typography sx={{ display: "flex", color: "gray" }}>
                  Email
                </Typography>
              </TableCell>
              <TableCell sx={{ borderColor: "lightgrey" }}>
                <Typography sx={{ display: "flex", color: "gray" }}>
                  Phone Number
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {listOfUsers?.slice(0, 4).map((user, index) => (
              <TableRow sx={{ backgroundColor: "white" }} key={user.user_id}>
                <TableCell sx={{ borderColor: "lightgrey" }}>
                  <Typography sx={{ display: "flex", color: "black" }}>
                    {user.first_name}
                  </Typography>
                </TableCell>
                <TableCell sx={{ borderColor: "lightgrey" }}>
                  <Typography sx={{ display: "flex", color: "black" }}>
                    {user.last_name}
                  </Typography>
                </TableCell>
                <TableCell sx={{ borderColor: "lightgrey" }}>
                  <Typography sx={{ display: "flex", color: "black" }}>
                    {user.email}
                  </Typography>
                </TableCell>
                <TableCell sx={{ borderColor: "lightgrey" }}>
                  <Box
                    sx={{
                      justifyContent: "space-between",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Typography sx={{ display: "flex", color: "black" }}>
                      {user.phone_number}
                    </Typography>
                    {pathname === "/network" ? (
                      <></>
                    ) : (
                      <IconButton
                        onClick={() => sendInvitation(index)}
                        sx={{
                          "&:hover": {
                            bgcolor: "#D1D5DB",
                          },
                        }}
                      >
                        <SendIcon color="success" />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default UserList;