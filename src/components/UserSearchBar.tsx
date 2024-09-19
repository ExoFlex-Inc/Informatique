import { TextField, InputAdornment, Autocomplete } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAdminProfile } from "../hooks/use-admin.ts";
interface UserSearchBarProps {
  sx?: object;
  setSelectedUser?: React.Dispatch<React.SetStateAction<any[]>>;
  setListOfUsers?: React.Dispatch<React.SetStateAction<any[]>>;
}

const UserSearchBar: React.FC<UserSearchBarProps> = ({
  sx,
  setSelectedUser,
  setListOfUsers,
}) => {
  const [searchElement, setSearchElement] = useState("");
  const [listOfUsersMapped, setListOfUsersMapped] = useState<{ label: any }[]>(
    [],
  );
  const { pathname } = useLocation();
  const { admins } = useAdminProfile();
  const [users, setUsers] = useState<any[]>([]);

  async function fetchUsers() {
    if (pathname !== "/professional_network") {
      try {
        const responseGetUsers = await fetch(
          `http://localhost:3001/api/wellness_network`,
          {
            method: "GET",
          },
        );

        if (responseGetUsers.ok) {
          console.log("List retrieved successfully.");
          const listData = await responseGetUsers.json();
          return { loaded: true, listData: listData };
        } else {
          console.error("Failed to retrieve list.");
          window.alert("Failed to retrieve list.");
          return { loaded: false, listData: null };
        }
      } catch (error) {
        console.error("An error occurred:", error);
        window.alert("An error occurred: " + error);
        return { loaded: false, listData: null };
      }
    }
  }

  async function fetchListData() {
    const data = await fetchUsers();
    if (data && data.loaded && data.listData) {
      setListOfUsers?.(data.listData);
      setUsers(data.listData);
    }
  }
  useEffect(() => {
    fetchListData();
  }, []);

  useEffect(() => {
    if (admins && pathname === "/professional_network") {
      setListOfUsers?.(admins);
      setListOfUsersMapped(
        admins.map((admin: any) => {
          return {
            label: admin.email,
          };
        }),
      );
    }
  }, [admins]);

  useEffect(() => {
    if (users) {
      setListOfUsersMapped(
        users.map((user) => {
          return {
            label: user.email,
          };
        }),
      );
    }
  }, [users]);

  useEffect(() => {
    let newList;
    if (pathname === "/professional_network" && admins) {
      searchElement !== undefined
        ? (newList = admins.filter((admin: any) =>
            admin.email.includes(searchElement) ? true : false,
          ))
        : (newList = admins);
      setListOfUsersMapped(
        newList.map((el: any) => {
          return {
            label: el.email,
          };
        }),
      );
    } else {
      searchElement !== undefined
        ? (newList = users.filter((user: any) =>
            user.email.includes(searchElement) ? true : false,
          ))
        : (newList = users);
      setListOfUsersMapped(
        newList.map((el: any) => {
          return {
            label: el.email,
          };
        }),
      );
    }
    setListOfUsers?.(newList ? newList : []);
  }, [searchElement]);

  function onInputChange(target: any) {
    if (target.value) {
      setSearchElement(target.value);
    } else {
      setSearchElement(target.innerText);
    }
    const user = users.filter((user) => {
      if (user.email === target.textContent) {
        return true;
      } else {
        return false;
      }
    });
    setSelectedUser?.(user);
  }

  return (
    <div className="ml-4 mb-2">
      <Autocomplete
        disablePortal
        id="combo-box"
        options={listOfUsersMapped.slice(0, 10)}
        onInputChange={({ target }) => {
          onInputChange(target);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            size="small"
            sx={sx}
            placeholder="Search email"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        )}
      />
    </div>
  );
};

export default UserSearchBar;
