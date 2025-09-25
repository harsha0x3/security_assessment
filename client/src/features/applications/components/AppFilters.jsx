import React from "react";
import { useApplications } from "../hooks/useApplications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SlidersHorizontalIcon } from "lucide-react";

const AppFilters = () => {
  const {
    currentApp,
    appPage,
    appPageSize,
    appSortBy,
    appSortOrder,
    appSearch,
    goToPage,
    updateSearchParams,
  } = useApplications();

  const validSearchBys = [
    { name: "Name" },
    { platform: "Platform" },
    { region: "Region" },
    { owner_name: "Owner Name" },
    { provider_name: "Provider Name" },
    { department: "Department" },
  ];

  const validSortBys = [
    { updated_at: "Updated Date" },
    { name: "Name" },
    { created_at: "Created Date" },
    { priority: "Priority" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="px-1">
          <SlidersHorizontalIcon /> Filters
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>App Filters</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Search By</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {validSearchBys.map((item, idx) => {
                  const [val, label] = Object.entries(item)[0];
                  return (
                    <DropdownMenuItem
                      key={idx}
                      data-value={val}
                      onClick={() => updateSearchParams({ appSearchBy: val })}
                    >
                      {label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          {/* Sort Order filters*/}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Sort order</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  data-value="asc"
                  onClick={() =>
                    updateSearchParams({ appSortOrder: "asc", appPage: 1 })
                  }
                >
                  Ascending
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-value="desc"
                  onClick={() =>
                    updateSearchParams({ appSortOrder: "desc", appPage: 1 })
                  }
                >
                  Descending
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          {/* Sort By filters*/}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Sort By</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {validSortBys.map((item, idx) => {
                  const [val, label] = Object.entries(item)[0];
                  return (
                    <DropdownMenuItem
                      key={idx}
                      data-value={val}
                      onClick={() =>
                        updateSearchParams({ appSortBy: val, appPage: 1 })
                      }
                    >
                      {label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AppFilters;
