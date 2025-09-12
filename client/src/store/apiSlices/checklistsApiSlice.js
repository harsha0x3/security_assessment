import { apiSlice } from "./apiSlice";
import {
  createChecklist,
  setCurrentChecklist,
  loadChecklists,
  updateChecklist,
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

    patchChecklist: builder.mutation({
      query: ({ checklistId, payload }) => {
        return {
          url: `/checklists/${checklistId}`,
          method: "PATCH",
          body: payload,
        };
      },
      invalidatesTags: (result) =>
        result
          ? [{ type: "Checklists", id: result.id }]
          : [{ type: "Checklists", id: "LIST" }],
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(updateChecklist(data));
        } catch (error) {
          console.error("Error in patch checklist", error);
        }
      },
    }),

    getAllChecklists: builder.query({
      query: ({ appId, sort_order = "desc", sort_by = "created_at" }) => {
        const params = new URLSearchParams({
          sort_order,
          sort_by,
        });
        return `applications/${appId}/checklists/?${params.toString()}`;
      },
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

    submitChecklist: builder.mutation({
      query: (checklistId) => ({
        url: `/checklists/${checklistId}/submission`,
        method: "POST",
      }),
      invalidatesTags: (result, error, checklistId) => [
        { type: "Checklists", id: checklistId },
        { type: "Checklists", id: "LIST" },
      ],
    }),
    deleteChecklist: builder.mutation({
      query: (checklistId) => ({
        url: `/checklists/${checklistId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Checklists", id: "LIST" }],
    }),

    getTrashedChecklists: builder.query({
      query: ({ appId }) => `/applications/${appId}/checklists/trash`,
      providesTags: ["TrashedChecklists"],
    }),
  }),
});

export const {
  useAddChecklistMutation,
  useGetAllChecklistsQuery,
  useLazyGetAllChecklistsQuery,
  useSubmitChecklistMutation,
  useDeleteChecklistMutation,
  useGetTrashedChecklistsQuery,
  usePatchChecklistMutation,
} = checklistsApiSlice;
