import { useEffect, useState } from "react";
import { supaClient } from "../hooks/supa-client.ts";
import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import useDropdown from "../hooks/use-dropdown.ts";

interface AddPatientDropdownProps {
  adminId: undefined | string;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setListOfPatients: React.Dispatch<React.SetStateAction<any[]>>;
  listOfPatients: any[];
}

const AddPatientDropDown: React.FC<AddPatientDropdownProps> = ({
  adminId,
  setIsOpen,
  setListOfPatients,
  listOfPatients,
}) => {
  const [clients, setClients] = useState<any[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<string[]>([]);
  const [searchedEmail, setSearchedEmail] = useState("");

  const dropdownRef = useDropdown(setIsOpen);

  useEffect(() => {
    const fetchAllClients = async () => {
      const { data, error } = await supaClient
        .from("user_profiles")
        .select("*")
        .limit(50);

      if (error) {
        console.error("Error fetching emails:", error.message);
      } else {
        const extractedClients = data.filter((client: any) => {
          if (client.permissions == "client" && client.admin_id == null) {
            return true;
          } else {
            return false;
          }
        });

        setClients(extractedClients);
        setFilteredEmails(extractedClients.map((client) => client.email));
      }
    };

    fetchAllClients();
  }, []);

  function closeDropdown() {
    setIsOpen(false);
  }

  function searchEmail(email: string) {
    setSearchedEmail(email);
    setFilteredEmails(
      clients.map((client) => {
        if (client.email.includes(email)) {
          return client.email;
        }
      }),
    );
  }

  function selectEmail(email: string) {
    setSearchedEmail(email);
  }

  async function linkClientToAdmin(clientToAdd: any) {
    try {
      const requestBody = {
        admin_id: adminId,
        client_id: clientToAdd,
      };

      const response = await fetch(
        "http://localhost:3001/api/wellness_network",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
      );

      console.log("Response: ", response);

      if (response.ok) {
        const responceData = await response.json();
        console.log("Response Data:", responceData);
        console.log("Relationship add to Supabase");
        return true;
      } else {
        console.error("Failed to add relationship to Supabase", response);
        return false;
      }
    } catch (error) {
      console.error("Error adding relationship to Supabase:", error);
      return false;
    }
  }

  const addPatient = async () => {
    const clientToAdd = clients.find((client) =>
      client.email == searchedEmail ? true : false,
    );

    const isPatientOnList = listOfPatients?.some((patient) => {
      return patient.email === searchedEmail;
    });

    if (clientToAdd && !isPatientOnList) {
      const isLinked = await linkClientToAdmin(clientToAdd.user_id);

      if (isLinked) {
        if (listOfPatients != null) {
          setListOfPatients([...listOfPatients, clientToAdd]);
        } else {
          setListOfPatients([clientToAdd]);
        }
      }
    }

    closeDropdown();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute z-10 min-w-64 rounded-lg border-gray-500 border-2 bg-white top-12 grid grid-cols-2 gap-4 p-2"
    >
      <TextField
        onChange={({ target }) => {
          searchEmail(target.value);
        }}
        value={searchedEmail}
        className="col-span-2 "
        variant="outlined"
        size="small"
        focused
        placeholder="Search email"
        InputProps={{
          startAdornment: (
            <InputAdornment className="text-black" position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          classes: {
            input: "placeholder:text-black text-black",
          },
        }}
      />
      <ul className="col-span-2 max-h-20 rounded-md overflow-y-auto border-2 ">
        {filteredEmails.map((email: string) => (
          <li
            key={email}
            onClick={() => selectEmail(email)}
            className="text-black rounded-md p-1 cursor-pointer hover:bg-gray-300"
          >
            {email}
          </li>
        ))}
      </ul>
      <button onClick={addPatient} className="bg-blue-600 rounded-md p-2">
        Add
      </button>
      <button onClick={closeDropdown} className="bg-blue-600 rounded-md p-2">
        Close
      </button>
    </div>
  );
};

export default AddPatientDropDown;
