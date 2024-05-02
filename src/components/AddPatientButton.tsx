import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AddPatientDropDown from './AddPatientDropdown.tsx';
import { useState } from 'react';

const AddPatientButton = () => {
    const [isOpen, setIsOpen] = useState(false);

    function toggleDropdown() {
        setIsOpen(!isOpen);
    }

    return (
        <div className=''>
            <button className='bg-blue-600 p-2 mb-2 rounded-full delay-100 transition hover:bg-[#2bb673]'
            onClick={toggleDropdown}>
                <PersonAddIcon />
            </button>
            {isOpen && <AddPatientDropDown setIsOpen={setIsOpen} />}
        </div>

    )
}

export default AddPatientButton;