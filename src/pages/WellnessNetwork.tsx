import AddPatientButton from "../components/AddPatientButton.tsx";
import PatientList from "../components/PatientsList.tsx";
import { useEffect, useState } from "react";

export async function networkInit() {
    try {
        console.log("Getting the current list...");

        const responseGetList = await fetch("http://localhost:3001/get-users-list", {
        method: "GET",
        });

        console.log(responseGetList);

        if (responseGetList.ok) {
            console.log("List retrieved successfully.");
            const listData = await responseGetList.json();
            console.log("List data:", listData);
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
    const [listOfPatientsIsDirty, setListOfPatientsIsDirty] = useState(false);

    useEffect(() => {
        async function fetchListData() {
            const data = await networkInit();
            console.log(data);
            if (data.loaded && data.listData[0]) {
                setListOfPatients(data.listData[0].list_of_patient);
            }
          }
          fetchListData();
    }, []);

    useEffect(() => {
        if(listOfPatientsIsDirty) {

            saveUsersToSupabase(listOfPatients);
        }
        // return () => {
        //     saveUsersToSupabase(listOfPatients);
        // }

    },[listOfPatients])

    const saveUsersToSupabase = async (usersList: any) => {
        try {
            const requestBody = {
                usersList: usersList,
            };

            const response = await fetch("http://localhost:3001/push-users-list-supabase", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                console.log("List pushed to Supabase");
            }
            else {
                console.error("Failed to send list to Supabase", response);
            }
        } catch (error) {
            console.error("Error saving list to Supabase:", error);
        }
    }

    return (
        <div className="">
            <AddPatientButton setListOfPatientsIsDirty={setListOfPatientsIsDirty} setListOfPatients={setListOfPatients} listOfPatients={listOfPatients} />
            <PatientList setListOfPatientsIsDirty={setListOfPatientsIsDirty} setListOfPatients={setListOfPatients} listOfPatients={listOfPatients} />
        </div>
    );
}