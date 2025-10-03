import { apiSlice } from "@/store/apiSlice";

const preAssessmentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createAssessment: builder.mutation({
      query: ({ payload }) => ({
        url: `/pre-assessment/assessment`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["PreAssessment"],
    }),

    createSection: builder.mutation({
      query: ({ payload, assessmentId }) => ({
        url: `/pre-assessment/${assessmentId}/section`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["PreAssessment"],
    }),

    addQuestions: builder.mutation({
      query: ({ payload, sectionId }) => ({
        url: `/pre-assessment/${sectionId}/question`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["PreAssessment"],
    }),

    getAssessments: builder.query({
      query: () => `/pre-assessment/assessments`,
      providesTags: ["PreAssessment"],
    }),
    getSections: builder.query({
      query: (assessmentId) => `/pre-assessment/${assessmentId}/sections`,
      providesTags: ["PreAssessment"],
    }),

    getAssessmentQuestionnaire: builder.query({
      query: (assessmentId) => `/pre-assessment/${assessmentId}/questionnaire`,
      providesTags: ["PreAssessment"],
    }),

    getSectionQuestions: builder.query({
      query: (sectionId) => `/pre-assessment/section/${sectionId}/questions`,
      providesTags: ["PreAssessment"],
    }),

    submitResponses: builder.mutation({
      query: ({ assessmentId, payload }) => {
        console.log("PAYLOAD IN SLICE", payload);
        return {
          url: `/pre-assessment/${assessmentId}/submit`,
          method: "POST",
          body: payload,
        };
      },
      invalidatesTags: ["PreAssessmentResponses"],
    }),

    getSubmittedAssessments: builder.query({
      query: ({ page = 1, search = "" }) => {
        const params = new URLSearchParams({
          page,
          search,
        });

        return `/pre-assessment/submissions/assessments?${params.toString()}`;
      },
      providesTags: ["PreAssessmentResponses"],
    }),

    getSubmittedResponses: builder.query({
      query: ({ submissionId }) =>
        `/pre-assessment/submissions/${submissionId}/responses`,
      providesTags: ["PreAssessmentResponses"],
    }),

    evaluateSubmission: builder.mutation({
      query: ({ submissionId, payload }) => {
        console.log("PAYLOAD IN SLICE", payload);
        return {
          url: `/pre-assessment/submissions/${submissionId}/evaluate`,
          method: "PATCH",
          body: payload,
        };
      },
      invalidatesTags: ["PreAssessmentResponses", "PreAssessment"],
    }),
  }),
});

export const {
  useAddQuestionsMutation,
  useCreateAssessmentMutation,
  useCreateSectionMutation,
  useGetAssessmentsQuery,
  useGetSectionsQuery,
  useGetSectionQuestionsQuery,
  useSubmitResponsesMutation,
  useGetAssessmentQuestionnaireQuery,
  useGetSubmittedAssessmentsQuery,
  useGetSubmittedResponsesQuery,
  useLazyGetSubmittedResponsesQuery,
  useLazyGetAssessmentQuestionnaireQuery,
  useEvaluateSubmissionMutation,
} = preAssessmentApiSlice;
