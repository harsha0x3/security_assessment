import { apiSlice } from "./apiSlice";
import {
  addApp,
  removeApp,
  loadApps,
  updateApp,
} from "../appSlices/applicationSlice";

export const applicationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addApplication: builder.mutation({
      query: ({ payload }) => {
        console.log("app api", payload);
        return { url: "/applications", method: "POST", body: payload };
      },
      invalidatesTags: ["Apps"],
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        try {
          const result = await queryFulfilled;
          dispatch(addApp(result.data));
        } catch (error) {
          console.error(error);
        }
      },
    }),

    updateApplication: builder.mutation({
      query: ({ payload, appId }) => {
        console.log("payload", payload);
        console.log("AppId", appId);
        return {
          url: `/applications/${appId}`,
          method: "PATCH",
          body: payload,
        };
      },
      invalidatesTags: (result, error, appId) => [{ type: "Apps", id: appId }],
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        try {
          const result = await queryFulfilled;
          dispatch(updateApp(result.data));
        } catch (error) {
          console.error(error);
        }
      },
    }),

    getApplications: builder.query({
      query: () => "/applications",
      providesTags: ["Apps"],
      // onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
      //   try {
      //     const result = await queryFulfilled;
      //     console.log(result);
      //     dispatch(loadApps(result.data));
      //   } catch (error) {
      //     console.error(error);
      //   }
      // },
    }),
  }),
});

export const {
  useAddApplicationMutation,
  useGetApplicationsQuery,
  useUpdateApplicationMutation,
  useLazyGetApplicationsQuery,
} = applicationApiSlice;
