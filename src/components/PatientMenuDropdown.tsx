import { useEffect, useRef } from "react";
import { useProfileContext } from "../context/profileContext.tsx";
import { supaClient } from "../hooks/supa-client.ts";

interface PatientMenuDropdownProps {
  clientId: string;
  setOpenMenuIndex: React.Dispatch<React.SetStateAction<Number | null>>;
  visibleListOfPatients: any[];
  setListOfPatients: React.Dispatch<React.SetStateAction<any[]>>;
  index: number;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

const PatientMenuDropdown: React.FC<PatientMenuDropdownProps> = ({
  clientId,
  setOpenMenuIndex,
  visibleListOfPatients,
  setListOfPatients,
  index,
  buttonRef,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {profile} = useProfileContext();

  async function unlinkClientToAdmin(clientId: string) {
    try {

      const {error} = await supaClient
        .from('admin_client')
        .delete()
        .eq("admin_id", profile?.user_id)
        .eq("client_id", clientId)


      if (!error) {
        console.log("Relationship remove from Supabase");
        return true;
      } else {
        console.error("Failed to remove relationship from Supabase", error);
        return false;
      }
    } catch (error) {
      console.error("Error removing relationship from Supabase:", error);
      return false;
    }
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
      if (dropdownRef.current &&
         !dropdownRef.current.contains(event.target as Node) &&
         buttonRef.current && 
         !buttonRef.current.contains(event.target as Node)
      ) {
        setOpenMenuIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef, buttonRef, setOpenMenuIndex]);

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
