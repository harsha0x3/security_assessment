import { useParams } from "react-router-dom";
import {
  useAddControlMutation,
  useUpdateControlsMutation,
} from "../store/controlsApiSlice";
import { useSubmitChecklistMutation } from "../store/checklistsApiSlice";
import { useSaveResponseMutation } from "../store/responsesApiSlice";
import { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectAuth } from "../../auth/store/authSlice";
import { downloadFile } from "@/utils/downloadFile";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { selectCurrentChecklist } from "../store/checklistsSlice";
import {
  Save,
  Edit3,
  X,
  Plus,
  Settings,
  Shredder,
  Upload,
  Info,
  ImportIcon,
  Ellipsis,
  FileSpreadsheetIcon,
  DownloadIcon,
  UploadIcon,
  XIcon,
  AlertTriangle,
} from "lucide-react";
import { Tooltip } from "react-tooltip";
import { useFieldArray, useForm } from "react-hook-form";
import Modal from "../../../components/ui/Modal";
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

const Controls = () => {
  const isProd = import.meta.env.VITE_PROD_ENV === "true";
  const [editAll, setEditAll] = useState(false);
  const [saving, setSaving] = useState(false);

  const apiBaseUrl = isProd
    ? "http://10.160.14.76:8060"
    : "http://127.0.0.1:8000";

  const user = useSelector(selectAuth);
  const { checklistId } = useParams();
  const {
    controlsPage,
    controlsPageSize,
    controlsSortBy,
    controlsSortOrder,
    isError,
    error,
    goToPage: goToControlsPage,
    updateSearchParams,
    data: allControls,
  } = useControlsNResponses(checklistId);
  const [sorting, setSorting] = useState([]);

  const [submitChecklistMutation] = useSubmitChecklistMutation();

  const [saveResponse] = useSaveResponseMutation();
  const [addControl] = useAddControlMutation();
  const [updateControl] = useUpdateControlsMutation();

  const [editingRowId, setEditingRowId] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showImportResponsesModal, setShowImportResponsesModal] =
    useState(false);
  const [editingControlId, setEditingControlId] = useState(null);
  const [adding, setAdding] = useState(false);
  const currentChecklist = useSelector(selectCurrentChecklist);

  // react-hook-form for editing responses
  const {
    control,
    register: registerRes,
    handleSubmit,
    reset: resetRes,
    watch,
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

  const { fields } = useFieldArray({
    control,
    name: "responses",
  });
  const onSubmitAll = async (data) => {
    setSaving(true);
    try {
      toast.promise(
        (async () => {
          console.log("DATA>RESPONSES", data);
          for (const r of data.responses) {
            console.log(":::::SOMETHING r IN DATA", r);
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
          }

          setEditAll(false);
          resetRes(data);
          return "All responses saved";
        })(),
        {
          loading: "Saving responses...",
          success: "Responses saved successfully!",
          error: "Failed to save responses",
        }
      );
    } catch (err) {
      toast.error("Failed to save responses", {
        description: JSON.stringify(err),
      });
      console.error("Failed to save responses:", err);
    }
    setSaving(false);
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
    register: registerAdd,
    handleSubmit: handleAddSubmit,
    reset: resetAdd,
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
      description: "",
    });
  };

  const handleCancelEditControl = () => {
    setEditingControlId(null);
    resetEditControl();
  };

  const getVisiblePageNumbers = (current, total) => {
    const delta = 1; // show ±2 pages around current
    const range = [];
    const rangeWithDots = [];
    let lastPage;

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      ) {
        range.push(i);
      }
    }

    for (let page of range) {
      if (lastPage) {
        if (page - lastPage === 2) {
          rangeWithDots.push(lastPage + 1);
        } else if (page - lastPage > 2) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(page);
      lastPage = page;
    }

    return rangeWithDots;
  };

  const onSubmitResponse = async (formData, controlId) => {
    const form = new FormData();
    form.append("current_setting", formData.current_setting);
    form.append("review_comment", formData.review_comment);
    if (formData.evidence_file && formData.evidence_file[0]) {
      form.append("evidence_file", formData.evidence_file[0]);
    }

    if (formData.remove_evidence) {
      form.append("remove_evidence", "true");
    }

    const controlData = allControls?.list_controls?.find(
      (c) => c.control_id === controlId
    );
    const responseId = controlData?.response_id;

    try {
      await saveResponse({ controlId, payload: form, responseId }).unwrap();
      setEditingRowId(null);
      resetRes();
    } catch (err) {
      console.error("Failed to save response:", err);
    }
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
      resetAdd();
      setAdding(false);
    } catch (err) {
      console.error("Failed to add control:", err);
    }
  };

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
            <select
              className="border rounded p-1 text-sm max-w-2"
              {...registerEditControl("severity")}
            >
              <option value="">Select Severity</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
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
          return editingRowId === controlId ? (
            <Textarea
              className="min-h-[80px]"
              {...registerAdd("description")}
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
          const controlId = row.original.control_id;
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
          const controlId = row.original.control_id;
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
          const controlId = row.original.control_id;
          const evidencePath = row.original.evidence_path;
          const idx = row.index;

          if (editAll) {
            return (
              <>
                <div className="flex felx-col gap-2">
                  {evidencePath && (
                    <div className="flex items-center gap-2">
                      <a
                        href={`http://localhost:8000/uploads/${evidencePath}`}
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
          const editingResponse = editingRowId === controlId;
          const editingControl = editingControlId === controlId;
          console.log("DATE", row.original.control_created_at);
          const tooltipContent = `
      Control Created: ${new Date(
        row.original.control_created_at + "Z"
      ).toLocaleString()}
      Control Updated: ${new Date(
        row.original.control_updated_at + "Z"
      ).toLocaleString()}
      Response Created: ${
        row.original.response_created_at + "Z"
          ? new Date(row.original.response_created_at + "Z").toLocaleString()
          : "N/A"
      }
      Response Updated: ${
        row.original.response_updated_at
          ? new Date(row.original.response_updated_at + "Z").toLocaleString()
          : "N/A"
      }
    `;
          return (
            <div className="flex gap-2 items-center">
              {/* Control editing actions (Admin only) */}
              {user.role === "admin" && (
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

              {/* Tooltips for non-editing states */}
              {!editingResponse && (
                <Tooltip
                  id={`edit-response-tooltip-${controlId}`}
                  place="top"
                  content="Edit Response"
                />
              )}
              {user.role === "admin" && !editingControl && (
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
    [editingRowId, editingControlId, user.role, editAll]
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

  if (!allControls?.list_controls?.length)
    return (
      <div className="flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="mb-6">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-2">
                No controls found for this checklist
              </p>
              <p className="text-sm text-gray-400">
                Add your first control to get started
              </p>
            </div>
            {/* Add Control Section (admins only) */}
            {user.role === "admin" && (
              <div className="max-w-2xl mx-auto">
                {adding ? (
                  <form
                    onSubmit={handleAddSubmit(onSubmitAddControl)}
                    className="bg-[var(--card)] p-4 rounded-lg space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Input
                        type="text"
                        placeholder="Control Area"
                        {...registerAdd("control_area", { required: true })}
                      />
                      <select
                        className="border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        {...registerAdd("severity", { required: true })}
                      >
                        <option value="">Select Severity</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                      <div className="md:col-span-1">
                        <Textarea
                          placeholder="Control Text"
                          {...registerAdd("control_text", { required: true })}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Textarea
                          placeholder="Description"
                          {...registerAdd("description", { required: true })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-center gap-3">
                      <Button type="submit" variant="primary">
                        Save Control
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setAdding(false);
                          resetAdd();
                        }}
                        variant="destructive"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="flex gap-3 items-center justify-center">
                      <Button
                        onClick={() => setAdding(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm rounded-lg"
                      >
                        <Plus className="w-5 h-5" /> Add First Control
                      </Button>
                      <Button
                        onClick={() => {
                          setShowImportModal(true);
                          console.log(showImportModal);
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm rounded-lg"
                      >
                        <ImportIcon className="w-5 h-5" /> Import Controls
                      </Button>
                      <Button
                        onClick={() => setShowUploadModal(true)}
                        variant="secondary"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg"
                      >
                        <Upload className="w-5 h-5" /> Upload Controls
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {showImportModal && (
          <Modal
            className="w-full max-w-4xl mx-auto p-6"
            open={showImportModal}
            onClose={() => {
              setShowImportModal(false);
              console.log("first", showImportModal);
            }}
            title={"Import controls"}
          >
            <ImportControls targetChecklistId={checklistId} />
          </Modal>
        )}
        {showUploadModal && (
          <Modal
            className="w-full max-w-2xl mx-auto p-6"
            open={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            title="Upload Controls"
          >
            <UploadControls
              checklistId={checklistId}
              onClose={() => setShowUploadModal(false)}
            />
          </Modal>
        )}
      </div>
    );

  return (
    <TooltipProvider>
      <div className="h-full flex-1 flex flex-col">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex justify-between gap-2 pb-4 max-sm:flex-col items-center">
          <div className="flex items-center space-x-2">
            {currentChecklist && (
              <div className="flex items-center gap-2 pt-3">
                <h3 className="text-lg font-semibold text-[var(--foreground)">
                  Controls for Checklist - {currentChecklist.checklistType}
                </h3>
                <div className="text-sm text-[var(--muted-foreground)]">
                  {allControls?.list_controls?.length} control
                  {allControls?.list_controls?.length !== 1 ? "s" : ""}
                </div>
              </div>
            )}
          </div>
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
                    <DropdownMenuItem
                      onClick={() => setShowImportResponsesModal(true)}
                    >
                      <UploadIcon className="mr-2 h-4 w-4" />
                      Upload Responses
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
                    onClick={() => setEditAll(false)}
                  >
                    Cancel
                  </span>
                )}
                <Switch
                  id="edit-app"
                  checked={editAll}
                  onCheckedChange={setEditAll}
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
              </div>
            </div>
          </div>
        </div>
        {/* Controls Table - Scrollable */}
        <div
          className={`flex-1 overflow-auto border rounded-lg shadow bg-[var(--card)] text-[var(--card-foreground)] ${
            editAll ? "ring-green-500 border-green-500" : ""
          }`}
        >
          {/* <div className="flex justify-between items-center mb-4">
          <Button
            onClick={() => {
              setEditAll(!editAll);
              console.log("DATA IN USE FORM", registerRes);
            }}
          >
            {editAll ? "Cancel Edit All" : "Edit All Responses"}
          </Button>
          {editAll && (
            <Button onClick={handleSubmit(onSubmitAll)} disabled={saving}>
              {saving ? "Saving..." : "Save All"}
            </Button>
          )}
        </div> */}
          <Table
            className={`table-fixed ${
              editAll ? "ring-green-500 border-amber-500" : ""
            }`}
            style={{
              width: table.getCenterTotalSize(),
            }}
          >
            <TableHeader className="">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="group/head relative h-10 select-none last:[&>.cursor-col-resize]:opacity-0"
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
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {/* Pagination */}
        <div className="flex-shrink-0 flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
              {/* Previous button */}
              <PaginationItem>
                <Button
                  asChild
                  disabled={controlsPage <= 1}
                  variant="ghost"
                  className={`hover:cursor-pointer ${
                    controlsPage <= 1 ? "cursor-not-allowed" : ""
                  }`}
                >
                  <PaginationPrevious
                    className={`hover:cursor-pointer ${
                      controlsPage <= 1 ? "cursor-not-allowed" : ""
                    }`}
                    onClick={() => {
                      if (controlsPage > 1) {
                        goToControlsPage(controlsPage - 1);
                      }
                    }}
                  />
                </Button>
              </PaginationItem>

              {/* Dynamic page links */}
              {getVisiblePageNumbers(
                controlsPage,
                Math.ceil(
                  allControls?.total_counts?.total_controls / controlsPageSize
                ) || 1
              ).map((page, idx) => (
                <PaginationItem key={idx}>
                  {page === "…" ? (
                    <span className="px-2">
                      <Ellipsis />
                    </span>
                  ) : (
                    <PaginationLink
                      isActive={controlsPage === page}
                      onClick={() => {
                        if (page !== "...") goToControlsPage(page);
                      }}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              {/* Next button */}
              <PaginationItem>
                <PaginationNext
                  className={`hover:cursor-pointer ${
                    controlsPage >=
                    Math.ceil(
                      allControls?.total_counts?.total_controls /
                        controlsPageSize
                    )
                      ? "cursor-not-allowed"
                      : ""
                  }`}
                  onClick={() => {
                    if (
                      controlsPage >
                      Math.ceil(
                        allControls?.total_counts?.total_controls /
                          controlsPageSize
                      )
                    )
                      goToControlsPage(controlsPage + 1);
                  }}
                  disabled={
                    controlsPage ===
                    Math.ceil(
                      allControls?.total_counts?.total_controls /
                        controlsPageSize
                    )
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
        {/* Footer Actions - Fixed */}
        <div className="flex-shrink-0 flex justify-between items-center space-x-4 border-t pt-4 mt-4">
          {/* Add Control Section (admins only) */}
          <div className="flex-1">
            {user.role === "admin" && (
              <div>
                {adding ? (
                  <form
                    onSubmit={handleAddSubmit(onSubmitAddControl)}
                    className="rounded-lg space-y-4"
                  >
                    <h4 className="font-medium text-gray-900 mb-3">
                      Add New Control
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <input
                        type="text"
                        placeholder="Control Area"
                        className="border rounded px-3 py-2 text-sm focus:ring-2 w-full focus:ring-blue-500 focus:border-transparent"
                        {...registerAdd("control_area", { required: true })}
                      />
                      <select
                        className="border rounded px-3 py-2 text-sm focus:ring-2 w-full focus:ring-blue-500 focus:border-transparent"
                        {...registerAdd("severity", { required: true })}
                      >
                        <option value="">Select Severity</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                      <div className="md:col-span-1">
                        <textarea
                          placeholder="Control Text"
                          className="border rounded px-3 py-2 text-sm focus:ring-2 w-full focus:ring-blue-500 focus:border-transparent"
                          {...registerAdd("control_text", { required: true })}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <textarea
                          placeholder="Description"
                          className="border rounded px-3 py-2 text-sm focus:ring-2 w-full focus:ring-blue-500 focus:border-transparent"
                          {...registerAdd("description", { required: true })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        onClick={() => {
                          setAdding(false);
                          resetAdd();
                        }}
                        variant="destructive"
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Save Control</Button>
                    </div>
                  </form>
                ) : (
                  <Button
                    onClick={() => setAdding(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm"
                  >
                    <Plus className="w-5 h-5" /> Add Control
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex-shrink-0">
            <span
              data-tooltip-id="submit-tooltip"
              data-tooltip-content="Complete the checklist to submit"
              className="inline-block"
            >
              <Button
                variant="secondary"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm disabled:cursor-not-allowed"
                disabled={
                  !(
                    allControls?.list_controls.length !== 0 &&
                    allControls?.total_counts?.total_controls ===
                      allControls?.total_counts?.total_responses
                  )
                }
                onClick={async () => {
                  try {
                    await submitChecklistMutation(checklistId).unwrap();
                    alert("Checklist submitted successfully!");
                  } catch (err) {
                    console.error("Failed to submit checklist:", err);
                    alert("Failed to submit checklist. Please try again.");
                  }
                }}
              >
                Submit
              </Button>
            </span>
            <Tooltip id="submit-tooltip" place="top" />
          </div>
          {showImportResponsesModal && (
            <div>
              <ImportResponsesDialog
                checklistId={checklistId}
                open={showImportResponsesModal}
                onClose={() => setShowImportResponsesModal(false)}
              />
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Controls;
