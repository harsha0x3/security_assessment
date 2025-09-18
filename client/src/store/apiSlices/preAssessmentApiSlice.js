import { apiSlice } from "./apiSlice";

const preAssessmentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createAssessment: builder.mutation({
      query: ({ payload }) => ({
        url: `/pre-assessment/assessment`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["PerAssessment"],
    }),

    createSection: builder.mutation({
      query: ({ payload, assessmentId }) => ({
        url: `/pre-assessment/${assessmentId}/section`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["PerAssessment"],
    }),

    addQuestions: builder.mutation({
      query: ({ payload, sectionId }) => ({
        url: `/pre-assessment/${sectionId}/question`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["PerAssessment"],
    }),

    getAssessments: builder.query({
      query: () => `/pre-assessment/assessments`,
      providesTags: ["PerAssessment"],
    }),
    getSections: builder.query({
      query: (assessmentId) => `/pre-assessment/${assessmentId}/sections`,
      providesTags: ["PerAssessment"],
    }),
    getQuestionnaire: builder.query({
      query: (sectionId) => `/pre-assessment/${sectionId}/questionnaire`,
      providesTags: ["PerAssessment"],
    }),

    getSectionQuestions: builder.query({
      query: (sectionId) => `/pre-assessment/section/${sectionId}/questions`,
      providesTags: ["PerAssessment"],
    }),

    submitResponses: builder.mutation({
      query: ({ assessmentId, payload }) => ({
        url: `/pre-assessment/${assessmentId}/submit`,
        method: "POST",
        body: payload.responses,
      }),
      invalidatesTags: ["PerAssessmentResponses"],
    }),
  }),
});

export const {
  useAddQuestionsMutation,
  useCreateAssessmentMutation,
  useCreateSectionMutation,
  useGetAssessmentsQuery,
  useGetQuestionnaireQuery,
  useGetSectionsQuery,
  useGetSectionQuestionsQuery,
  useSubmitResponsesMutation,
} = preAssessmentApiSlice;
