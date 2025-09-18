import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cn } from "@/lib/utils";

import { ChevronDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef(
  (
    { className, showActions = false, onEdit, onDelete, actionItems, ...props },
    ref
  ) => {
    return (
      <AccordionPrimitive.Item
        ref={ref}
        className={cn("border-b", className)}
        {...props}
      >
        <div className="relative flex items-center w-full">
          <div className="flex-1">{props.children}</div>

          {/* Actions dropdown */}
          {showActions && (onEdit || onDelete || actionItems?.length > 0) && (
            <div className="ml-2 flex-shrink-0">
              <DropdownMenu>
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
                  {onEdit && (
                    <DropdownMenuItem
                      className="border-b"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(props);
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 border-b"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(props);
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  )}
                  {actionItems &&
                    actionItems.map((action, idx) => (
                      <DropdownMenuItem
                        key={idx}
                        className={`${action.className} ${
                          idx + 1 < actionItems.length ? "border-b" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick?.(props.section);
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

        {/* Accordion Content is rendered naturally below */}
        {props.children?.props?.children && (
          <div className="mt-1">{props.children.props.children}</div>
        )}
      </AccordionPrimitive.Item>
    );
  }
);
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
);
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Content
      ref={ref}
      className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
);
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
