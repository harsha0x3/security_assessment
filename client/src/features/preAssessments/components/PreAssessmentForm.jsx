import { useForm } from "react-hook-form";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { Card, CardContent, CardFooter } from "../../../components/ui/Card";
import { useEffect, useState, useMemo } from "react";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useSelector } from "react-redux";

import AdminAction from "./AdminAction";

const PreAssessmentForm = ({
  assessment,
  questionnaire = [],
  subResponses = [], // if provided => read-only mode
  onSubmit,
  submissionId = null,
}) => {
  const isReadOnly = subResponses && subResponses.length > 0;
  const currentUser = useSelector(selectAuth);

  const responses = useMemo(() => {
    return subResponses.reduce((acc, curr) => {
      acc[curr.question_id] = curr.answer_text;
      return acc;
    }, {});
  }, [subResponses]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { responses },
  });

  const [currentSection, setCurrentSection] = useState(null);

  useEffect(() => {
    if (assessment) {
      reset({ responses });
      setCurrentSection(null);
    }
  }, [assessment?.id, responses, reset]);

  return (
    <Card className="border-none shadow-none flex flex-col h-full">
      <CardContent className="flex-1 overflow-y-auto pt-2 scrollbar-thin">
        <TooltipProvider>
          <form
            id="assessment_sub_form"
            onSubmit={handleSubmit((data) => {
              if (isReadOnly) return;
              const formatted = Object.entries(data.responses || {}).map(
                ([question_id, answer_text]) => ({
                  question_id,
                  answer_text,
                })
              );
              onSubmit?.({
                assessmentId: assessment?.id,
                responses: formatted,
              });
            })}
            className="flex flex-col h-full"
          >
            {questionnaire?.length > 0 ? (
              <Accordion type="single" collapsible>
                {questionnaire.map((qItem, idx) => (
                  <AccordionItem
                    value={`${assessment?.id}-${qItem?.section?.id}`}
                    key={`${assessment?.id}-${qItem?.section.id}`}
                    className={`${
                      idx % 2 === 0
                        ? "bg-card text-card-foreground"
                        : "bg-muted text-muted-foreground"
                    } rounded-md px-10`}
                  >
                    <AccordionTrigger
                      onClick={() => setCurrentSection(qItem?.section)}
                    >
                      {qItem?.section.title}
                    </AccordionTrigger>

                    <AccordionContent className="flex flex-col gap-4 text-balance">
                      {currentSection?.id === qItem?.section.id &&
                      Array.isArray(qItem?.questions) ? (
                        <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-1/2">
                          {qItem.questions.map((q, idx) => (
                            <Label
                              htmlFor={q.id}
                              key={q.id}
                              className="flex flex-col gap-2 pb-4"
                            >
                              <span className="flex gap-2">
                                <strong>{idx + 1}.</strong>
                                {q.question_text}
                              </span>

                              {isReadOnly ? (
                                <Textarea
                                  id={q.id}
                                  value={responses?.[q.id] ?? ""}
                                  readOnly
                                  className="bg-muted/40"
                                />
                              ) : (
                                <Tooltip open={!!errors?.responses?.[q.id]}>
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
                                    {errors?.responses?.[q.id]?.message}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </Label>
                          ))}
                        </div>
                      ) : null}
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

      {!isReadOnly && (
        <CardFooter className="border-t pt-2 pb-0">
          <Button
            type="submit"
            form="assessment_sub_form"
            className="w-full"
            disabled={!assessment || questionnaire.length === 0}
          >
            Submit
          </Button>
        </CardFooter>
      )}
      {isReadOnly && currentUser.role === "admin" && (
        <AdminAction submissionId={submissionId} currentUser={currentUser} />
      )}
    </Card>
  );
};

export default PreAssessmentForm;
