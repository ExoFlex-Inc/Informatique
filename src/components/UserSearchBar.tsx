import React from "react";
import { TextField, InputAdornment, Autocomplete } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

interface User {
  email: string;
  // Add other properties as needed
}

interface UserSearchBarProps {
  sx?: object;
  users: User[];
  setSearchQuery?: React.Dispatch<React.SetStateAction<User[]>>;
}

const UserSearchBar: React.FC<UserSearchBarProps> = ({
  sx,
  users,
  setSearchQuery,
}) => {
  return (
    <div className="ml-4 mb-2">
      <Autocomplete
        disablePortal
        id="combo-box"
        options={users.map((user) => user.email)}
        onChange={(event, value) => {
          const selectedUser = users.find((user) => user.email === value);
          setSearchQuery?.(selectedUser ? [selectedUser] : []);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            size="small"
            sx={sx}
            label="Search email"
            onChange={(event) => {
              const inputValue = event.target.value.toLowerCase();
              const filteredUsers = users.filter((user) =>
                user.email.toLowerCase().includes(inputValue),
              );
              setSearchQuery?.(filteredUsers); // Update with filtered users
            }}
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
