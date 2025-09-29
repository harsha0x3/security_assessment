import * as React from "react";
import {
  Check,
  ChevronsUpDown,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Star,
  CheckCircle,
  CheckCircle2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function ChecklistCombobox({
  checklists,
  selectedChecklistId,
  onSelect,
  onEdit,
  onDelete,
  onAssignUsers,
  placeHolder = "Select a checklist...",
  onSearchValueChange,
  searchValue,
  isAdmin = false,
}) {
  const [open, setOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(null);

  const selectedChecklist = checklists?.find(
    (checklist) => checklist?.id === selectedChecklistId
  );

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1:
        return "text-green-600";
      case 2:
        return "text-blue-600";
      case 3:
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1:
        return "Low";
      case 2:
        return "Medium";
      case 3:
        return "High";
      default:
        return "Unknown";
    }
  };

  const handleEdit = (checklist, e) => {
    e.stopPropagation();
    setDropdownOpen(null);
    onEdit(checklist);
  };

  const handleDelete = (checklistId, e) => {
    e.stopPropagation();
    setDropdownOpen(null);
    onDelete(checklistId);
  };

  const handleAssignUsers = (checklistId, e) => {
    e.stopPropagation();
    setDropdownOpen(null);
    onAssignUsers(checklistId);
  };

  return (
    <div className="flex w-full flex-col space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between p-5"
          >
            {selectedChecklist ? (
              <div className="flex items-center space-x-2 flex-1 truncate">
                <span className="truncate">
                  {selectedChecklist.checklist_type}
                </span>
                <Star
                  className={`w-4 h-4 shrink-0 ${getPriorityColor(
                    selectedChecklist.priority
                  )}`}
                  fill="currentColor"
                />
                {selectedChecklist.is_completed && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded shrink-0">
                    Completed
                  </span>
                )}
              </div>
            ) : (
              <span className="flex-1 truncate text-left">{placeHolder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-2 min-w-sm" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search checklists..."
              className="h-9"
              value={searchValue || ""}
              onValueChange={(val) => onSearchValueChange?.(val)}
            />
            <CommandList>
              <CommandEmpty>No checklists found.</CommandEmpty>
              <CommandGroup>
                {checklists?.map((checklist) => (
                  <div key={checklist.id} className="relative">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <CommandItem
                          key={checklist.id}
                          value={checklist.id}
                          onSelect={() => {
                            onSelect(checklist);
                            setOpen(false);
                          }}
                          className={`flex items-center justify-between pr-8 border mb-1 py-2 last:mb-0 ${
                            selectedChecklistId === checklist.id
                              ? "border-l-primary border-l-5"
                              : ""
                          }`}
                        >
                          <div className="flex items-center space-x-2 flex-1">
                            <CheckCircle2Icon
                              className={`mr-2 h-4 w-4 text-green-500 ${
                                checklist.is_completed
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            <span className="truncate">
                              {checklist.checklist_type}
                            </span>
                            <Star
                              className={`w-4 h-4 ${getPriorityColor(
                                checklist.priority
                              )}`}
                              fill="currentColor"
                              title={`${getPriorityLabel(
                                checklist.priority
                              )} Priority`}
                            />
                            {/* {checklist.is_completed && (
                              <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                                <CheckCircle />
                              </span>
                            )} */}
                          </div>
                        </CommandItem>
                      </HoverCardTrigger>
                      <HoverCardContent>
                        <h3>{checklist.checklist_type}</h3>
                        <p>priority: {getPriorityLabel(checklist.priority)}</p>
                      </HoverCardContent>
                    </HoverCard>

                    {isAdmin && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <DropdownMenu
                          open={dropdownOpen === checklist.id}
                          onOpenChange={(open) =>
                            setDropdownOpen(open ? checklist.id : null)
                          }
                        >
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                onClick={(e) =>
                                  handleAssignUsers(checklist.id, e)
                                }
                              >
                                <Users className="mr-2 h-4 w-4" />
                                Assign Users
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => handleEdit(checklist, e)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={(e) => handleDelete(checklist.id, e)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
