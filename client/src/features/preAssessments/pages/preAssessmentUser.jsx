import {
  useGetAssessmentsQuery,
  useGetAssessmentQuestionnaireQuery,
  useSubmitResponsesMutation,
} from "@/features/preAssessments/store/preAssessmentApiSlice";
import { Card, CardContent, CardHeader } from "../../../components/ui/Card";
import { Combobox } from "../../../components/ui/ComboBox";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import PreAssessmentForm from "../components/PreAssessmentForm";

const PreAssessmentUser = () => {
  const { data: allAssessments = [], isSuccess: assessmentsFetched } =
    useGetAssessmentsQuery();
  const [submitResponses] = useSubmitResponsesMutation();

  const [searchParams, setSearchParams] = useSearchParams();
  const currAssessmentId = searchParams.get("currAssessment") || null;

  const [currentAssessment, setCurrentAssessment] = useState(null);

  // questionnaire for current assessment
  const { data: questionnaire = [], isSuccess: questionnaireFetched } =
    useGetAssessmentQuestionnaireQuery(currentAssessment?.id, {
      skip: !currentAssessment?.id,
    });

  // Initialize from params
  useEffect(() => {
    if (assessmentsFetched && allAssessments.length > 0 && currAssessmentId) {
      const currAss = allAssessments.find(
        (a) => String(a.id) === currAssessmentId
      );
      setCurrentAssessment(currAss || null);
    }
  }, [currAssessmentId, assessmentsFetched, allAssessments]);

  const assessmentItems = useMemo(
    () =>
      allAssessments.map((a) => ({
        value: a.id,
        label: a.assessment_type ?? a.name ?? String(a.id),
      })),
    [allAssessments]
  );

  const handleSubmit = async ({ assessmentId, responses }) => {
    try {
      const out = await submitResponses({
        assessmentId,
        payload: responses,
      }).unwrap();
      toast.success("Responses submitted successfully!");
      console.log("SUBMIT SUCCESS", out);
    } catch (err) {
      console.error("Submit error", err);
      toast.error("Error submitting responses");
    }
  };

  return (
    <Card className="flex flex-col h-full border-none shadow-none">
      <CardHeader className="flex w-full py-0">
        <div className="w-80 min-w-0">
          {assessmentsFetched && assessmentItems.length > 0 && (
            <Combobox
              items={assessmentItems}
              selectedValue={currentAssessment?.id}
              onSelect={(value) => {
                const assessment = allAssessments.find(
                  (a) => String(a.id) === String(value)
                );
                setCurrentAssessment(assessment);
                setSearchParams({ currAssessment: assessment?.id });
              }}
              placeholder="Select an assessment"
              shouldFilter
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <PreAssessmentForm
          assessment={currentAssessment}
          questionnaire={questionnaireFetched ? questionnaire : []}
          subResponses={[]} // empty array means no previous answers
          onSubmit={handleSubmit}
        />
      </CardContent>
    </Card>
  );
};

export default PreAssessmentUser;
