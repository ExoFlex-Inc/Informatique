import { TextField, InputAdornment, Autocomplete } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import { useEffect, useState } from "react";
interface PatientSearchBarProps {
    sx?: object;
    setSelectedPatient?: React.Dispatch<React.SetStateAction<any[] | undefined>>;
    setVisibleListOfPatients?: React.Dispatch<React.SetStateAction<any[]>>;
}

export async function SearchBarInit() {

    try {
        const responseGetClients = await fetch("http://localhost:3001/get_clients_for_admin", {
        method: "GET",
        });

        if (responseGetClients.ok) {
            console.log("List retrieved successfully.");
            const listData = await responseGetClients.json();
            console.log("List data:", listData);
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

const PatientSearchBar: React.FC<PatientSearchBarProps> = ({setSelectedPatient, setVisibleListOfPatients, sx}) => {
    const [listOfPatients, setListOfPatients] = useState<any[]>([]);
    const [listOfPatientsMapped, setListOfPatientsMapped] = useState<object[]>([])

    async function fetchListData() {
        const data = await SearchBarInit();
        if (data.loaded && data.listData) {
            setListOfPatients?.(data.listData);
        }
    }

    useEffect(() => {
        fetchListData();
    }, [])

    useEffect( () => {
        setListOfPatientsMapped(
            listOfPatients.map((patient) => {
                return (
                    {
                        label: patient.email,
                    }
                )
            })
        )
    }, [listOfPatients])

    function onInputChange(target: any) {   
        const updatedList = listOfPatients.filter((patient) => {
            if(patient.email.includes(target.textContent)) {
                return true;
            }
        })
        setVisibleListOfPatients?.(updatedList);

        const patient = listOfPatients.filter((patient) => {
            if(patient.email === target.textContent) {
                return true;
            } else {
                return false;
            }
        })
        setSelectedPatient?.(patient);
    }   


    return (
        <div className="ml-4 mb-2">
            <Autocomplete
                disablePortal
                id="combo-box"
                options={listOfPatientsMapped}
                onInputChange={({target}) => {
                    onInputChange(target)
                }}
                renderInput={ (params) => 
                    <TextField
                        {...params}
                        onChange={({target}) => {
                            onInputChange(target)
                        }}
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
                            )
                        }}
                    />
                }
            />
        </div>
    )
}

export default PatientSearchBar;