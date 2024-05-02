
interface AddPatientDropdownProps {
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  }

const AddPatientDropDown: React.FC<AddPatientDropdownProps> = ({ setIsOpen }) => {

    function closeDropdown() {
        setIsOpen(false);
    }

    return (
        <div className="bg-white justify-end top-12 grid grid-cols-2 grid-rows-2 gap-4 p-2">
            <input className="text-center col-span-2 rounded-md ring-2 text-black border-blue-600" type="text" placeholder="email address" />
            <button className="bg-blue-600 rounded-md p-2" >Add</button>
            <button onClick={closeDropdown} className="bg-blue-600 rounded-md p-2" >Close</button>
        </div>
    )
}

export default AddPatientDropDown;