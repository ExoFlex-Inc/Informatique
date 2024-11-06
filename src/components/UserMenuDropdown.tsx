import { useEffect, useRef } from "react";
import { removeRelation } from "../controllers/relationsController.ts";
import { useUser } from "../hooks/use-user.ts";

interface UserMenuDropdownProps {
  clientId: string;
  setOpenMenuIndex: React.Dispatch<React.SetStateAction<number | null>>;
  visibleListOfUsers: any[];
  setListOfUsers: React.Dispatch<React.SetStateAction<any[]>>;
  index: number;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

const UserMenuDropdown: React.FC<UserMenuDropdownProps> = ({
  clientId,
  setOpenMenuIndex,
  visibleListOfUsers,
  setListOfUsers,
  index,
  buttonRef,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  const removeUser = async () => {
    const unlinkSuccessful = await removeRelation(clientId, user);

    if (unlinkSuccessful) {
      const newList = [
        ...visibleListOfUsers.slice(0, index),
        ...visibleListOfUsers.slice(index + 1),
      ];
      setListOfUsers(newList);
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
          Remove User
        </li>
      </ul>
    </div>
  );
};

export default UserMenuDropdown;
