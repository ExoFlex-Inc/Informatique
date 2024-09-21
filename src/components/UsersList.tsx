import ListIcon from "@mui/icons-material/List";
import SendIcon from "@mui/icons-material/Send";
import UserMenuDropdown from "./UserMenuDropdown.tsx";
import { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Box, IconButton } from "@mui/material";

interface UserListProps {
  listOfUsers: any[];
}

const UserList: React.FC<UserListProps> = ({ listOfUsers }) => {
  const [openMenuIndex, setOpenMenuIndex] = useState<Number | null>(null);
  const buttonRefs = useRef<HTMLButtonElement[]>([]);
  const { pathname } = useLocation();

  const addToButtonRefs = (el: HTMLButtonElement | null, index: number) => {
    if (el && !buttonRefs.current[index]) {
      buttonRefs.current[index] = el;
    }
  };

  console.log("list of users", listOfUsers);

  function toggleDropdown(index: Number) {
    setOpenMenuIndex(index === openMenuIndex ? null : index);
  }

  function sendInvitation(index: number) {
    // Ajouter nouveau code ici Olivier
  }

  return (
    <div className="grid grid-cols-4 shadow-md shadow-gray-500 pt-2 bg-gray-300 rounded-2xl mx-4">
      <label
        className={
          "font-bold border-gray-400 text-black pl-2 pb-2" +
          (listOfUsers?.length > 0 ? " border-b-2" : "")
        }
      >
        First Name
      </label>
      <label
        className={
          "font-bold border-gray-400 text-black pl-2 pb-2" +
          (listOfUsers?.length ? " border-b-2" : "")
        }
      >
        Last Name
      </label>
      <label
        className={
          "font-bold border-gray-400 text-black pl-2 pb-2" +
          (listOfUsers?.length ? " border-b-2" : "")
        }
      >
        Email
      </label>
      <label
        className={
          "font-bold border-gray-400 text-black pl-2 pb-2" +
          (listOfUsers?.length ? " border-b-2" : "")
        }
      >
        Phone Number
      </label>

      <ul className="divide-y rounded-b-2xl col-span-4 divide-gray-400 bg-white">
        {listOfUsers?.map((user, index) =>
          index < 10 ? (
            <div key={index} className="grid grid-cols-4 items-center">
              <li className="text-black p-2">{user.first_name}</li>
              <li className="text-black p-2">{user.last_name}</li>
              <li className="text-black p-2">{user.email}</li>
              <div className="relative">
                <li className="text-black flex items-center justify-between p-2">
                  <span>{user.phone_number}</span>
                  <Box>
                    {pathname == "/wellness_network" ? (
                      <IconButton
                        sx={{
                          "&:hover": {
                            bgcolor: "#D1D5DB",
                          },
                        }}
                        ref={(el) => addToButtonRefs(el, index)}
                        onClick={() => toggleDropdown(index)}
                      >
                        <ListIcon color="primary" />
                      </IconButton>
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
                </li>
                {/* {openMenuIndex === index && (
                  <UserMenuDropdown
                    buttonRef={{ current: buttonRefs.current[index] }}
                    clientId={user.user_id}
                    setListOfUsers={setListOfUsers}
                    visibleListOfUsers={listOfUsers}
                    index={index}
                    setOpenMenuIndex={setOpenMenuIndex}
                  />
                )} */}
              </div>
            </div>
          ) : (
            true
          ),
        )}
      </ul>
    </div>
  );
};

export default UserList;
