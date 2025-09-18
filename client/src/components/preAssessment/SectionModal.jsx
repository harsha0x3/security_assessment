import { useCreateSectionMutation } from "@/store/apiSlices/preAssessmentApiSlice";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
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
} from "../ui/tooltip";

const SectionDialogForm = ({
  open,
  onOpenChange,
  editData = null,
  onSuccess,
  assessment = null,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: editData || {
      title: "",
    },
  });
  const [addSection, { isLoading: addingSection, isError }] =
    useCreateSectionMutation();

  const isEditing = Boolean(editData);
  const isLoading = addingSection;

  const onSubmit = async (payload) => {
    try {
      if (isEditing) {
        console.log("IN Section editing", payload);
      } else {
        if (!assessment) {
          toast.error("Assessment ID missing");
          return;
        }
        await addSection({
          payload,
          assessmentId: assessment ? assessment.id : undefined,
        }).unwrap();
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(`Error in submitting section ${error?.data?.detail}`);
      console.error("Error submitting section:", error);
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  useEffect(() => {
    if (editData) {
      reset(editData);
    } else {
      reset({
        title: "",
      });
    }
  }, [editData, reset]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? `Edit Section`
              : `Add New Section for assessment ${assessment?.assessment_type}`}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the Section details below."
              : "Fill in the details to create a new section."}
          </DialogDescription>
        </DialogHeader>
        <TooltipProvider>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assessment_type">Assessment Name *</Label>
              <Tooltip open={!!errors.title}>
                <TooltipTrigger asChild>
                  <Input
                    id="title"
                    placeholder="Enter Section name"
                    {...register("title", {
                      required: "Section name is required",
                    })}
                  />
                </TooltipTrigger>
                <TooltipContent side="right" align="start">
                  {errors.title?.message}
                </TooltipContent>
              </Tooltip>
            </div>
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
      </DialogContent>
    </Dialog>
  );
};

export default SectionDialogForm;
