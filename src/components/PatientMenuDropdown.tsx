import { useEffect, useRef } from "react";

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
    try {
      const requestBody = {
        admin_id: null,
        client_id: clientId,
      };

      const response = await fetch(
        "http://localhost:3001/assign_admin_to_client",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (response.ok) {
        const responseData = await response.json();
        console.log("Response Data:", responseData);
        console.log("Relationship remove from Supabase");
        return true;
      } else {
        console.error("Failed to remove relationship from Supabase", response);
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
