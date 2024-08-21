import { Navigate, Outlet } from "react-router-dom";
import { useUserProfile } from "../hooks/use-profile.ts";

const PrivateRoutes = ({ requiredPermissions }) => {
  const { profile } = useUserProfile();
  const userPermissions = profile?.permissions || [];

  const hasPermission = requiredPermissions.some((permission) =>
    userPermissions.includes(permission),
  );

  return hasPermission ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoutes;
