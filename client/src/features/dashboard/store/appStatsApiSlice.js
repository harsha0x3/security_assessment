import { apiSlice } from "@/store/apiSlice";

const appStatsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAppStats: builder.query({
      query: () => `/applications/stats`,
      providesTags: ["Apps"],
    }),
  }),
});

export const { useGetAppStatsQuery } = appStatsApiSlice;
