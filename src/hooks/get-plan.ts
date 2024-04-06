import { useState, useEffect } from "react";

const usePlanData = () => {
  const [planData, setPlanData] = useState(null);
  const [get_plan, setRetryGet] = useState(true); // Set to true initially to trigger the first fetch

  useEffect(() => {
    const getPlanRequests = async () => {
        try {
          const responseGetPlanning = await fetch("http://localhost:3001/get-plan", {
            method: "GET",
          });

          if (responseGetPlanning.ok) {
            console.log("Plan retrieved successfully.");
            const responsePlanData = await responseGetPlanning.json();
            console.log("Plan data:", responsePlanData[0].plan_content);
            setPlanData(responsePlanData[0].plan_content);
            setRetryGet(false);
          } else {
            console.error("Failed to retrieve plan.");
            window.alert("Failed to retrieve plan.");
            setRetryGet(true);
          }
        } catch (error) {
          console.error("An error occurred:", error);
          window.alert("An error occurred: " + error);
          setRetryGet(true);
        }
    };

    getPlanRequests();
  }, [get_plan]);

  return { planData };
};

export default usePlanData;
