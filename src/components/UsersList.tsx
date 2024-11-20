import ListIcon from "@mui/icons-material/List";
import SendIcon from "@mui/icons-material/Send";
import UserMenuDropdown from "./UserMenuDropdown.tsx";
import { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Box, IconButton, Table, TableContainer, TableCell, TableRow, TableHead, TableBody, Typography, Paper } from "@mui/material";
import { useUser } from "../hooks/use-user.ts";
import { useQueryClient } from "@tanstack/react-query";

interface UserListProps {
  listOfUsers: Array<{
    user_id: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
  }>;
  setFilteredUsers: React.Dispatch<any>;
}

const UserList: React.FC<UserListProps> = ({
  listOfUsers,
  setFilteredUsers,
}) => {
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const { pathname } = useLocation();
  const { user } = useUser();
  const queryClient = useQueryClient();

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
      window.alert("Invitation sent successfully.");
    } catch (error) {
      console.error("Error sending invitation:", error);
    }
  };

  return (
    <TableContainer component={Paper} sx={{borderRadius: "12px"}}>
      <Table>
        <TableHead className="bg-gray-100">
          <TableRow>
            <TableCell sx={{borderColor: "lightgrey"}}>
              <Typography sx={{display: "flex", color: "gray"}}>
                First Name
              </Typography>
            </TableCell>
            <TableCell sx={{borderColor: "lightgrey"}}>
              <Typography sx={{display: "flex" , color: "gray"}}>
                Last Name
              </Typography>
            </TableCell>
            <TableCell sx={{borderColor: "lightgrey"}}>
              <Typography sx={{display: "flex", color: "gray"}}>
                Email
              </Typography>
            </TableCell>
            <TableCell sx={{borderColor: "lightgrey"}}>
              <Typography sx={{display: "flex", color: "gray"}}>
                Phone Number
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {listOfUsers?.slice(0, 4).map((user, index) => (
            <TableRow sx={{backgroundColor: "white"}}>
              <TableCell sx={{borderColor: "lightgrey"}}>
                <Typography sx={{display: "flex", color: "black"}}>
                  {user.first_name}
                </Typography>
              </TableCell>
              <TableCell sx={{borderColor: "lightgrey"}}>
                <Typography sx={{display: "flex", color: "black"}}>
                  {user.last_name}
                </Typography>
              </TableCell>
              <TableCell sx={{borderColor: "lightgrey"}}>
                <Typography sx={{display: "flex", color: "black"}}>
                  {user.email}
                </Typography>
              </TableCell>
              <TableCell sx={{borderColor: "lightgrey"}}>
                <Box sx={{justifyContent: "space-between", display: "flex", alignItems: "center"}}>
                  <Typography sx={{display: "flex", color: "black"}}>
                    {user.phone_number}
                  </Typography>
                  {pathname === "/network" ? (
                    <>
                    </>
                    // <IconButton
                    //   sx={{
                    //     "&:hover": {
                    //       bgcolor: "#D1D5DB",
                    //     },
                    //   }}
                    //   ref={(el) => addToButtonRefs(el, index)}
                    //   onClick={() => toggleDropdown(index)}
                    // >
                    //   <ListIcon color="primary" />
                    // </IconButton>
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
  );
};

export default UserList;
