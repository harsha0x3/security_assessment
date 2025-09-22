import * as React from "react";
import { Check, ChevronsUpDown, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Props:
 *  - items: [{ value, label }]
 *  - selectedValue: selected item value (controlled)
 *  - onSelect(value)
 *  - placeHolder
 *  - onSearchValueChange (optional)
 *  - searchValue (optional controlled search)
 *  - shouldFilter (default true) - whether the combobox should filter results by query
 *  - className (optional) - additional classes for the container
 *  - showActions (optional) - whether to show action menu for items
 *  - onEdit (optional) - callback for edit action
 *  - onDelete (optional) - callback for delete action
 *  - actionItems (optional) - custom action items array
 */
export function Combobox({
  items = [],
  selectedValue,
  onSelect,
  placeHolder = "Select an option...",
  onSearchValueChange,
  searchValue,
  shouldFilter = true,
  className,
  showActions = false,
  onEdit,
  onDelete,
  actionItems,
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState(searchValue ?? "");
  const [localSelected, setLocalSelected] = React.useState(
    selectedValue ?? null
  );
  const [dropdownOpen, setDropdownOpen] = React.useState(null);

  // keep localSelected in sync with controlled selectedValue
  React.useEffect(() => {
    if (selectedValue !== undefined) setLocalSelected(selectedValue);
  }, [selectedValue]);

  // sync external searchValue prop (if parent controls it)
  React.useEffect(() => {
    if (searchValue !== undefined) setQuery(searchValue);
  }, [searchValue]);

  const handleSearchChange = (val) => {
    setQuery(val);
    if (typeof onSearchValueChange === "function") onSearchValueChange(val);
  };

  const handleSelect = (val) => {
    setLocalSelected(val);
    if (typeof onSelect === "function") onSelect(val);
    setOpen(false);
    setQuery(""); // clear search after select
  };

  const handleEdit = (item, e) => {
    e.stopPropagation();
    setDropdownOpen(null);
    if (onEdit) onEdit(item);
  };

  const handleDelete = (item, e) => {
    e.stopPropagation();
    setDropdownOpen(null);
    if (onDelete) onDelete(item);
  };

  // client side filtering for predictable behavior
  const filteredItems = React.useMemo(() => {
    if (!shouldFilter || !query) return items;
    const q = String(query).toLowerCase();
    return items.filter(
      (it) =>
        String(it.label || "")
          .toLowerCase()
          .includes(q) ||
        String(it.value || "")
          .toLowerCase()
          .includes(q)
    );
  }, [items, query, shouldFilter]);

  const selectedLabel =
    items.find((it) => String(it.value) === String(localSelected))?.label ??
    null;

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between min-w-0"
          >
            <span className="truncate flex-1 text-left">
              {selectedLabel || placeHolder}
            </span>
            <ChevronsUpDown className="opacity-50 ml-2 flex-shrink-0" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="p-0 w-full"
          style={{ width: "var(--radix-popover-trigger-width)" }}
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search..."
              className="h-9"
              value={query}
              onValueChange={handleSearchChange}
              autoComplete="off"
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {filteredItems.map((item) => (
                  <div key={String(item.value)} className="relative">
                    <CommandItem
                      value={item.value}
                      onSelect={(currentValue) => handleSelect(currentValue)}
                      className={cn(
                        "cursor-pointer",
                        showActions ? "pr-8" : ""
                      )}
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            String(localSelected) === String(item.value)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <span className="truncate flex-1">{item.label}</span>
                      </div>
                    </CommandItem>

                    {showActions && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <DropdownMenu
                          open={dropdownOpen === item.value}
                          onOpenChange={(open) =>
                            setDropdownOpen(open ? item.value : null)
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
                            <DropdownMenuSeparator />

                            {/* Default actions */}
                            {onEdit && (
                              <DropdownMenuItem
                                onClick={(e) => handleEdit(item, e)}
                              >
                                Edit
                              </DropdownMenuItem>
                            )}

                            {onDelete && (
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={(e) => handleDelete(item, e)}
                              >
                                Delete
                              </DropdownMenuItem>
                            )}

                            {/* Custom action items */}
                            {actionItems &&
                              actionItems.map((action, index) => (
                                <DropdownMenuItem
                                  key={index}
                                  className={action.className}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDropdownOpen(null);
                                    action.onClick(item);
                                  }}
                                >
                                  {action.icon && (
                                    <action.icon className="mr-2 h-4 w-4" />
                                  )}
                                  {action.label}
                                </DropdownMenuItem>
                              ))}
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
