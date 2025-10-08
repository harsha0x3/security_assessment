import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import { useAddChecklistMutation } from "../store/checklistsApiSlice";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AddChecklist = ({ appId }) => {
  const [checklistType, setChecklistType] = useState("");
  const [customChecklist, setCustomChecklist] = useState("");
  const [addChecklist, { isLoading: isAdding }] = useAddChecklistMutation();

  const handleAddChecklist = async (e) => {
    e.preventDefault();
    const finalType =
      checklistType === "Other" ? customChecklist : checklistType;

    try {
      toast.promise(
        (async () => {
          const payload = {
            checklist_type: finalType,
          };
          await addChecklist({
            appId: appId,
            payload,
          }).unwrap();

          // reset
          setChecklistType("");
          setCustomChecklist("");
        })(),
        {
          loading: "Creating the Checklist..",
          success: "Checklist created successfully",
          error: "Failed to create hte checklist",
        }
      );
    } catch (err) {
      console.error("Failed to add checklist:", err);
    }
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>New Checklist</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Checklist prr</DialogTitle>
        </DialogHeader>
        <DialogDescription asChild>
          <form onSubmit={handleAddChecklist} className="space-y-4">
            <div>
              <Label>Checklist Type</Label>
              <select
                value={checklistType}
                onChange={(e) => setChecklistType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">-- Select Type --</option>
                <option value="Checklist Infra">Checklist Infra</option>
                <option value="Checklist AppSec">Checklist AppSec</option>
                <option value="Checklist for IAM">Checklist for IAM</option>
                <option value="AI application checklist">
                  AI application checklist
                </option>
                <option value="Other">Other</option>
              </select>
            </div>

            {checklistType === "Other" && (
              <div>
                <Label>Custom Checklist Name</Label>
                <input
                  type="text"
                  value={customChecklist}
                  onChange={(e) => setCustomChecklist(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter custom checklist name"
                  required
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    setChecklistType("");
                    setCustomChecklist("");
                  }}
                >
                  Cancel
                </Button>
              </DialogClose>

              <Button type="submit" disabled={isAdding}>
                {isAdding ? "Adding..." : "Add Checklist"}
              </Button>
            </div>
          </form>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

export default AddChecklist;
