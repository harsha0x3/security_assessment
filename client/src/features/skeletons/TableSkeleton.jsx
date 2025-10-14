import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const TableSkeleton = ({ cols = 4, rows = 10 }) => {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      return (
        <div>
          <Skeleton className="h-10 w-50" />
        </div>
      );
    }
  }
};

export default TableSkeleton;
