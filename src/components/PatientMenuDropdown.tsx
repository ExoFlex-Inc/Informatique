import { useEffect, useRef } from "react";

interface PatientMenuDropdownProps {
    setOpenMenuIndex: React.Dispatch<React.SetStateAction<Number | null>>;
    visibleListOfPatients: any[];
    setListOfPatients: React.Dispatch<React.SetStateAction<any[]>>;
    index: number;
    setListOfPatientsIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
}

const PatientMenuDropdown: React.FC<PatientMenuDropdownProps> = ({setOpenMenuIndex, setListOfPatientsIsDirty, visibleListOfPatients, setListOfPatients, index}) => {

    const dropdownRef = useRef(null);

    const removeUser = () => {
        const newList = [
            ...visibleListOfPatients.slice(0, index),
            ...visibleListOfPatients.slice(index + 1)
        ];
        setListOfPatientsIsDirty(true);
        setListOfPatients(newList);
        setOpenMenuIndex(null);
    }

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenMenuIndex(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        };
    }, [dropdownRef]);

    return (
        <div ref={dropdownRef} className="flex flex-col right-0 top-8 z-10 absolute bg-white border cursor-pointer border-gray-600 rounded-md">
            <ul className="divide-y divide-gray-400">
                <li className="text-black rounded-t-md px-2 hover:bg-gray-200">See Profile</li>
                <li className="text-black px-2 hover:bg-gray-200">See Progression</li>
                <li onClick={removeUser} className="text-red-500 rounded-b-md px-2 hover:bg-gray-200">Remove Patient</li>
            </ul>
        </div>
    )
}

export default PatientMenuDropdown;