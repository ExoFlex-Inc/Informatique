import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AddPatientDropDown from './AddPatientDropdown.tsx';
import { useState } from 'react';

interface AddPatientButtonProps {
    adminId: undefined | string;
    setListOfPatients: React.Dispatch<React.SetStateAction<any[]>>;
    listOfPatients: any[];
}

const AddPatientButton: React.FC<AddPatientButtonProps> = ({adminId, setListOfPatients, listOfPatients}) => {
    const [isOpen, setIsOpen] = useState(false);

    function toggleDropdown() {
        setIsOpen(true);
    }

    return (
        <div className='flex mr-10 justify-end relative'>
            <button className='bg-blue-600 p-2 mb-2 rounded-full delay-100 transition hover:bg-[#2bb673]'
            onClick={toggleDropdown}>
                <PersonAddIcon />
            </button>
            {isOpen && <AddPatientDropDown adminId={adminId} setListOfPatients={setListOfPatients} listOfPatients={listOfPatients} setIsOpen={setIsOpen} />}
        </div>

    )
}

export default AddPatientButton;