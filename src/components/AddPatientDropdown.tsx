import { useRef, useEffect, useState } from "react";
import { supaClient } from "../hooks/supa-client.ts";
import { TextField, InputAdornment } from "@mui/material"
import SearchIcon from '@mui/icons-material/Search';

interface AddPatientDropdownProps {
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setListOfPatients: React.Dispatch<React.SetStateAction<any[]>>;
    listOfPatients: any[];
    setListOfPatientsIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  }

const AddPatientDropDown: React.FC<AddPatientDropdownProps> = ({ setIsOpen, setListOfPatientsIsDirty, setListOfPatients, listOfPatients }) => {
    const [emails, setEmails] = useState<string[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [filteredEmails, setFilteredEmails] = useState<string[]>([]);
    const [searchedEmail, setSearchedEmail] = useState("");
    const dropdownRef = useRef(null);

    useEffect(() => {
        const fetchAllUsers = async () => {
            const { data, error } = await supaClient
                .from('user_profiles')
                .select("*")
        
            if (error) {
                console.error('Error fetching emails:', error.message);
            } else {
                const extractedEmails = data.map((user: any) => user.email);
                setUsers(data);
                setEmails(extractedEmails);
                setFilteredEmails(extractedEmails);
            }
        };
        
        fetchAllUsers();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        };
    }, [dropdownRef]);

    function closeDropdown() {
        setIsOpen(false);
    }

    function searchEmail(email: string){
        setSearchedEmail(email);
        setFilteredEmails(emails.filter((element) => element.includes(email)));
    }

    function selectEmail(email: string) {
        setSearchedEmail(email);
    }
    
    const addPatient = async () =>  {
        const userToAdd = users.find((user) => user.email.includes(searchedEmail));

        const isPatientOnList = listOfPatients?.some((patient) => {
            return patient.email === searchedEmail;
        })

        console.log(listOfPatients)

        if(userToAdd && !isPatientOnList) {
            setListOfPatientsIsDirty(true);
            if (listOfPatients != null){
                setListOfPatients([...listOfPatients, userToAdd]);
            } else {
                setListOfPatients([userToAdd]);

            }
        }
        closeDropdown();        
    }

    return (
        <div ref={dropdownRef} className="absolute z-10 min-w-64 rounded-lg border-blue-600 border-4 bg-white top-12 grid grid-cols-2 gap-4 p-2">
            {/* <div className=""> */}
                <TextField
                    onChange={({target}) => {
                        searchEmail(target.value)
                    }}
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
                            input: "placeholder:text-black text-black"
                        }
                    }}
                />
            {/* </div> */}
            <ul className="col-span-2 max-h-20 rounded-md overflow-y-auto border-2 ">
                { filteredEmails.map((email: string) => 
                    <li key={email} onClick={() => selectEmail(email)} className="text-black rounded-md p-1 cursor-pointer hover:bg-gray-300">{email}</li>
                )}
            </ul>
            <button onClick={addPatient} className="bg-blue-600 rounded-md p-2" >Add</button>
            <button onClick={closeDropdown} className="bg-blue-600 rounded-md p-2" >Close</button>
        </div>
    )
}

export default AddPatientDropDown;