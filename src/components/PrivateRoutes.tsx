import { Navigate, Outlet } from "react-router-dom";
import { useUserProfile } from "../hooks/use-profile.ts";

const PrivateRoutes = ({ requiredPermissions }) => {
  const { profile } = useUserProfile();  // Assuming isLoading is part of the hook
  const userPermissions = profile?.permissions || [];

  const hasPermission = requiredPermissions.some((permission) =>
    userPermissions.includes(permission),
  );

  if (!profile) {
    return null;
  }

  return hasPermission ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoutes;