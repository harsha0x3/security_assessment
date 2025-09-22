import {
  useCreateAssessmentMutation,
  useCreateSectionMutation,
  useAddQuestionsMutation,
  useGetQuestionnaireQuery,
  useGetAssessmentsQuery,
  useGetSectionsQuery,
} from "@/features/preAssessments/store/preAssessmentApiSlice";

export const usePreAssessment = ({
  assessmentId = null,
  sectionId = null,
} = {}) => {};
