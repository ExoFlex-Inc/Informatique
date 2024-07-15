import { useEffect, useRef } from "react";
import { supaClient } from "../hooks/supa-client.ts";
interface PatientMenuDropdownProps {
  clientId: string;
  setOpenMenuIndex: React.Dispatch<React.SetStateAction<Number | null>>;
  visibleListOfPatients: any[];
  setListOfPatients: React.Dispatch<React.SetStateAction<any[]>>;
  index: number;
}

const PatientMenuDropdown: React.FC<PatientMenuDropdownProps> = ({
  clientId,
  setOpenMenuIndex,
  visibleListOfPatients,
  setListOfPatients,
  index,
}) => {
  const dropdownRef = useRef(null);

  async function unlinkClientToAdmin(clientId: string) {

    const {error: updateError} = await supaClient.from("user_profiles")
    .update({admin_id: null})
    .eq("user_id", clientId);

    if (updateError) {
      console.error("Error adding relationship to Supabase:", updateError);
      return false;
    }

    return true;
  }

  const removeUser = async () => {
    const unlinkSuccessful = await unlinkClientToAdmin(clientId);

    if (unlinkSuccessful) {
      const newList = [
        ...visibleListOfPatients.slice(0, index),
        ...visibleListOfPatients.slice(index + 1),
      ];
      setListOfPatients(newList);
      setOpenMenuIndex(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenMenuIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div
      ref={dropdownRef}
      className="flex flex-col right-0 top-8 z-10 absolute bg-white border cursor-pointer border-gray-600 rounded-md"
    >
      <ul className="divide-y divide-gray-400">
        <li className="text-black rounded-t-md px-2 hover:bg-gray-200">
          See Profile
        </li>
        <li className="text-black px-2 hover:bg-gray-200">See Progression</li>
        <li
          onClick={removeUser}
          className="text-red-500 rounded-b-md px-2 hover:bg-gray-200"
        >
          Remove Patient
        </li>
      </ul>
    </div>
  );
};

export default PatientMenuDropdown;
