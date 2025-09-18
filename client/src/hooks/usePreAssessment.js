import {
  useCreateAssessmentMutation,
  useCreateSectionMutation,
  useAddQuestionsMutation,
  useGetQuestionnaireQuery,
  useGetAssessmentsQuery,
  useGetSectionsQuery,
} from "@/store/apiSlices/preAssessmentApiSlice";

export const usePreAssessment = ({
  assessmentId = null,
  sectionId = null,
} = {}) => {};
