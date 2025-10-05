import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLogout, loginSuccess } from "@/features/auth/store/authSlice";
const isProd = import.meta.env.VITE_PROD_ENV === "true";
import { getCSRFToken } from "@/utils/csrf";

getCSRFToken();

const apiBaseUrl = isProd
  ? "http://10.160.14.76:8060"
  : "http://localhost:8000";

const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  credentials: "include",
  prepareHeaders: (headers) => {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    } else {
      console.error(
        "::::::::********CSRF token not found***********:::::::::::"
      );
    }
    console.error(":::::FOUND CSRF TOKEN:::::", csrfToken);
    console.error(":::::HEADERS:::::", headers);

    return headers;
  },
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
      api.dispatch(loginSuccess(refreshResult.data));
      result = await baseQueryWithAuth(args, api, extraOptions);
    } else {
      api.dispatch(userLogout());
    }
  }
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
    "TrashedApps",
    "TrashedChecklists",
    "PreAssessment",
    "PreAssessmentResponses",
    "drafts",
  ],
  // eslint-disable-next-line no-unused-vars
  endpoints: (builder) => ({}),
});
