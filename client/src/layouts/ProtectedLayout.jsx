import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useRefreshTokenMutation } from "@/features/auth/store/authApiSlice";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ProtectedLayout = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const isLoading = useSelector((state) => state.auth.isLoading);
  const location = useLocation();
  const [refreshAuth, { isLoading: isRefreshing }] = useRefreshTokenMutation();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await refreshAuth();
      } catch (error) {
        toast.error("Error re logging");
      } finally {
        setAuthChecked(true);
      }
    })();
  }, [isAuthenticated]);

  // Show loading spinner while checking auth status
  if (isLoading || !authChecked || isRefreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedLayout;
