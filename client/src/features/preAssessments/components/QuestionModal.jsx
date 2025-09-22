import { useAddQuestionsMutation } from "@/features/preAssessments/store/preAssessmentApiSlice";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect } from "react";
import { toast } from "react-toastify";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { Textarea } from "../../../components/ui/textarea";

const QuestionsDialogForm = ({
  open,
  onOpenChange,
  editData = null,
  onSuccess,
  section = null,
}) => {
  const isEditing = Boolean(editData);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: isEditing
      ? { question_text: editData?.question_text || "" }
      : { questions: [{ question_text: "" }] },
  });

  // only used when adding new questions
  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
    shouldUnregister: true,
  });

  const [addQs, { isLoading: addingQ }] = useAddQuestionsMutation();

  const isLoading = addingQ;

  const onSubmit = async (data) => {
    try {
      if (isEditing) {
        // For editing → single question
        console.log("Editing question", data);
        // you’ll probably call update mutation here
        // await updateQuestion({ id: editData.id, ...data }).unwrap();
      } else {
        if (!section) {
          toast.error("section missing");
          return;
        }
        // For adding → multiple questions
        const res = await addQs({
          payload: data.questions, // array of questions
          sectionId: section?.id,
        }).unwrap();

        console.log("Adding questions:", data.questions);
        console.log("Adding questionsOUT:::::", res);
      }

      reset(
        isEditing
          ? { question_text: editData?.question_text || "" }
          : { questions: [{ question_text: "" }] }
      );

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(`Error: ${error?.data?.detail || "Something went wrong"}`);
      console.error("Error submitting questions:", error);
    }
  };

  const handleClose = () => {
    reset(
      isEditing
        ? { question_text: editData?.question_text || "" }
        : { questions: [{ question_text: "" }] }
    );
    onOpenChange(false);
  };

  useEffect(() => {
    if (editData) {
      reset({ question_text: editData?.question_text || "" });
    } else {
      reset({ questions: [{ question_text: "" }] });
    }
  }, [editData, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Question" : "Add New Questions"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the question details below."
              : `Fill in the details to create new questions for section: ${section?.title} (id ${section?.id}).`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <TooltipProvider>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {isEditing ? (
                // -------- Editing single question --------
                <div className="space-y-2">
                  <Label htmlFor="question_text">Question Text *</Label>
                  <Tooltip open={!!errors.question_text}>
                    <TooltipTrigger asChild>
                      <Textarea
                        id="question_text"
                        placeholder="Enter question text"
                        {...register("question_text", {
                          required: "Question text is required",
                        })}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="right" align="start">
                      {errors.question_text?.message}
                    </TooltipContent>
                  </Tooltip>
                </div>
              ) : (
                // -------- Adding multiple questions --------
                <>
                  {fields.map((field, index) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={`questions.${index}.question_text`}>
                        Question {index + 1} *
                      </Label>
                      <Tooltip
                        open={!!errors?.questions?.[index]?.question_text}
                      >
                        <TooltipTrigger asChild>
                          <Textarea
                            id={`questions.${index}.question_text`}
                            placeholder="Enter question text"
                            {...register(`questions.${index}.question_text`, {
                              required: "Question text is required",
                            })}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="right" align="start">
                          {errors?.questions?.[index]?.question_text?.message}
                        </TooltipContent>
                      </Tooltip>

                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ question_text: "" })}
                  >
                    + Add Another Question
                  </Button>
                </>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading
                    ? isEditing
                      ? "Updating..."
                      : "Creating..."
                    : isEditing
                    ? "Update"
                    : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </TooltipProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionsDialogForm;
