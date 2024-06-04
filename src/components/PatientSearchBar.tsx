import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';

interface PatientSearchBarProps {
    listOfPatients: any[]
    setVisibleListOfPatients: React.Dispatch<React.SetStateAction<any[]>>
}

const PatientSearchBar: React.FC<PatientSearchBarProps> = ({listOfPatients, setVisibleListOfPatients}) => {
    
    function onInputChange(target: any) {

        const updatedList = listOfPatients.filter((patient) => {
            if(patient.email.includes(target.value)) {
                return true;
            }
        })
        setVisibleListOfPatients(updatedList);
    }   
    
    return (
        <div className="ml-4 mb-2">
            <TextField
                onChange={({target}) => {
                    onInputChange(target)
                }}
                variant="outlined"
                size="small"
                placeholder="Search email"
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    )
                }}
            />
        </div>
    )
}

export default PatientSearchBar;