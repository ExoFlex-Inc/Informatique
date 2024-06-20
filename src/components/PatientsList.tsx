import ListIcon from "@mui/icons-material/List";
import PatientMenuDropdown from "./PatientMenuDropdown.tsx";
import { useState } from "react";

interface PatientListProps {
  visibleListOfPatients: any[];
  setListOfPatients: React.Dispatch<React.SetStateAction<any[]>>;
}

const PatientList: React.FC<PatientListProps> = ({
  visibleListOfPatients,
  setListOfPatients,
}) => {
  const [openMenuIndex, setOpenMenuIndex] = useState<Number | null>(null);

  function toggleDropdown(index: Number) {
    setOpenMenuIndex(index === openMenuIndex ? null : index);
  }

  return (
    <div className="grid grid-cols-4 shadow-md shadow-gray-500 pt-2 bg-gray-300 rounded-2xl mx-4">
      <label
        className={
          "font-bold border-gray-400 text-black pl-2 pb-2" +
          (visibleListOfPatients?.length > 0 ? " border-b-2" : "")
        }
      >
        First Name
      </label>
      <label
        className={
          "font-bold border-gray-400 text-black pl-2 pb-2" +
          (visibleListOfPatients?.length ? " border-b-2" : "")
        }
      >
        Last Name
      </label>
      <label
        className={
          "font-bold border-gray-400 text-black pl-2 pb-2" +
          (visibleListOfPatients?.length ? " border-b-2" : "")
        }
      >
        Email
      </label>
      <label
        className={
          "font-bold border-gray-400 text-black pl-2 pb-2" +
          (visibleListOfPatients?.length ? " border-b-2" : "")
        }
      >
        Phone Number
      </label>

      <ul className="divide-y rounded-bl-2xl divide-gray-400 bg-white">
        {visibleListOfPatients?.map((patient, index) => (
          <li key={index} className="text-black p-2">
            {patient.username}
          </li>
        ))}
      </ul>

      <ul className="divide-y divide-gray-400 bg-white">
        {visibleListOfPatients?.map((patient, index) => (
          <li key={index} className="text-black p-2">
            {patient.lastname}
          </li>
        ))}
      </ul>

      <ul className="divide-y divide-gray-400 bg-white">
        {visibleListOfPatients?.map((patient, index) => (
          <li key={index} className="text-black p-2">
            {patient.email}
          </li>
        ))}
      </ul>
      <ul className="divide-y divide-gray-400 rounded-br-2xl bg-white">
        {visibleListOfPatients?.map((patient, index) => (
          <div key={index} className="relative">
            <li
              key={index}
              className="text-black flex items-center justify-between p-2"
            >
              <span>{patient.phone_number}</span>
              <button
                onClick={() => toggleDropdown(index)}
                className="hover:bg-gray-300 rounded-full"
              >
                <ListIcon />
              </button>
            </li>
            {openMenuIndex === index && (
              <PatientMenuDropdown
                clientId={patient.user_id}
                setListOfPatients={setListOfPatients}
                visibleListOfPatients={visibleListOfPatients}
                index={index}
                setOpenMenuIndex={setOpenMenuIndex}
              />
            )}
          </div>
        ))}
      </ul>
    </div>
  );
};

export default PatientList;
