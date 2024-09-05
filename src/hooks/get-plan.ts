import { useState, useEffect } from "react";

const usePlanData = (profile: any) => {
  const [planData, setPlanData] = useState(null);
  const [get_plan, setRetryGet] = useState(true);

  useEffect(() => {
    const getPlanRequests = async () => {
      try {
        if (profile) {
          const responseGetPlanning = await fetch(
            "http://localhost:3001/api/plan",
            {
              method: "GET",
              headers: {
                UserId: profile.user_id,
              },
            },
          );

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
        } else {
          console.error("No user id provided for plan request");
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
