import { useForm } from "react-hook-form";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useEffect, useState, useMemo } from "react";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useSelector } from "react-redux";
import {
  useDeleteDraftsMutation,
  useGetDraftsQuery,
  useSaveDraftMutation,
} from "../store/draftsApiSlice";

import AdminAction from "./AdminAction";
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
  const { data: draftData } = useGetDraftsQuery(assessment?.id, {
    skip: isReadOnly || !assessment?.id,
  });

  // Convert subResponses to RHF format
  const defaultResponses = useMemo(() => {
    return subResponses.reduce((acc, curr) => {
      acc[curr.question_id] = curr.answer_text ?? "";
      return acc;
    }, {});
  }, [subResponses]);

  // Create form instance
  const form = useForm({
    defaultValues: { responses: defaultResponses },
    shouldFocusError: true,
    mode: "onSubmit",
    shouldUnregister: false,
  });

  const { control, handleSubmit, reset, getValues, formState } = form;
  const { errors } = formState;

  // Load draft data
  useEffect(() => {
    if (draftData?.responses?.length > 0) {
      const formatted = draftData.responses.reduce((acc, curr) => {
        acc[curr.question_id] = curr.answer_text ?? "";
        return acc;
      }, {});
      reset({ responses: formatted });
      toast.info("Loaded responses from draft");
    }
  }, [draftData, reset]);

  useEffect(() => {
    if (errors) {
      console.log("ERRORS,❌❌❌❌", errors.responses);
    }
  }, [errors]);

  // Handle form submission
  const onFormSubmit = handleSubmit(
    (data) => {
      if (isReadOnly) return;

      const formatted = Object.entries(data.responses).map(([id, text]) => ({
        question_id: id,
        answer_text: text,
      }));

      onSubmit?.({ assessmentId: assessment.id, responses: formatted });
    },
    (formErrors) => {
      // Validation failed
      const erroredIds = Object.keys(formErrors.responses || {});
      if (erroredIds.length > 0) {
        const erroredSections = questionnaire
          .filter((section) =>
            section.questions.some((q) => erroredIds.includes(q.id))
          )
          .map((s) => `${s.section.id}`);

        setOpenSections((prev) =>
          Array.from(new Set([...prev, ...erroredSections]))
        );

        // Optionally scroll to first error
        const el = document.getElementById(erroredIds[0]);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus();
        }
      }

      toast.error("Please fill all required fields.");
    }
  );

  // Handle draft save
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

  // Handle error-based section expansion
  const [openSections, setOpenSections] = useState([]);
  const [validationAttempt, setValidationAttempt] = useState(0);

  useEffect(() => {
    const erroredIds = Object.keys(errors.responses || {});
    if (erroredIds.length === 0) return;

    const erroredSection = questionnaire.find((section) =>
      section.questions.some((q) => erroredIds.includes(q.id))
    );

    if (!erroredSection) return;

    const sectionId = `${erroredSection.section.id}`;
    setOpenSections((prev) =>
      prev.includes(sectionId) ? prev : [...prev, sectionId]
    );

    const el = document.getElementById(erroredIds[0]);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
      }, 100);
    }
  }, [errors, questionnaire, validationAttempt]);

  return (
    <Card className="border-none flex flex-1 flex-col h-full max-h-[80vh] mt-2">
      <ScrollArea className="flex-1 overflow-y-auto">
        <CardContent>
          <TooltipProvider>
            <Form {...form}>
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
                    value={openSections}
                    onValueChange={setOpenSections}
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

                        <AccordionContent
                          className="flex flex-col gap-4"
                          forceMount
                        >
                          {section.questions.map((q, qIdx) => (
                            <FormField
                              key={q.id}
                              control={control}
                              name={`responses.${q.id}`}
                              rules={{
                                required: "This field is required",
                              }}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel
                                    htmlFor={q.id}
                                    className="flex flex-col gap-2 pb-2"
                                  >
                                    <span className="flex gap-2">
                                      <strong>{qIdx + 1}.</strong>
                                      {q.question_text}
                                      <span className="text-red-600">*</span>
                                    </span>
                                  </FormLabel>

                                  <Tooltip open={!!errors?.responses?.[q.id]}>
                                    <TooltipTrigger asChild>
                                      <FormControl>
                                        <Textarea
                                          id={q.id}
                                          placeholder={
                                            q.placeholder ?? "Answer"
                                          }
                                          {...field}
                                          readOnly={isReadOnly}
                                        />
                                      </FormControl>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" align="start">
                                      {errors?.responses?.[q.id]?.message}
                                    </TooltipContent>
                                  </Tooltip>

                                  <FormMessage />
                                </FormItem>
                              )}
                            />
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
            </Form>
          </TooltipProvider>
        </CardContent>
      </ScrollArea>

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
