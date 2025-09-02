import { apiSlice } from "./apiSlice";
import {
  createChecklist,
  setCurrentChecklist,
  loadChecklists,
} from "../appSlices/checklistsSlice";

export const checklistsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addChecklist: builder.mutation({
      query: ({ payload, appId }) => {
        return {
          url: `/applications/${appId}/checklists`,
          method: "POST",
          body: payload,
        };
      },
      invalidatesTags: ["Checklists"],
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(createChecklist(data));
          dispatch(setCurrentChecklist(data.id));
        } catch (error) {
          console.error(error);
        }
      },
    }),

    getAllChecklists: builder.query({
      query: (appId) => `applications/${appId}/checklists`,
      providesTags: (result) =>
        result
          ? [
              ...result.map((chk) => ({ type: "Checklists", id: chk.id })), // each checklist
              { type: "Checklists", id: "LIST" }, // the list itself
            ]
          : [{ type: "Checklists", id: "LIST" }],
    }),
    onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
      try {
        const { data } = await queryFulfilled;
        dispatch(loadChecklists(data));
      } catch (error) {
        console.error(error);
      }
    },
  }),
});

export const {
  useAddChecklistMutation,
  useGetAllChecklistsQuery,
  useLazyGetAllChecklistsQuerys,
} = checklistsApiSlice;
