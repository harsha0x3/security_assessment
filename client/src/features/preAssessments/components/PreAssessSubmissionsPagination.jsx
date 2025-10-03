import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import React from "react";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { usePreAssessment } from "../hooks/usePreAssessment";

const PreAssessSubmissionsPagination = () => {
  const { preAssessPage, totalPreAssessments, preAssessPageSize, goToPage } =
    usePreAssessment();

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink
            aria-label="Go to first page"
            size="icon"
            className="rounded-full"
            onClick={() => goToPage(1)}
          >
            <ChevronFirstIcon className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            aria-label="Go to previous page"
            size="icon"
            className="rounded-full"
            onClick={() => {
              if (preAssessPage <= 1) return;
              goToPage(preAssessPage - 1);
            }}
            disabled={preAssessPage <= 1}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <Select
            value={String(preAssessPage)}
            aria-label="Select page"
            onValueChange={(value) => goToPage(Number(value))}
          >
            <SelectTrigger
              id="select-page"
              className="w-fit whitespace-nowrap"
              aria-label="Select page"
            >
              <SelectValue placeholder="Select page" />
            </SelectTrigger>
            <SelectContent>
              {Array.from(
                {
                  length: Math.ceil(totalPreAssessments / preAssessPageSize),
                },
                (_, i) => i + 1
              ).map((page) => (
                <SelectItem key={page} value={String(page)}>
                  Page {page}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            onClick={() => {
              if (
                preAssessPage ===
                Math.ceil(totalPreAssessments / preAssessPageSize)
              )
                return;
              goToPage(preAssessPage + 1);
            }}
            disabled={
              preAssessPage ===
              Math.ceil(totalPreAssessments / preAssessPageSize)
            }
            aria-label="Go to next page"
            size="icon"
            className="rounded-full"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            onClick={() =>
              goToPage(Math.ceil(totalPreAssessments / preAssessPageSize))
            }
            aria-label="Go to last page"
            size="icon"
            className="rounded-full"
          >
            <ChevronLastIcon className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default PreAssessSubmissionsPagination;
