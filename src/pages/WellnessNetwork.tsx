import AddPatientButton from "../components/AddPatientButton.tsx";
import PatientList from "../components/PatientsList.tsx";
import PatientSearchBar from "../components/PatientSearchBar.tsx";
import { useEffect, useState } from "react";
import { supaClient } from "../hooks/supa-client.ts";

export async function networkInit() {

    try {
        const responseGetClients = await fetch("http://localhost:3001/get_clients_for_admin", {
        method: "GET",
        });

        if (responseGetClients.ok) {
            console.log("List retrieved successfully.");
            const listData = await responseGetClients.json();
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
    const [visibleListOfPatients, setVisibleListOfPatients] = useState<any[]>([]);
    const [adminId, setAdminId] = useState<undefined | string>(undefined);

    async function getAdminId () {
        try {
            const {
                data: { user },
            } = await supaClient.auth.getUser();
            setAdminId(user?.id)
        } catch (err) {
            console.error('Error fetching session:', err);
        }
    };

    async function fetchListData() {
        const data = await networkInit();
        if (data.loaded && data.listData) {
            setVisibleListOfPatients(data.listData);
        }
    }

    useEffect(() => {
        getAdminId();
    }, []);

    useEffect(() => {
        fetchListData();
        setVisibleListOfPatients(listOfPatients);
    },[listOfPatients])

    return (
        <div>
            <div className="flex items-center justify-between relative">
                <PatientSearchBar listOfPatients={listOfPatients} setVisibleListOfPatients={setVisibleListOfPatients} />
                <AddPatientButton adminId={adminId} setListOfPatients={setListOfPatients} listOfPatients={listOfPatients} />
            </div>
            <PatientList setListOfPatients={setListOfPatients} visibleListOfPatients={visibleListOfPatients} />
        </div>
    );
}