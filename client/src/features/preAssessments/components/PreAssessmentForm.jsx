import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardFooter } from "@/components/ui/Card";
import { useEffect, useState, useMemo, useCallback } from "react";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useSelector } from "react-redux";
import {
  useDeleteDraftsMutation,
  useGetDraftsQuery,
  useSaveDraftMutation,
} from "../store/draftsApiSlice";

import AdminAction from "./AdminAction";
import { debounce, isEqual, values } from "lodash";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
const PreAssessmentForm = ({
  assessment,
  questionnaire = [],
  subResponses = [],
  onSubmit,
  submissionId = null,
}) => {
  const isReadOnly = subResponses.length > 0;
  const currentUser = useSelector(selectAuth);
  const [saveDraft] = useSaveDraftMutation();
  const { data: draftData, refetch: refetchDraft } = useGetDraftsQuery(
    assessment?.id,
    {
      skip: isReadOnly || !assessment?.id,
    }
  );

  // Convert subResponses to RHF format (always strings)
  const defaultResponses = useMemo(() => {
    return subResponses.reduce((acc, curr) => {
      acc[curr.question_id] = curr.answer_text ?? "";
      return acc;
    }, {});
  }, [subResponses]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: { responses: defaultResponses },
    shouldFocusError: true,
  });

  // Populate form with draftData
  useEffect(() => {
    if (draftData?.responses.length > 0) {
      const formatted = draftData.responses.reduce((acc, curr) => {
        acc[curr.question_id] = curr.answer_text ?? "";
        return acc;
      }, {});
      reset({ responses: formatted });
      toast.info("Loaded responses from draft");
    }
  }, [draftData, reset]);

  const onFormSubmit = handleSubmit((data) => {
    if (isReadOnly) return;

    const formatted = Object.entries(data.responses).map(([id, text]) => ({
      question_id: id,
      answer_text: text,
    }));

    onSubmit?.({ assessmentId: assessment.id, responses: formatted });
  });

  const handleSaveDraft = async () => {
    const values = getValues("responses");
    const payload = Object.entries(values).map(([id, text]) => ({
      question_id: id,
      answer_text: text,
    }));

    try {
      await saveDraft({
        assessmentId: assessment.id,
        payload: { responses: payload },
      });
      toast.success("Draft saved successfully");
    } catch (err) {
      console.error(err);
      toast.error("Error saving draft");
    }
  };

  useEffect(() => {
    console.log("ERROESIN FORM SATE", errors.responses);
  }, [errors]);

  return (
    <Card className="border-none flex flex-1 flex-col h-full max-h-[80vh] mt-2">
      {/* Scrollable area */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <CardContent>
          <TooltipProvider>
            <form
              id="assessment_sub_form"
              onSubmit={onFormSubmit}
              className="flex flex-col gap-4"
            >
              {questionnaire.length > 0 ? (
                <Accordion
                  type="multiple"
                  collapsible
                  forceMount
                  className="flex flex-col gap-4"
                >
                  {questionnaire.map((section, idx) => (
                    <AccordionItem
                      key={section.section.id}
                      value={section.section.id}
                      className={`${
                        idx % 2 === 0 ? "bg-accent/40" : ""
                      } p-1 rounded-md`}
                    >
                      <AccordionTrigger>
                        {section.section.title}
                      </AccordionTrigger>
                      <AccordionContent className="flex flex-col gap-4">
                        {section.questions.map((q, idx) => (
                          <Label
                            htmlFor={q.id}
                            key={q.id}
                            className="flex flex-col gap-2 pb-4"
                          >
                            <span className="flex gap-2">
                              <strong>{idx + 1}.</strong>
                              {q.question_text}
                              <span className="text-red-600">*</span>
                            </span>
                            <Tooltip open={!!errors?.responses?.[q.id]}>
                              <TooltipTrigger asChild>
                                <Textarea
                                  id={q.id}
                                  placeholder={q.placeholder ?? "Answer"}
                                  {...register(`responses.${q.id}`, {
                                    required: "This field is Required",
                                  })}
                                  readOnly={isReadOnly}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="right" align="start">
                                {errors?.responses?.[q.id]?.message}
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-lg text-center p-4 border-2">
                  No Questionnaire available for this assessment.
                </p>
              )}
            </form>
          </TooltipProvider>
        </CardContent>
      </ScrollArea>

      {/* Footer stays pinned */}
      <CardFooter className="flex-shrink-0 border-t">
        {!isReadOnly && (
          <div className="flex gap-3 w-full">
            <Button type="submit" form="assessment_sub_form" className="flex-1">
              Submit
            </Button>
            <Button
              onClick={handleSaveDraft}
              variant="outline"
              className="flex-1"
            >
              Save Draft
            </Button>
          </div>
        )}
        {isReadOnly && currentUser.role === "admin" && (
          <AdminAction submissionId={submissionId} currentUser={currentUser} />
        )}
      </CardFooter>
    </Card>
  );
};

export default PreAssessmentForm;
