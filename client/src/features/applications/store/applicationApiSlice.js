import { apiSlice } from "@/store/apiSlice";
import {
  addApp,
  removeApp,
  loadApps,
  updateApp,
} from "../store/applicationSlice";

export const applicationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addApplication: builder.mutation({
      query: ({ payload }) => {
        console.log("app api", payload);
        return { url: "/applications", method: "POST", body: payload };
      },
      invalidatesTags: [{ type: "Apps", id: "LIST" }],
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
      invalidatesTags: (result, error, { appId }) => [
        { type: "Apps", id: appId },
        { type: "Apps", id: "LIST" },
      ],
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
      query: ({
        sort_by,
        sort_order,
        page = 1,
        page_size = 15,
        search = "",
        search_by = "name",
      }) => {
        const params = new URLSearchParams({
          sort_order,
          sort_by,
          page,
          page_size,
          search,
          search_by,
        });
        console.log("PARAMS INAPPSLICE", params.toString());
        return `/applications?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...(result.apps || []).map((app) => ({
                type: "Apps",
                id: app.id,
              })),
              { type: "Apps", id: "LIST" },
            ]
          : [{ type: "Apps", id: "LIST" }],
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

    getAppDetails: builder.query({
      query: (appId) => `/applications/${appId}`,
      providesTags: (result, error, appId) => [{ type: "Apps", id: appId }],
    }),

    deleteApp: builder.mutation({
      query: ({ appId }) => ({
        url: `/applications/${appId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Apps"],
    }),

    getTrashedApps: builder.query({
      query: () => "/applications/trash",
      providesTags: ["TrashedApps"],
    }),

    restoreTrashedApps: builder.mutation({
      query: (appId) => ({
        url: `applications/restore/${appId}`,
        method: "PATCH",
      }),
      invalidatesTags: ["TrashedApps"],
    }),

    setAppPriority: builder.mutation({
      query: ({ appId, priority }) => ({
        url: `applications/${appId}/set-priority`,
        method: "PATCH",
        body: { priority_val: Number(priority) },
      }),
      invalidatesTags: (result, error, { appId }) => [
        { type: "Apps", id: appId },
        { type: "Apps", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useAddApplicationMutation,
  useGetApplicationsQuery,
  useUpdateApplicationMutation,
  useLazyGetApplicationsQuery,
  useDeleteAppMutation,
  useGetTrashedAppsQuery,
  useRestoreTrashedAppsMutation,
  useGetAppDetailsQuery,
  useSetAppPriorityMutation,
} = applicationApiSlice;
