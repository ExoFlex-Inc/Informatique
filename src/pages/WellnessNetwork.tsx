import PatientList from "../components/PatientsList.tsx";
import PatientSearchBar from "../components/PatientSearchBar.tsx";
import { useEffect, useState } from "react";

export async function networkInit() {
  try {
    const responseGetClients = await fetch(
      "http://localhost:3001/api/wellness_network",
      {
        method: "GET",
      },
    );

    if (responseGetClients.ok) {
      console.log("List retrieved successfully.");
      const listData = await responseGetClients.json();
      return { loaded: true, listData: listData };
    } else {
      console.error("Failed to retrieve list.");
      window.alert("Failed to retrieve list.");
      return { loaded: false, listData: null };
    }
  } catch (error) {
    console.error("An error occurred:", error);
    window.alert("An error occurred: " + error);
    return { loaded: false, listData: null };
  }
}

export default function WellnessNetwork() {
  const [listOfPatients, setListOfPatients] = useState<any[]>([]);
  const [visibleListOfPatients, setVisibleListOfPatients] = useState<any[]>([]);

  async function fetchListData() {
    const data = await networkInit();
    if (data.loaded && data.listData) {
      setVisibleListOfPatients(data.listData);
    }
  }

  useEffect(() => {
    fetchListData();
    setVisibleListOfPatients(listOfPatients);
  }, [listOfPatients]);

  return (
    <div>
      <div className="flex items-center justify-between relative">
        <PatientSearchBar
          sx={{ width: 500 }}
          setVisibleListOfPatients={setVisibleListOfPatients}
        />
      </div>
      <PatientList
        setListOfPatients={setListOfPatients}
        visibleListOfPatients={visibleListOfPatients}
      />
    </div>
  );
}
