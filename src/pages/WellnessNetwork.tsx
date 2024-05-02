import AddPatientButton from "../components/AddPatientButton.tsx";
import PatientList from "../components/PatientsList.tsx";


export default function WellnessNetwork() {
    return (
        <div className="">
            <AddPatientButton />
            <PatientList />
        </div>
    );
}