import React, { useEffect, useState } from "react";
import { usePatchChecklistMutation } from "../store/checklistsApiSlice";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const EditChecklist = ({ checklist, open, onClose }) => {
  const [updateChecklist] = usePatchChecklistMutation();
  const [editChecklistData, setEditChecklistData] = useState({
    checklistId: "",
    checklistType: "",
    priority: 1, // default value
  });

  useEffect(() => {
    if (checklist) {
      setEditChecklistData({
        checklistId: checklist.checklistId ?? "", // match your API's id field
        checklistType: checklist.checklistType ?? "",
        priority: checklist.priority ?? 1,
      });
    }
  }, [checklist]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogTrigger asChild>Edit Checklist</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Checklist</DialogTitle>
        </DialogHeader>
        <DialogDescription asChild>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await updateChecklist({
                  checklistId: editChecklistData.checklistId,
                  payload: {
                    checklist_type: editChecklistData.checklistType,
                    priority: editChecklistData.priority,
                  },
                }).unwrap();
                toast.success("Checklist updated successfully");
                onClose();
              } catch (err) {
                console.error("Failed to update checklist:", err);
                toast.error("Failed to update checklist");
              }
            }}
          >
            <div>
              <Label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Checklist Name
              </Label>
              <Input
                type="text"
                value={editChecklistData.checklistType}
                onChange={(e) =>
                  setEditChecklistData({
                    ...editChecklistData,
                    checklistType: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <DialogClose asChild>
              <Button type="button" variant="destructive">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Save</Button>
          </form>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

export default EditChecklist;
