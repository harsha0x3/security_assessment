import { apiSlice } from "@/store/apiSlice";

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
      query: ({
        checklistId,
        sort_order = "desc",
        sort_by = "created_at",
        page = 1,
        page_size = 10,
      }) => {
        const params = new URLSearchParams({
          sort_order,
          sort_by,
          page,
          page_size,
        });
        return `/checklists/${checklistId}/controls-responses?${params.toString()}`;
      },
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

    uploadControls: builder.mutation({
      query: ({ input_file, checklistId }) => {
        const formData = new FormData();
        formData.append("input_file", input_file);
        return {
          url: `/checklists/${checklistId}/controls/upload`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: [{ type: "Controls", id: "LIST" }],
    }),

    exportControlsCsv: builder.query({
      async queryFn(checklistId, _api, _extraOptions, fetchWithBQ) {
        const result = await fetchWithBQ({
          url: `/checklists/${checklistId}/export?file_type=csv`,
          method: "GET",
          responseHandler: (response) => response.blob(),
        });

        if (result.error) return { error: result.error };
        return { data: result.data };
      },
    }),
  }),
});

export const {
  useAddControlMutation,
  useGetAllControlsQuery,
  useGetAllControlsWithResponsesQuery,
  useUpdateControlsMutation,
  useImportControlsMutation,
  useUploadControlsMutation,
  useExportControlsCsvQuery,
} = controlsApiSlice;
