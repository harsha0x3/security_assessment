import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLogout, loginSuccess } from "../appSlices/authSlice";
const isProd = import.meta.env.VITE_PROD_ENV === "true";

const apiBaseUrl = isProd
  ? "http://10.160.14.76:8060"
  : "http://127.0.0.1:8000";

const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  credentials: "include",
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQueryWithAuth(args, api, extraOptions);

  // Only handle re-authentication if we get a 401 error
  if (result.error && result.error.status === 401) {
    // Try to refresh the token
    const refreshResult = await baseQueryWithAuth(
      {
        url: "/auth/refresh",
        method: "POST",
        credentials: "include",
      },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // Token refresh successful, update the store and retry the original request
      api.dispatch(loginSuccess(refreshResult.data));
      result = await baseQueryWithAuth(args, api, extraOptions);
    } else {
      // Token refresh failed, log out the user
      api.dispatch(userLogout());
    }
  }

  // For all other cases (success, other errors), just return the result
  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    "User",
    "Apps",
    "Checklists",
    "Controls",
    "Assignments",
    "AllUsers",
  ],
  // eslint-disable-next-line no-unused-vars
  endpoints: (builder) => ({}),
});
