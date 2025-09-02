import { apiSlice } from "./apiSlice";

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
  }),
});

export const { useSaveResponseMutation } = responsesApiSlice;
