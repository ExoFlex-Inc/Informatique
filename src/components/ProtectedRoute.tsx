import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supaClient } from "../hooks/supa-client.ts";

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  requiredPermission: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  component: Component,
  requiredPermission,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkPermission() {
      try {
        const {
          data: { user },
        } = await supaClient.auth.getUser();
        if (!user) {
          setHasPermission(false);
        }
        const { data: profile, error } = await supaClient
          .from("user_profiles")
          .select("permissions")
          .eq("user_id", user?.id)
          .single();

        if (!profile || error) {
          setHasPermission(false);
        }

        const userPermissions = profile?.permissions;
        const hasPermission = requiredPermission.includes(userPermissions);

        if (hasPermission) {
          setHasPermission(true);
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
        setHasPermission(false);
      }
    }

    checkPermission();
  }, [requiredPermission]);

  if (hasPermission === null) {
    return <div>Loading...</div>;
  }

  return hasPermission ? <Component /> : <Navigate to="/" />;
};

export default ProtectedRoute;
