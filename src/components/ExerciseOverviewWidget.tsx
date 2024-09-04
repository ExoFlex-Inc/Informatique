import { useEffect, useState } from "react";
import { supaClient } from "../hooks/supa-client.ts";
import { useUserProfile } from "../hooks/use-profile.ts";

interface ExerciseOverviewWidgetProps {
  stm32Data?: string | null;
}

const ExerciseOverviewWidget: React.FC<ExerciseOverviewWidgetProps> = ({
  stm32Data,
}) => {
  const [planData, setPlanData] = useState<any[]>([]);
  const { profile } = useUserProfile();

  useEffect(() => {
    async function fetchPlan() {
      if (profile) {
        const { data: plan } = await supaClient
          .from("plans")
          .select("*")
          .eq("user_id", profile.user_id);

        if (plan && plan?.length > 0) {
          setPlanData(plan[0].plan_content.plan);
        }
      }
    }
    fetchPlan();
  }, []);

  return (
    <div className="bg-white rounded-lg p-4 max-h-96 overflow-auto overflow-x-hidden">
      <label
        style={{ fontSize: "clamp(0rem, 2.5vw, 1.5rem)" }}
        className="text-blue-600"
      >
        Today's exercises
      </label>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr className="divide-x divide-gray-200">
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Exercise
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Repetitions
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rest (sec)
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {planData &&
            planData.map(
              (item, index) =>
                "movement" in item && (
                  <tr
                    key={index}
                    className={
                      index === stm32Data?.ExerciseIdx
                        ? "bg-green-200"
                        : index % 2 === 0
                          ? "bg-gray-50"
                          : "bg-white"
                    }
                  >
                    <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-900">
                      {item.movement.map((movement: any, index: number) => (
                        <div key={index}>{movement.exercise}</div>
                      ))}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-900">
                      {item.repetitions}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-900">
                      {item.rest}
                    </td>
                  </tr>
                ),
            )}
        </tbody>
      </table>
    </div>
  );
};

export default ExerciseOverviewWidget;
