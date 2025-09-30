import { Skeleton } from "@/components/ui/skeleton";

import React from "react";

export const ChecklistSkeleton = () => {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-20 w-full rounded-md" />
    </div>
  );
};

export const ControlsSkeleton = () => {
  return (
    <div className="mt-3">
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
};
