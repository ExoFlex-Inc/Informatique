import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../hooks/use-user.ts";

const PrivateRoutes = ({
  requiredPermissions,
}: {
  requiredPermissions: string[];
}) => {
  const { user } = useUser(); // Assuming isLoading is part of the hook
  const userPermissions = user?.permissions || [];

  const hasPermission = requiredPermissions.some((permission) =>
    userPermissions.includes(permission),
  );

  if (!user) {
    return null;
  }

  return hasPermission ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoutes;
