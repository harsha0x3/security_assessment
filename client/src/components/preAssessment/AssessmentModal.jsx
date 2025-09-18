import { useCreateAssessmentMutation } from "@/store/apiSlices/preAssessmentApiSlice";
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

const AssessmentDialogForm = ({
  open,
  onOpenChange,
  editData = null,
  onSuccess,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: editData || {
      assessment_type: "",
      description: "",
    },
  });
  const [addAssessment, { isLoading: addingAssessment, isError }] =
    useCreateAssessmentMutation();

  const isEditing = Boolean(editData);
  const isLoading = addingAssessment;

  const onSubmit = async (payload) => {
    try {
      console.log("DATA IN USE FORM", payload);

      if (isEditing) {
        // await updateAssessment({
        //   id: editData.id,
        //   payload,
        // }).unwrap();
        console.log("Updating data");
      } else {
        await addAssessment({ payload }).unwrap();
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting assessment:", error);
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
        assessment_type: "",
        description: "",
      });
    }
  }, [editData, reset]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Assessment" : "Create Assessment"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the assessment details below."
              : "Fill in the details to create a new assessment."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assessment_type">Assessment Name *</Label>
            <Input
              id="assessment_type"
              placeHolder="Enter assessment name"
              {...register("assessment_type", {
                required: "Assessment name is required",
              })}
            />
            {errors.assessment_type && (
              <p className="text-sm text-red-500">
                {errors.assessment_type.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeHolder="Enter description (optional)"
              {...register("description")}
            />
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
      </DialogContent>
    </Dialog>
  );
};

export default AssessmentDialogForm;
