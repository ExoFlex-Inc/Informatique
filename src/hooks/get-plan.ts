import { useState, useEffect } from "react";

const usePlanData = () => {
  const [planData, setPlanData] = useState(null);
  const [get_plan, setRetryGet] = useState(true); // Set to true initially to trigger the first fetch

  useEffect(() => {
    const getPlanRequests = async () => {
      if (get_plan) {
        try {
          const responseGetPlanning = await fetch("http://localhost:3001/get-plan", {
            method: "GET",
          });

          if (responseGetPlanning.ok) {
            console.log("Plan retrieved successfully.");
            const responsePlanData = await responseGetPlanning.json();
            console.log("Plan data:", responsePlanData[0].plan_content);
            setPlanData(responsePlanData[0].plan_content);
            setRetryGet(false); // Reset retry flag when fetch succeeds
          } else {
            console.error("Failed to retrieve plan.");
            window.alert("Failed to retrieve plan.");
            setRetryGet(true); // Set retry flag to true when fetch fails
          }
        } catch (error) {
          console.error("An error occurred:", error);
          window.alert("An error occurred: " + error);
          setRetryGet(true); // Set retry flag to true when fetch fails
        }
      }
    };

    getPlanRequests();
  }, [get_plan]); // Trigger re-fetch only when get_plan changes

  return { planData };
};

export default usePlanData;
