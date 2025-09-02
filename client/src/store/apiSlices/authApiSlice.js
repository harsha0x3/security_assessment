import { apiSlice } from "./apiSlice";
import {
  loginSuccess,
  registerSuccess,
  setError,
  setIsLoading,
  userLogout,
} from "../appSlices/authSlice";

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: ({ username_or_email, password }) => {
        const formData = new URLSearchParams();
        formData.append("username", username_or_email);
        formData.append("password", password);

        return {
          url: "/auth/login",
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        };
      },
      invalidatesTags: ["User"],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          dispatch(setIsLoading(true));
          const { data } = await queryFulfilled;
          console.log("Dispatching... login");
          dispatch(loginSuccess(data));
        } catch (error) {
          console.error("Error in login slice", error);
          dispatch(setError(error));
          dispatch(setIsLoading(false));
        }
      },
    }),

    register: builder.mutation({
      query: ({
        username,
        email,
        password,
        first_name,
        last_name,
        role,
        enable_mfa,
      }) => ({
        url: "/auth/register",
        method: "POST",
        body: {
          username,
          email,
          password,
          first_name,
          last_name,
          role,
          enable_mfa,
        },
      }),
      invalidatesTags: ["User"],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          dispatch(setIsLoading(true));
          const { data } = await queryFulfilled;
          dispatch(registerSuccess(data));
        } catch (error) {
          dispatch(setError(error));
          dispatch(setIsLoading(false));

          console.error("Error in register slice", error);
        }
      },
    }),

    refreshToken: builder.mutation({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
      invalidatesTags: ["User"],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(loginSuccess(data));
        } catch (error) {
          dispatch(setError(error));
          console.error("Error in refresh slice", error);
        }
      },
    }),

    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User"],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(userLogout(data));
        } catch (error) {
          dispatch(setError(error));
          console.error("Error in logout slice", error);
        }
      },
    }),
    getAllUsers: builder.query({
      query: () => "/auth/all",
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetAllUsersQuery,
} = authApiSlice;
