import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import AppPagination from "./AppPagination";

export function AppsCombobox({
  items,
  selectedValue,
  onSelect,
  placeHolder = "Select an option...",
  onSearchValueChange,
  searchValue,
}) {
  const [open, setOpen] = React.useState(false);

  const selectedLabel = items.find(
    (item) => item.value === selectedValue
  )?.label;

  const handleSelect = (itemValue) => {
    // Find the actual item to make sure we're passing the correct value
    const selectedItem = items.find((item) => item.value === itemValue);
    if (selectedItem) {
      onSelect(selectedItem.value);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between p-5"
        >
          <span
            className={cn(
              "truncate",
              !selectedValue && "text-muted-foreground"
            )}
          >
            {selectedLabel || placeHolder}
          </span>
          <ChevronsUpDown
            size={16}
            className="text-muted-foreground/80 shrink-0"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="border-input w-full p-2 min-w-sm"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search..."
            className="h-9"
            value={searchValue || ""}
            onValueChange={(val) => onSearchValueChange(val)}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup className="">
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={() => handleSelect(item.value)}
                  className={`border mb-1 p-3 last:mb-0 ${
                    selectedValue === item.value
                      ? "border-l-primary border-l-5"
                      : ""
                  }`}
                >
                  {item.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      selectedValue === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <AppPagination />
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
