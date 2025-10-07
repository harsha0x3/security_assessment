import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
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

export const ChecklistMiniCard = ({ checklist }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800";
      case "in-progress":
      case "inprogress":
        return "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800";
      case "approved":
        return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
      case "rejected":
        return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
      default:
        return "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return (
          <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
        );
      case "rejected":
        return <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />;
      case "in-progress":
      case "inprogress":
        return <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />;
      case "pending":
        return <Clock className="h-3 w-3 text-amber-700 dark:text-amber-500" />;
      default:
        return (
          <Circle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
        );
    }
  };
  return (
    <Accordion
      type="multiple"
      className={`p-2 rounded-md ${getStatusColor(
        checklist.status
      )} border mb-1.5 hover:shadow-sm transition-shadow`}
    >
      <AccordionItem
        value={checklist.id}
        className="data-[state=open]:border-amber-600
          not-last:data-[state=open]:border-b-2
          dark:data-[state=open]:border-amber-400"
      >
        <AccordionTrigger
          value={checklist.id}
          className="data-[state=open]:border-amber-600
          not-last:data-[state=open]:border-b-2
          dark:data-[state=open]:border-amber-400"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium truncate flex-1">
              {checklist.checklist_type}
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="capitalize">{checklist.status}</span>
              {getStatusIcon(checklist.status)}
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground">
          <p>Assigned Users:</p>
          <ul>
            {checklist.assigned_users &&
              checklist.assigned_users.length > 0 &&
              checklist.assigned_users.map((user) => (
                <li key={user?.id}>{user.username}</li>
              ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
