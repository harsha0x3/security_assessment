import { apiSlice } from "./apiSlice";

const controlsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addControl: builder.mutation({
      query: ({ payload, checklistId }) => {
        return {
          url: `/checklists/${checklistId}/control`,
          method: "POST",
          body: payload,
        };
      },
      invalidatesTags: [{ type: "Controls", id: "LIST" }],
    }),

    getAllControls: builder.query({
      query: (checklistId) => `/checklists/${checklistId}/controls`,
      providesTags: ["Controls"],
    }),

    getAllControlsWithResponses: builder.query({
      query: (checklistId) => `/checklists/${checklistId}/controls-responses`,
      providesTags: (result) =>
        result
          ? [
              ...(result.list_controls || []).map((c) => ({
                type: "Controls",
                id: c.control_id,
              })),
              { type: "Controls", id: "LIST" },
            ]
          : [{ type: "Controls", id: "LIST" }],
    }),

    updateControls: builder.mutation({
      query: ({ payload, controlId }) => {
        return {
          url: `/control/${controlId}`,
          method: "PATCH",
          body: payload,
        };
      },
      invalidatesTags: (result, error, { controlId }) => [
        { type: "Controls", id: controlId },
        { type: "Controls", id: "LIST" },
      ],
    }),

    importControls: builder.mutation({
      query: ({ payload }) => {
        return {
          url: `/controls/import`,
          method: "POST",
          body: payload,
        };
      },
      invalidatesTags: [{ type: "Controls", id: "LIST" }],
    }),
  }),
});

export const {
  useAddControlMutation,
  useGetAllControlsQuery,
  useGetAllControlsWithResponsesQuery,
  useUpdateControlsMutation,
  useImportControlsMutation,
} = controlsApiSlice;
