import { apiSlice } from "@/store/apiSlice";
import {
  createChecklist,
  setCurrentChecklist,
  loadChecklists,
  updateChecklist,
} from "./checklistsSlice";

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
      query: ({
        appId,
        sort_order = "desc",
        sort_by = "created_at",
        search = "",
        search_by = "checklist_type",
        page = 1,
        page_size = 10,
      }) => {
        const params = new URLSearchParams({
          sort_order,
          sort_by,
          search,
          search_by,
          page,
          page_size,
        });
        return `applications/${appId}/checklists?${params.toString()}`;
      },
      providesTags: (result) => {
        const checklists = result?.checklists ?? []; // fallback to empty array
        return [
          ...checklists.map((chk) => ({ type: "Checklists", id: chk.id })),
          { type: "Checklists", id: "LIST" },
        ];
      },

      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          console.log("DATA IN C LIST API", data);
          dispatch(loadChecklists(data));
        } catch (error) {
          console.error(error);
        }
      },
    }),

    submitChecklist: builder.mutation({
      query: (checklistId) => ({
        url: `/checklists/${checklistId}/submission`,
        method: "PATCH",
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
    setChecklistPriority: builder.mutation({
      query: ({ checklistId, priority }) => ({
        url: `checklists/${checklistId}/set-priority`,
        method: "PATCH",
        body: { priority_val: priority },
      }),
      invalidatesTags: (result) =>
        result
          ? [{ type: "Checklists", id: result.id }]
          : [{ type: "Checklists", id: "LIST" }],
    }),

    evaluateChecklist: builder.mutation({
      query: ({ checklistId, payload }) => ({
        url: `checklists/${checklistId}/evaluate`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: (result) =>
        result
          ? [{ type: "Checklists", id: result.checklist.id }]
          : [{ type: "Checklists", id: "LIST" }],
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
  useSetChecklistPriorityMutation,
  useEvaluateChecklistMutation,
} = checklistsApiSlice;
