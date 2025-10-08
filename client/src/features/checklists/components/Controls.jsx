import { useParams } from "react-router-dom";
import {
  useAddControlMutation,
  useUpdateControlsMutation,
} from "../store/controlsApiSlice";
import {
  useSubmitChecklistMutation,
  useEvaluateChecklistMutation,
} from "../store/checklistsApiSlice";
import { useSaveResponseMutation } from "../store/responsesApiSlice";
import { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectAuth } from "../../auth/store/authSlice";
import { downloadFile } from "@/utils/downloadFile";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
} from "@tanstack/react-table";
import { selectCurrentChecklist } from "../store/checklistsSlice";
import {
  Save,
  X,
  Settings,
  Shredder,
  Info,
  FileSpreadsheetIcon,
  AlertTriangle,
  PlusIcon,
  ChevronFirstIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronLastIcon,
} from "lucide-react";
import { Tooltip } from "react-tooltip";
import ImportControls from "./ImportControls";
import UploadControls from "./UploadControls";
import ImportResponsesDialog from "./ImportResponses";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useControlsNResponses } from "@/features/checklists/hooks/useControlsNResponses";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ScrollAreaScrollbar,
  ScrollAreaViewport,
} from "@radix-ui/react-scroll-area";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const Controls = () => {
  const isProd = import.meta.env.VITE_PROD_ENV === "true";
  const [editAll, setEditAll] = useState(false);
  const [saving, setSaving] = useState(false);

  const apiBaseUrl = isProd
    ? "http://10.160.14.76:8060"
    : "http://localhost:8000";

  const userInfo = useSelector(selectAuth);
  const { checklistId } = useParams();
  const {
    controlsPage,
    controlsPageSize,
    goToPage: goToControlsPage,
    updateSearchParams,
    data: allControls,
  } = useControlsNResponses(checklistId);
  const [sorting, setSorting] = useState([]);

  const [saveResponse] = useSaveResponseMutation();
  const [submitChecklist, { isLoading: isSubmittingChecklist }] =
    useSubmitChecklistMutation();
  const [evaluateChecklist, { isLoading: isEvaluating }] =
    useEvaluateChecklistMutation();
  const [addControl] = useAddControlMutation();
  const [updateControl] = useUpdateControlsMutation();
  const [editingControlId, setEditingControlId] = useState(null);
  const [adding, setAdding] = useState(false);
  const currentChecklist = useSelector(selectCurrentChecklist);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [checklistEvaluationStatus, setChecklistEvaluationStatus] =
    useState("");
  const [checklistEvaluationComment, setChecklistEvaluationComment] =
    useState("");

  // react-hook-form for editing responses
  const {
    control,
    register: registerRes,
    handleSubmit,
    reset: resetRes,
  } = useForm({
    defaultValues: {
      responses:
        allControls?.list_controls?.map((c) => ({
          control_id: c.control_id,
          current_setting: c.current_setting || "",
          review_comment: c.review_comment || "",
          evidence_file: null,
          remove_evidence: false,
          response_id: c.response_id ?? null,
        })) || [],
    },
  });

  const onSubmitAll = async (data) => {
    setSaving(true);
    try {
      toast.promise(
        (async () => {
          console.log("DATA>RESPONSES", data);

          let processed = 0; // track how many responses we saved

          for (const r of data.responses) {
            if (
              !(r.current_setting || r.review_comment || r.evidence_file?.[0])
            ) {
              continue;
            }

            const form = new FormData();
            form.append("current_setting", r.current_setting);
            form.append("review_comment", r.review_comment);
            if (r.evidence_file?.[0])
              form.append("evidence_file", r.evidence_file[0]);
            if (r.remove_evidence) form.append("remove_evidence", "true");

            await saveResponse({
              controlId: r.control_id,
              payload: form,
              responseId: r.response_id,
            }).unwrap();

            processed++;
          }

          if (processed === 0) {
            return "No responses to save"; // <- explicit return for empty case
          }

          setEditAll(false);
          resetRes(data);
          return "All responses saved"; // <- explicit return for processed case
        })(),
        {
          loading: "Saving responses...",
          success: (msg) => msg, // show returned message
          error: "Failed to save responses...",
        }
      );
    } catch (err) {
      toast.error("Failed to save responses", {
        description: JSON.stringify(err),
      });
      console.error("Failed to save responses:", err);
    }
    setSaving(false);
    setEditAll(false);
  };

  // react-hook-form for editing controls
  const {
    register: registerEditControl,
    handleSubmit: handleEditControlSubmit,
    reset: resetEditControl,
  } = useForm({
    defaultValues: {
      control_area: "",
      severity: "",
      control_text: "",
      description: "",
    },
  });

  // react-hook-form for adding controls
  const {
    register: registerAddControl,
    handleSubmit: handleAddControlSubmit,
    reset: resetAddControl,
  } = useForm({
    defaultValues: {
      control_area: "",
      severity: "",
      control_text: "",
      description: "",
    },
  });

  // Edit existing response

  // Edit existing control
  const handleEditControl = (controlId, rowData) => {
    setEditingControlId(controlId);
    resetEditControl({
      control_area: rowData.control_area || "",
      severity: rowData.severity || "",
      control_text: rowData.control_text || "",
      description: rowData.description || "",
    });
  };

  const handleCancelEditControl = () => {
    setEditingControlId(null);
    resetEditControl();
  };

  // Update existing control
  const onSubmitUpdateControl = async (formData, controlId) => {
    const payload = {
      control_area: formData.control_area,
      severity: formData.severity,
      control_text: formData.control_text,
      description: formData.description,
    };

    try {
      await updateControl({ payload, controlId }).unwrap();
      setEditingControlId(null);
      resetEditControl();
    } catch (err) {
      console.error("Failed to update control:", err);
    }
  };

  const handleExport = () => {
    downloadFile(
      `${apiBaseUrl}/checklists/${checklistId}/controls-responses/export`,
      `controls-${checklistId}.csv`
    );
  };

  // Add new control
  const onSubmitAddControl = async (data) => {
    try {
      await addControl({ payload: data, checklistId }).unwrap();
      resetAddControl();
      setAdding(false);
    } catch (err) {
      console.error("Failed to add control:", err);
    }
  };

  const totalControlsPages =
    Math.ceil(allControls?.total_counts?.total_controls / controlsPageSize) ||
    1;

  const total_controls = useMemo(
    () => allControls?.total_counts?.total_controls || 0,
    [allControls]
  );
  const total_responses = useMemo(
    () => allControls?.total_counts?.total_responses || 0,
    [allControls]
  );

  const progress = useMemo(
    () => Math.ceil((total_responses / total_controls) * 100 || 0),
    [total_controls, total_responses]
  );

  const submitChecklistFinal = async () => {
    try {
      toast.promise(
        (async () => {
          await submitChecklist(checklistId).unwrap();
        })(),
        {
          loading: "Submitting the checklist...",
          success: "Submitted the checklist", // show returned message
          error: "Failed to submit the checklist",
        }
      );
    } catch (error) {
      toast.error("Error submitting checklist", {
        description: error?.data?.detail,
      });
    }
  };
  console.log("PROGRESS DETAILS", total_responses, total_controls, progress);

  // ✅ stable columns
  const columns = useMemo(
    () => [
      {
        accessorKey: "control_area",
        header: "Control Area",
        minSize: 50, // minimum width
        maxSize: 150,
        // enableSorting: true,
        cell: ({ row }) => {
          const controlId = row.original.control_id;
          return editingControlId === controlId ? (
            <Input
              className="border rounded p-1 text-sm w-full"
              {...registerEditControl("control_area")}
            />
          ) : (
            row.original.control_area || "-"
          );
        },
      },
      {
        accessorKey: "severity",
        header: "Severity",
        minSize: 70, // minimum width
        maxSize: 100,
        // enableSorting: false,
        cell: ({ row }) => {
          const controlId = row.original.control_id;
          return editingControlId === controlId ? (
            <div className="relative w-full">
              <select
                {...registerEditControl("severity")}
                className="block appearance-none w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Severity</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              {/* Arrow icon */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg
                  className="h-4 w-4 text-muted-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          ) : (
            <span
              className={`px-2 py-1 rounded-full text-xs max-w-2 font-medium ${
                row.original.severity === "Critical"
                  ? "bg-red-100 text-red-800"
                  : row.original.severity === "High"
                  ? "bg-orange-100 text-orange-800"
                  : row.original.severity === "Medium"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {row.original.severity || "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "control_text",
        header: "Control Text",
        minSize: 300,
        maxSize: 600,

        cell: ({ row }) => {
          const controlId = row.original.control_id;
          return editingControlId === controlId ? (
            <Textarea
              className="min-h-[80px]"
              {...registerEditControl("control_text")}
            />
          ) : (
            <Textarea
              className="border-none shadow-none min-h-[80px]"
              title={row.original.control_text}
              value={row.original.control_text || "-"}
              readOnly
            />
          );
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        minSize: 400,
        maxSize: 700,
        cell: ({ row }) => {
          const controlId = row.original.control_id;
          return editingControlId === controlId ? (
            <Textarea
              className="min-h-[80px]"
              {...registerEditControl("description")}
            />
          ) : (
            <Textarea
              className="border-none shadow-none min-h-[80px] resize-none"
              title={row.original.description}
              value={row.original.description || "-"}
              readOnly
            />
          );
        },
      },
      {
        accessorKey: "current_setting",
        header: "Current Setting",
        minSize: 300,
        maxSize: 600,
        cell: ({ row }) => {
          const idx = row.index;
          return editAll ? (
            <Textarea
              className=""
              {...registerRes(`responses.${idx}.current_setting`)}
            />
          ) : (
            <Textarea
              className="border-none shadow-none"
              title={row.original.current_setting}
              value={row.original.current_setting || "-"}
              readOnly
            />
          );
        },
      },
      {
        accessorKey: "review_comment",
        header: "Review Comment",
        minSize: 300,
        maxSize: 600,
        cell: ({ row }) => {
          const idx = row.index;
          return editAll ? (
            <Textarea {...registerRes(`responses.${idx}.review_comment`)} />
          ) : (
            <Textarea
              className="border-none shadow-none"
              title={row.original.review_comment}
              value={row.original.review_comment || "-"}
              readOnly
            />
          );
        },
      },
      {
        accessorKey: "evidence_path",
        header: "Evidence",
        minSize: 70,
        maxSize: 120,
        cell: ({ row }) => {
          const evidencePath = row.original.evidence_path;
          const idx = row.index;

          if (editAll) {
            return (
              <>
                <div className="flex flex-col gap-2">
                  {evidencePath && (
                    <div className="flex items-center gap-2">
                      <a
                        href={`${apiBaseUrl}/${evidencePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        Current File
                      </a>
                      <button
                        className="text-red-600 text-xs underline flex"
                        disabled={!evidencePath}
                        onClick={() => {
                          resetRes((prev) => {
                            const newRes = [...prev];
                            newRes[idx].evidence_file = null;
                            newRes[idx].remove_evidence = true;
                          });
                        }}
                      >
                        <span>Remove</span>
                        <span>
                          <Shredder className="text-red-600" />
                        </span>
                      </button>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  className="border rounded px-2 py-1 text-sm w-full"
                  {...registerRes(`responses.${idx}.evidence_file`)}
                />
              </>
            );
          }

          return evidencePath ? (
            <a
              href={`http://localhost:8000/uploads/${evidencePath}`} // prepend backend URL
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              View Evidence
            </a>
          ) : (
            "-"
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        minSize: 70,
        maxSize: 120,
        cell: ({ row }) => {
          const controlId = row.original.control_id;
          const editingControl = editingControlId === controlId;
          console.log("DATE", row.original.control_created_at);
          const tooltipContent = `
Control Created: ${
            row.original.control_created_at
              ? new Date(row.original.control_created_at + "Z").toLocaleString()
              : "N/A"
          }
Control Updated: ${
            row.original.control_updated_at
              ? new Date(row.original.control_updated_at + "Z").toLocaleString()
              : "N/A"
          }
Response Created: ${
            row.original.response_created_at
              ? new Date(
                  row.original.response_created_at + "Z"
                ).toLocaleString()
              : "N/A"
          }
Response Updated: ${
            row.original.response_updated_at
              ? new Date(
                  row.original.response_updated_at + "Z"
                ).toLocaleString()
              : "N/A"
          }
`;

          return (
            <div className="flex gap-2 items-center">
              {/* Control editing actions (Admin only) */}
              {userInfo.role === "admin" && (
                <>
                  {editingControl ? (
                    <>
                      <Save
                        className="w-5 h-5 text-purple-600 cursor-pointer hover:text-purple-700"
                        data-tooltip-id={`save-control-tooltip-${controlId}`}
                        onClick={handleEditControlSubmit((data) =>
                          onSubmitUpdateControl(data, controlId)
                        )}
                      />
                      <X
                        className="w-5 h-5 text-red-600 cursor-pointer hover:text-red-700"
                        data-tooltip-id={`cancel-control-tooltip-${controlId}`}
                        onClick={handleCancelEditControl}
                      />
                      <Tooltip
                        id={`save-control-tooltip-${controlId}`}
                        place="top"
                        content="Save Control"
                      />
                      <Tooltip
                        id={`cancel-control-tooltip-${controlId}`}
                        place="top"
                        content="Cancel"
                      />
                    </>
                  ) : (
                    <Settings
                      className="w-5 h-5 text-purple-600 cursor-pointer hover:text-purple-700"
                      data-tooltip-id={`edit-control-tooltip-${controlId}`}
                      onClick={() => handleEditControl(controlId, row.original)}
                    />
                  )}
                </>
              )}

              {userInfo.role === "admin" && !editingControl && (
                <Tooltip
                  id={`edit-control-tooltip-${controlId}`}
                  place="top"
                  content="Edit Control"
                />
              )}
              {/* Info icon with tooltip */}
              <Info
                className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700"
                data-tooltip-id={`info-tooltip-${controlId}`}
              />
              <Tooltip
                id={`info-tooltip-${controlId}`}
                place="top"
                className="max-w-xs whitespace-pre-wrap text-xs p-2 rounded-md shadow"
                content={tooltipContent}
              />
            </div>
          );
        },
      },
    ],
    [editingControlId, userInfo, editAll]
  );

  const handleSortingChange = (newSorting) => {
    console.log("GOT NEW SORTING", newSorting);
    console.log("GOT NEW SORTING Len", newSorting.length);
    console.log(
      "GOT NEW SORTING stringified",
      JSON.stringify(newSorting, null, 2)
    );

    setSorting(newSorting);
    if (newSorting.length > 0 && newSorting[0]) {
      console.log("GOT NEW SORTING 0000", newSorting[0]);

      const sort = newSorting[0];
      updateSearchParams({
        controlsSortBy: sort.id ?? sort.columnId,
        controlsSortOrder: sort.desc ? "desc" : "asc",
        controlsPage: 1, // Reset to first page when sorting changes
      });
    }
  };

  useEffect(() => {
    if (sorting.length >= 1) {
      console.log("SORTING", sorting);
      const controlsSortBy = sorting[0].id;
      const controlsSortOrder = sorting[0].desc ? "desc" : "asc";
      updateSearchParams({ controlsSortBy, controlsSortOrder });
    }
  }, [sorting]);

  useEffect(() => {
    if (allControls?.list_controls?.length) {
      resetRes({
        responses: allControls.list_controls.map((c) => ({
          control_id: c.control_id,
          current_setting: c.current_setting || "",
          review_comment: c.review_comment || "",
          evidence_file: null,
          remove_evidence: false,
          response_id: c.response_id || null,
        })),
      });
    }
  }, [allControls, resetRes]);

  const table = useReactTable({
    data: allControls?.list_controls || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",

    manualSorting: true,

    state: {
      sorting,
    },

    onSortingChange: setSorting,
  });
  const AddControlsComp = () => {
    return (
      <div>
        <form onSubmit={handleAddControlSubmit(onSubmitAddControl)}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <Input
              type="text"
              placeholder="Control Area"
              {...registerAddControl("control_area", { required: true })}
            />
            <div className="relative w-full">
              <select
                {...registerAddControl("severity")}
                className="block appearance-none w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Severity</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              {/* Arrow icon */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg
                  className="h-4 w-4 text-muted-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <Textarea
              placeholder="Control Text"
              {...registerAddControl("control_text", { required: true })}
            />
            <Textarea
              placeholder="Description"
              {...registerAddControl("description", { required: true })}
            />
          </div>
          <div className="flex justify-center gap-3 mt-1">
            <Button type="submit" variant="">
              Save Control
            </Button>
            <Button
              type="button"
              onClick={() => {
                setAdding(false);
                resetAddControl();
              }}
              variant="destructive"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  };

  // Table Rendering Component

  const RenderTable = () => {
    return (
      <Table
        className={`table-fixed ${
          editAll ? "ring-green-500 border-amber-500" : ""
        }`}
        style={{
          width: table.getCenterTotalSize(),
        }}
      >
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="text-ring">
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="group/head relative h-10 select-none last:[&>.cursor-col-resize]:opacity-0 text-ring text-md font-semibold"
                  {...{
                    colSpan: header.colSpan,
                    style: {
                      width: header.getSize(),
                    },
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  {header.column.getCanResize() && (
                    <div
                      {...{
                        onDoubleClick: () => header.column.resetSize(),
                        onMouseDown: header.getResizeHandler(),
                        onTouchStart: header.getResizeHandler(),
                        className:
                          "group-last/head:hidden absolute top-0 h-full w-4 cursor-col-resize user-select-none touch-none -right-2 z-10 flex justify-center before:absolute before:w-px before:inset-y-0 before:bg-border before:translate-x-px",
                      }}
                    />
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.original.control_id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  };

  const ControlsPagination = () => {
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink
              aria-label="Go to first page"
              size="icon"
              className="rounded-full"
              onClick={() => goToControlsPage(1)}
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
                if (controlsPage <= 1) return;
                goToControlsPage(controlsPage - 1);
              }}
              disabled={controlsPage <= 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <Select
              value={String(controlsPage)}
              aria-label="Select page"
              onValueChange={(value) => goToControlsPage(Number(value))}
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
                    length: totalControlsPages,
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
                if (controlsPage === totalControlsPages) return;
                goToControlsPage(controlsPage + 1);
              }}
              disabled={controlsPage === totalControlsPages}
              aria-label="Go to next page"
              size="icon"
              className="rounded-full"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              onClick={() => goToControlsPage(totalControlsPages)}
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

  console.log("!@#$%$#@!!CHK ID#@!$%^", checklistId);

  if (!checklistId || checklistId === "undefined")
    return <p>No Checklist Selected</p>;
  if (!allControls?.list_controls?.length)
    return (
      <Card className="flex-1 h-full flex flex-col items-center">
        <CardHeader className="items-center">
          <CardTitle>No Controls Found for this checklist</CardTitle>
          <CardDescription>
            {userInfo.role === "admin"
              ? "Add the first control"
              : "Controls for this checklist will be added soon."}
          </CardDescription>
          <CardContent>
            <Settings fill="" className="w-20 h-20 mx-auto mb-4" />
            {userInfo.role === "admin" && adding ? (
              <AddControlsComp />
            ) : (
              <div>
                <div className="flex gap-3 items-center justify-center">
                  <Button onClick={() => setAdding(true)}>
                    <PlusIcon className="w-5 h-5" /> Add First Control
                  </Button>
                  <ImportControls targetChecklistId={checklistId} />
                  <UploadControls checklistId={checklistId} />
                </div>
              </div>
            )}
          </CardContent>
        </CardHeader>
      </Card>
    );

  return (
    <TooltipProvider>
      <Card className="flex-1 h-full flex flex-col ">
        <CardHeader className="flex flex-row shrink-0 justify-between items-center p-2 bg-muted rounded-t-lg">
          <CardTitle>
            Controls for Checklist - {currentChecklist?.checklistType}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div>
              {editAll ? (
                <div className="flex items-center">
                  <span className="px-5 flex gap-2">
                    <AlertTriangle className="text-amber-400" />
                    <span>You are editing all responses</span>
                  </span>
                  <Button onClick={handleSubmit(onSubmitAll)} disabled={saving}>
                    {saving ? "Saving..." : "Save All"}
                  </Button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Export</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExport}>
                      <FileSpreadsheetIcon className="mr-2 h-4 w-4" />
                      Download as csv
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <ImportResponsesDialog checklistId={checklistId} />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Just drop the absolute/relative wrappers */}

            <div>
              <div
                className="group inline-flex items-center gap-2"
                data-state={editAll ? "checked" : "unchecked"}
              >
                {editAll && (
                  <span
                    id={`edit-app-yes`}
                    className="group-data-[state=checked]:text-muted-foreground/70 cursor-pointer text-right text-sm font-medium"
                    aria-controls="edit-app"
                    onClick={() => {
                      setShowCancelDialog(true);
                    }}
                  >
                    Cancel
                  </span>
                )}

                <Switch
                  id="edit-app"
                  checked={editAll}
                  onCheckedChange={() => {
                    if (editAll) {
                      setShowCancelDialog(true);
                    } else {
                      setEditAll(true);
                    }
                  }}
                  aria-labelledby={`edit-app-yes edit-app-no`}
                  className="focus-visible:border-ring-green-600 dark:focus-visible:border-ring-green-400 focus-visible:ring-green-600/20 data-[state=checked]:bg-green-600 dark:focus-visible:ring-green-400/40 dark:data-[state=checked]:bg-green-400"
                />

                <span
                  id={`edit-app-no`}
                  className="group-data-[state=unchecked]:text-muted-foreground/70 cursor-pointer text-left text-sm font-medium"
                  aria-controls="edit-app"
                  onClick={() => setEditAll(true)}
                >
                  Edit
                </span>

                <Dialog
                  open={showCancelDialog}
                  onOpenChange={setShowCancelDialog}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        Do You Want to Cancel all your changes
                      </DialogTitle>
                    </DialogHeader>
                    <DialogDescription asChild>
                      <div>
                        <p>You will loose all your changes if not saved</p>
                        <div className="flex gap-3">
                          <Button
                            variant="destructive"
                            onClick={() => {
                              setEditAll(false);
                              setShowCancelDialog(false);
                            }}
                          >
                            Yes
                          </Button>
                          <DialogClose asChild>
                            <Button>Keep Editing</Button>
                          </DialogClose>
                        </div>
                      </div>
                    </DialogDescription>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardHeader>
        <ScrollArea className="h-full w-full">
          <ScrollAreaViewport className="w-max">
            <CardContent className="p-0">
              <RenderTable />
              {userInfo.role === "admin" && adding && <AddControlsComp />}
            </CardContent>
          </ScrollAreaViewport>
          <ScrollBar orientation="vertical" />
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <CardFooter className="p-1 bg-muted rounded-b-lg flex flex-row gap-3 justify-between items-center">
          <div className="flex flex-row gap-3 justify-between items-center">
            <Button
              disabled={total_controls !== total_responses || adding}
              onClick={submitChecklistFinal}
            >
              Submit
            </Button>
            {userInfo.role === "admin" && !adding && (
              <div className="flex gap-2">
                <Button onClick={() => setAdding(true)}>Add Control</Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="secondary"
                      disabled={
                        total_controls !== total_responses ||
                        currentChecklist.isCompleted
                      }
                    >
                      Evaluate checklist
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Evaluate checklist </DialogTitle>
                    </DialogHeader>
                    <DialogDescription asChild>
                      <div>
                        <p>
                          Evalute the checklist based on the responses fro
                          controls.
                        </p>
                        <div className="border p-4">
                          <RadioGroup
                            className="flex"
                            value={checklistEvaluationStatus}
                            onValueChange={(value) =>
                              setChecklistEvaluationStatus(value)
                            }
                          >
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value="approved" id="approve_" />
                              <Label htmlFor="approve_">Approve</Label>
                            </div>
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value="rejected" id="reject_" />
                              <Label htmlFor="reject_">Reject</Label>
                            </div>
                          </RadioGroup>
                          <div className="mt-2">
                            <Label htmlFor="checklistEvaluateComment">
                              Comments
                            </Label>
                            <Textarea
                              placeholder="Write comments for your evaluation"
                              value={checklistEvaluationComment}
                              onChange={(e) =>
                                setChecklistEvaluationComment(e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </DialogDescription>
                    <DialogFooter>
                      <div className="flex gap-2 ites-center jsutify-center">
                        <Button
                          onClick={async () => {
                            try {
                              toast.promise(
                                (async () => {
                                  const payload = {
                                    status: checklistEvaluationStatus,
                                    comment: checklistEvaluationComment,
                                  };
                                  await evaluateChecklist({
                                    checklistId: checklistId,
                                    payload: payload,
                                  });
                                  setChecklistEvaluationComment("");
                                  setChecklistEvaluationStatus("");
                                })(),
                                {
                                  loading: "Evaluating..",
                                  success: "Checklist Evaluated successfully",
                                  error: "Error Evaluating the checklist",
                                }
                              );
                            } catch (error) {
                              console.error("ERROR EVALUATING", error);
                            }
                          }}
                          disabled={isEvaluating || !checklistEvaluationStatus}
                        >
                          Submit
                        </Button>
                        <DialogClose asChild>
                          <Button variant>Cancel</Button>
                        </DialogClose>
                      </div>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
          <ControlsPagination />
          <div className="flex items-center gap-2 w-[250px]">
            {/* Progress bar container */}
            <div className="bg-background rounded-lg h-2 flex-1">
              <div
                className="bg-primary h-2 rounded-lg"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Totals text */}
            <span className="text-sm font-medium">
              {total_responses} / {total_controls}
            </span>
          </div>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
};

export default Controls;
