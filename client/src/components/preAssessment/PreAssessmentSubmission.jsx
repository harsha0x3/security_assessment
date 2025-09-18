import {
  useGetAssessmentsQuery,
  useGetSectionQuestionsQuery,
  useGetSectionsQuery,
  useSubmitResponsesMutation,
} from "@/store/apiSlices/preAssessmentApiSlice";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/Card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Combobox } from "../core/ui/Combobox";
import React, { useEffect, useMemo, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { toast } from "react-toastify";

const PreAssessmentSubmission = () => {
  const { data: allAssessments = [], isSuccess: assessmentsFetched } =
    useGetAssessmentsQuery({ refetchOnMountOrArgChange: false });
  const [submitResponses, { isLoading: submitting, error: submitError }] =
    useSubmitResponsesMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);

  const { data: allSections, isSuccess: sectionsFetched } = useGetSectionsQuery(
    currentAssessment?.id,
    {
      skip: !currentAssessment?.id,
      refetchOnMountOrArgChange: false,
    }
  );

  const { data: sectionQuestions, isSuccess: sectionQsFetched } =
    useGetSectionQuestionsQuery(currentSection?.id, {
      skip: !currentSection?.id,
      refetchOnMountOrArgChange: false,
    });

  // Initialize first assessment
  useEffect(() => {
    if (assessmentsFetched && allAssessments.length > 0 && !currentAssessment) {
      setCurrentAssessment(allAssessments[0]);
    }
  }, [assessmentsFetched, allAssessments, currentAssessment]);

  // Initialize first section when sections change
  useEffect(() => {
    if (sectionsFetched && allSections.length > 0) {
      setCurrentSection(allSections[0]);
    }
  }, [sectionsFetched, allSections]);

  // Reset form when assessment changes
  useEffect(() => {
    reset(); // clear all previous answers
  }, [currentAssessment, reset]);

  useEffect(() => {
    if (currentAssessment) {
      setCurrentSection(null); // clear section first
    }
  }, [currentAssessment]);

  const assessmentItems = useMemo(
    () =>
      allAssessments.map((assessment) => ({
        value: assessment.id ?? assessment.assessmentId,
        label:
          assessment.assessment_type ??
          assessment.name ??
          String(assessment.id ?? assessment.assessmentId ?? "Unknown"),
        ...assessment,
      })),
    [allAssessments]
  );

  const onSubmit = async (data) => {
    console.log("Submitting assessment:", currentAssessment);
    console.log("Form data:", data);

    // Transform responses object into array of objects
    const responsesArray = Object.entries(data.responses).map(
      ([question_id, answer_text]) => ({
        question_id,
        answer_text,
      })
    );

    const payload = responsesArray;

    console.log("FORMATTED PAYLOAD", payload);

    try {
      const out = await submitResponses({
        assessmentId: currentAssessment?.id,
        payload,
      }).unwrap();
      console.log("OUTPUT OF SUBMIT RES", out);
    } catch (error) {
      console.error("Error in submitting response", error);
      toast.error("Error in submitting response");
    }
  };

  return (
    <Card className="border-none shadow-none figaro flex flex-col h-full">
      <CardHeader className="flex w-full py-0">
        <div className="flex gap-2 items-center justify-between">
          <div className="w-80 min-w-0">
            {assessmentsFetched && assessmentItems.length > 0 && (
              <Combobox
                items={assessmentItems}
                selectedValue={currentAssessment?.id}
                onSelect={(value) => {
                  const assessment = allAssessments.find(
                    (a) =>
                      String(a.id) === String(value) ||
                      String(a.assessmentId) === String(value)
                  );
                  setCurrentAssessment(assessment);
                  setCurrentSection(null); // clear section for new assessment
                  reset(); // clear previous answers
                }}
                placeholder="Select an assessment"
                shouldFilter={true}
              />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto pt-2 scrollbar-thin">
        <TooltipProvider>
          <form
            id="assessment_sub_form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col h-full"
          >
            {sectionsFetched && allSections.length > 0 ? (
              <Accordion type="single" collapsible>
                {allSections.map((section, idx) => (
                  <AccordionItem
                    value={`${currentAssessment?.id}-${section.id}`}
                    key={`${currentAssessment?.id}-${section.id}`}
                    className={`${
                      idx % 2 === 0
                        ? "bg-card text-card-foreground"
                        : "bg-muted text-muted-foreground"
                    } rounded-md px-10`}
                  >
                    <AccordionTrigger
                      onClick={() => {
                        if (currentSection?.id !== section.id) {
                          setCurrentSection(section);
                        }
                      }}
                    >
                      {section.title}
                    </AccordionTrigger>

                    <AccordionContent className="flex flex-col gap-4 text-balance">
                      {currentSection &&
                      currentSection.id === section.id &&
                      sectionQsFetched &&
                      Array.isArray(sectionQuestions) ? (
                        <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-1/2">
                          {sectionQuestions.map((q, idx) => (
                            <Label
                              htmlFor={q.id}
                              key={q.id}
                              className="flex flex-col gap-2 pb-4"
                            >
                              <span className="flex gap-2">
                                <strong>{idx + 1}.</strong>
                                {q.question_text}
                              </span>
                              <Tooltip open={!!errors?.questions?.[q.id]}>
                                <TooltipTrigger asChild>
                                  <Textarea
                                    id={q.id}
                                    placeholder={q.placeholder ?? "Answer"}
                                    {...register(`responses.${q.id}`, {
                                      required: "Every Question is required",
                                    })}
                                  />
                                </TooltipTrigger>
                                <TooltipContent side="right" align="start">
                                  {errors?.questions?.[q.id]?.message}
                                </TooltipContent>
                              </Tooltip>
                            </Label>
                          ))}
                        </div>
                      ) : currentSection && currentSection.id === section.id ? (
                        <p>Loading questions...</p>
                      ) : null}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-lg text-center p-4 border-2">
                No Questionnaire available for this assessment. We will add them
                soon
              </p>
            )}
          </form>
        </TooltipProvider>
      </CardContent>

      <CardFooter className="border-t pt-2 pb-0">
        <Button
          type="submit"
          form="assessment_sub_form"
          className={`w-full ${
            !currentSection || !sectionQsFetched ? "hover:cursor-crosshair" : ""
          }`}
          disabled={!currentSection || !sectionQsFetched} // prevent submission if questions not loaded
        >
          Submit
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PreAssessmentSubmission;
