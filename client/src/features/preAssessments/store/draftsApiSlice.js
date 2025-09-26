import { apiSlice } from "@/store/apiSlice";

const draftsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    saveDraft: builder.mutation({
      query: ({ payload, assessmentId }) => {
        console.log("PAYLOAD IN SAVE DRAFT", payload);
        return {
          url: `/drafts/pre_assessments/${assessmentId}`,
          method: "POST",
          body: payload,
        };
      },
      invalidatesTags: ["drafts"],
    }),

    getDrafts: builder.query({
      query: (assessmentId) => `/drafts/pre_assessments/${assessmentId}`,
      providesTags: ["drafts"],
    }),

    deleteDrafts: builder.mutation({
      query: ({ payload, assessmentId }) => {
        console.log("PAYLOAD IN SAVE DRAFT", payload);
        return {
          url: `/drafts/pre_assessments/${assessmentId}`,
          method: "DELETE",
          body: payload,
        };
      },
      invalidatesTags: ["drafts"],
    }),
  }),
});

export const {
  useDeleteDraftsMutation,
  useGetDraftsQuery,
  useSaveDraftMutation,
} = draftsApiSlice;
