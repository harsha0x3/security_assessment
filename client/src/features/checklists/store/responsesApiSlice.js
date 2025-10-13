import { apiSlice } from "@/store/apiSlice";

export const responsesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    saveResponse: builder.mutation({
      query: ({ payload, controlId, responseId }) => ({
        url: responseId
          ? `/responses/${responseId}`
          : `/controls/${controlId}/responses`,
        method: responseId ? "PATCH" : "POST",
        body: payload,
      }),
      invalidatesTags: (result, error, { controlId }) => [
        { type: "Controls", id: controlId },
        { type: "Controls", id: "LIST" },
      ],
    }),
    importResposes: builder.mutation({
      query: ({ checklistId, inputFile }) => {
        const formData = new FormData();
        formData.append("input_file", inputFile);
        return {
          url: `/checklists/${checklistId}/responses/upload`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: [{ type: "Controls", id: "LIST" }],
    }),

   viewEvidence: builder.query({
  query: (fileKey) => {
    // Extract the key part from s3://bucket/key format
    const key = fileKey.replace(/^s3:\/\/[^\/]+\//, '');
    // URL encode it to handle special characters
	const params = new URLSearchParams({file_key: key})
    return `/responses/file-view?${params.toString()}`;
  },
}),
  }),
});

export const {
  useSaveResponseMutation,
  useImportResposesMutation,
  useLazyViewEvidenceQuery,
} = responsesApiSlice;
