import { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import LoginForm from "../components/auth/LoginForm";
import { selectAuth } from "../store/appSlices/authSlice";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useSelector(selectAuth);
  const isAuthenticated = auth.isAuthenticated;

  // Get the intended destination or default to dashboard
  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleLoginSuccess = () => {
    navigate(from, { replace: true });
  };

  const handleOnSwitchToRegister = () => {
    navigate("/register");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to continue to your account
          </p>
        </div>

        {/* Login Form */}
        <LoginForm
          onClose={handleLoginSuccess}
          onSwitchToRegister={handleOnSwitchToRegister}
        />

        {/* Register Link */}
        {/* <div className="text-center mt-6">
          <p className="text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
            >
              Create one here
            </Link>
          </p>
        </div> */}

        {/* Additional Links */}
        <div className="text-center mt-4 space-x-4">
          <Link
            to="/forgot-password"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Forgot Password?
          </Link>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <Link
            to="/help"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Help
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
