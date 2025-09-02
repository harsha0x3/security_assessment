import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useRegisterMutation,
} from "../store/apiSlices/authApiSlice";
import {
  selectAuth,
  userLogout as logoutAction,
} from "../store/appSlices/authSlice";

import { toast } from "react-toastify";

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const auth = useSelector(selectAuth);
  const isAuthenticated = auth.isAuthenticated;

  const [loginMutation, { isLoading: isLoggingIn }] = useLoginMutation();
  const [registerMutation, { isLoading: isRegistering }] =
    useRegisterMutation();
  const [logoutMutation] = useLogoutMutation();
  const [refreshTokenMutation] = useRefreshTokenMutation();

  const login = async (credentials) => {
    try {
      console.log("inside useauth login");
      const data = await loginMutation(credentials).unwrap();
      console.log(data);
      toast.success("Login Succesful!");
      navigate("/dashboard");
      return { success: true };
    } catch (error) {
      console.log(error);
      console.error("Error logging in", error.data?.detail || "Login Failed");
      toast.error(error);
      return { success: false, error: error.data?.detail || "Login Failed" };
    }
  };

  const register = async (userData) => {
    try {
      await registerMutation(userData).unwrap();
      toast.success("Registration Successful!");
      navigate("/dashboard");
      return { success: true };
    } catch (error) {
      console.error(
        "Error registration",
        error.data?.detail || "Registration failed"
      );
      toast.error(error);
    }
  };

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
      toast.success("Logged out successfully");
      dispatch(logoutAction());
      navigate("/login");
    } catch (error) {
      toast.info("logged out");
      dispatch(logoutAction());
      navigate("/login");
    }
  };

  const selectUser = () => {
    return {
      username: auth.username,
      firstName: auth.firstName,
      email: auth.email,
      lastName: auth.lastName,
      role: auth.role,
    };
  };

  //   const isTokenExpiring = () => {
  //     if (!auth.tokenExpiresAt) return false;
  //     const now = Date.now();
  //     const timeUntilExpiry = auth.tokenExpiresAt - now;
  //     return timeUntilExpiry < 2 * 60 * 1000;
  //   };

  //   const refreshTokenIfNeeded = async () => {
  //     if (isTokenExpiring()) {
  //       try {
  //         await refreshTokenMutation().unwrap();
  //         return true;
  //       } catch (error) {
  //         console.error("Error in refresh", error);
  //         return false;
  //       }
  //     }
  //     return true;
  //   };

  return {
    isAuthenticated,
    isLoading: isLoggingIn,
    login,
    register,
    logout,
    selectUser,
    // refreshTokenIfNeeded,
    // isTokenExpiring,
  };
};

export default useAuth;
