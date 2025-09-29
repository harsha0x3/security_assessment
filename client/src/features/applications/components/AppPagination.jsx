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
import { useApplications } from "../hooks/useApplications";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";

const AppPagination = () => {
  const { appPage, goToPage, totalApps, appPageSize } = useApplications();

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
              if (appPage <= 1) return;
              goToPage(appPage - 1);
            }}
            disabled={appPage <= 1}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <Select
            value={String(appPage)}
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
                { length: Math.ceil(Math.ceil(totalApps / appPageSize)) },
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
              if (appPage === Math.ceil(totalApps / appPageSize)) return;
              goToPage(appPage + 1);
            }}
            disabled={appPage === Math.ceil(totalApps / appPageSize)}
            aria-label="Go to next page"
            size="icon"
            className="rounded-full"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            onClick={() => goToPage(Math.ceil(totalApps / appPageSize))}
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

export default AppPagination;
