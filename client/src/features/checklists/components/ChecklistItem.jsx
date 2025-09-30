import React from "react";

const ChecklistItem = ({ checklist }) => {
  return (
    <div className="border rounded-md flex overflow-hidden">
      <div className="w-1/10 border-r bg-red-400 p-2"></div>
      <div className="w-9/10 p-2">
        <p className="capitalize font-medium">{checklist?.checklist_type}</p>
        <div className="flex justify-between text-sm text-muted-foreground">
          <p title="Created At">
            {new Date(checklist.created_at + "Z").toLocaleDateString()}
          </p>
          <p title="updated At">
            {new Date(checklist.updated_at + "Z").toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChecklistItem;
