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
import { selectAuth } from "@/features/auth/store/authSlice";
import { useSelector } from "react-redux";

import { useChecklists } from "../hooks/useChecklists";

const ChecklistFilters = () => {
  const { updateSearchParams } = useChecklists();
  const userInfo = useSelector(selectAuth);

  const validSearchBys = [
    { checklist_type: "Name" },
    { priority: "priority" },
    { is_completed: "Completed" },
    // ...(userInfo && userInfo.role === "admin"
    //   ? [{ assigned_users: "Assigned Users" }]
    //   : []),
  ];

  const validSortBys = [
    { updated_at: "Updated Date" },
    { checklist_type: "Name" },
    { created_at: "Created Date" },
    // { priority: "Priority" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="px-1">
          <SlidersHorizontalIcon /> Filters
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Checklist Filters</DropdownMenuLabel>
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
                      onClick={() => updateSearchParams({ cListSearchBy: val })}
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
                    updateSearchParams({
                      cListSortOrder: "asc",
                      cListPage: 1,
                    })
                  }
                >
                  Ascending
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-value="desc"
                  onClick={() =>
                    updateSearchParams({
                      cListSortOrder: "desc",
                      cListPage: 1,
                    })
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
                        updateSearchParams({
                          cListSortBy: val,
                          cListPage: 1,
                        })
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

export default ChecklistFilters;
