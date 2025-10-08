import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLogout, loginSuccess } from "@/features/auth/store/authSlice";
const isProd = import.meta.env.VITE_PROD_ENV === "true";
import { getCSRFToken } from "@/utils/csrf";

getCSRFToken();

const apiBaseUrl = isProd
  ? "http://10.160.14.76:8060/api/v1.0"
  : "http://localhost:8000/api/v1.0";

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

    return headers;
  },
});

const shouldRefresh = (exp) => {
  if (!exp) return false;
  const now = Date.now() / 1000;
  const remaining = exp - now;
  return remaining < 180; // less than 3 minutes left
};

const baseQueryWithReauth = async (args, api, extraOptions) => {
  const state = api.getState();
  const exp = state.auth?.accessExp;

  // proactive refresh
  if (shouldRefresh(exp)) {
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
    } else {
      api.dispatch(userLogout());
    }
  }

  // proceed with request
  let result = await baseQueryWithAuth(args, api, extraOptions);

  // fallback: handle expired (401)
  if (result.error && result.error.status === 401) {
    const refreshResult = await baseQueryWithAuth(
      { url: "/auth/refresh", method: "POST", credentials: "include" },
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
  baseQuery: baseQueryWithReauth,
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
