import { useEffect, useRef } from "react";
import { removeRelation } from "../controllers/relationsController.ts";
import { useProfileContext } from "../context/profileContext.tsx";

interface PatientMenuDropdownProps {
  clientId: string;
  setOpenMenuIndex: React.Dispatch<React.SetStateAction<number | null>>;
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
  const { profile } = useProfileContext();

  const removeUser = async () => {
    const unlinkSuccessful = await removeRelation(clientId, profile);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
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
