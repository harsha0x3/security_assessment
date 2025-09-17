import { useParams } from "react-router-dom";
import {
  useGetAllControlsWithResponsesQuery,
  useAddControlMutation,
  useUpdateControlsMutation,
} from "../../store/apiSlices/controlsApiSlice";
import { useSubmitChecklistMutation } from "../../store/apiSlices/checklistsApiSlice";
import {
  useSaveResponseMutation,
  useImportResposesMutation,
} from "../../store/apiSlices/responsesApiSlice";
import { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectAuth } from "../../store/appSlices/authSlice";
import { downloadFile } from "@/utils/downloadFile";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { selectCurrentChecklist } from "../../store/appSlices/checklistsSlice";
import {
  Save,
  Edit3,
  X,
  Plus,
  Settings,
  Shredder,
  Upload,
  CheckSquare,
  Info,
  ImportIcon,
  Ellipsis,
} from "lucide-react";
import { Tooltip } from "react-tooltip";
import { useForm } from "react-hook-form";
import Modal from "../ui/Modal";
import ImportControls from "./ImportControls";
import UploadControls from "./UploadControls";
import ImportResponsesDialog from "./ui/ImportResponses";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { useControlsNResponses } from "@/hooks/useControlsNResponses";

const Controls = () => {
  const isProd = import.meta.env.VITE_PROD_ENV === "true";

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
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      current_setting: "",
      review_comment: "",
      evidence_path: "",
    },
  });

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
  const handleEdit = (controlId, rowData) => {
    setEditingRowId(controlId);
    reset({
      current_setting: rowData.current_setting || "",
      review_comment: rowData.review_comment || "",
      evidence_path: rowData.evidence_path || "",
    });
  };

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

  const handleCancel = () => {
    setEditingRowId(null);
    reset();
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
      reset();
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
        minSize: 100, // minimum width
        maxSize: 150,
        // enableSorting: true,
        cell: ({ row }) => {
          const controlId = row.original.control_id;
          return editingControlId === controlId ? (
            <input
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
        maxSize: 120,
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
            <textarea
              className="border rounded p-1 text-sm w-full min-h-[60px] resize-y"
              {...registerEditControl("control_text")}
            />
          ) : (
            <div
              className="max-w-xs text-sm leading-snug line-clamp-3 overflow-y-auto max-h-20 pr-1"
              title={row.original.control_text}
            >
              {row.original.control_text || "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        minSize: 300,
        maxSize: 600,
        cell: ({ row }) => {
          const controlId = row.original.control_id;
          return editingRowId === controlId ? (
            <textarea
              className="border rounded p-1 text-sm w-full min-h-[60px] resize-y"
              {...register("description")}
            />
          ) : (
            <div
              className="max-w-xs text-sm leading-snug line-clamp-3 overflow-y-auto max-h-20 pr-1"
              title={row.original.description}
            >
              {row.original.description || "-"}
            </div>
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
          return editingRowId === controlId ? (
            <textarea
              className="border rounded p-1 text-sm w-full min-h-[60px] resize-y"
              {...register("current_setting")}
            />
          ) : (
            <div
              className="max-w-xs text-sm leading-snug line-clamp-3 overflow-y-auto max-h-20 pr-1"
              title={row.original.current_setting}
            >
              {row.original.current_setting || "-"}
            </div>
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
          return editingRowId === controlId ? (
            <textarea
              className="border rounded p-1 text-sm w-full min-h-[60px] resize-y"
              {...register("review_comment")}
            />
          ) : (
            <div
              className="max-w-xs text-sm leading-snug line-clamp-3 overflow-y-auto max-h-20 pr-1"
              title={row.original.review_comment}
            >
              {row.original.review_comment || "-"}
            </div>
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

          if (editingRowId === controlId) {
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
                          reset((prev) => ({
                            ...prev,
                            evidence_file: null,
                            remove_evidence: true,
                          }));
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
                  {...register("evidence_file")}
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
              {/* Response editing actions */}
              {editingResponse ? (
                <>
                  <Save
                    className="w-5 h-5 text-green-600 cursor-pointer hover:text-green-700"
                    data-tooltip-id={`save-response-tooltip-${controlId}`}
                    onClick={handleSubmit((data) =>
                      onSubmitResponse(data, controlId)
                    )}
                  />
                  <X
                    className="w-5 h-5 text-red-600 cursor-pointer hover:text-red-700"
                    data-tooltip-id={`cancel-response-tooltip-${controlId}`}
                    onClick={handleCancel}
                  />
                  <Tooltip
                    id={`save-response-tooltip-${controlId}`}
                    place="top"
                    content="Save Response"
                  />
                  <Tooltip
                    id={`cancel-response-tooltip-${controlId}`}
                    place="top"
                    content="Cancel"
                  />
                </>
              ) : (
                <Edit3
                  className="w-5 h-5 text-blue-600 cursor-pointer hover:text-blue-700"
                  data-tooltip-id={`edit-response-tooltip-${controlId}`}
                  onClick={() => handleEdit(controlId, row.original)}
                />
              )}

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
                className="max-w-xs whitespace-pre-wrap text-xs bg-gray-800 text-white p-2 rounded-md shadow"
                content={tooltipContent}
              />
            </div>
          );
        },
      },
    ],
    [editingRowId, editingControlId, user.role]
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
      <div className="h-1/2 flex flex-col overflow-hidden">
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
                    className="bg-gray-50 p-4 rounded-lg space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <input
                        type="text"
                        placeholder="Control Area"
                        className="border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <textarea
                          placeholder="Control Text"
                          className="border rounded px-3 py-2 text-sm w-full h-20 resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <div className="flex justify-center gap-3">
                      <button
                        type="submit"
                        className="px-6 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                      >
                        Save Control
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAdding(false);
                          resetAdd();
                        }}
                        className="px-6 py-2 text-sm rounded-lg bg-gray-300 text-gray-700 hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="flex gap-3 items-center justify-center">
                      <button
                        onClick={() => setAdding(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-5 h-5" /> Add First Control
                      </button>
                      <button
                        onClick={() => {
                          setShowImportModal(true);
                          console.log(showImportModal);
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        <ImportIcon className="w-5 h-5" /> Import Controls
                      </button>
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                      >
                        <Upload className="w-5 h-5" /> Upload Controls
                      </button>
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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      {currentChecklist && (
        <div className="flex-shrink-0 flex items-center justify-between pb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900">
            Controls for Checklist - {currentChecklist.checklistType}
          </h3>
          <div className="text-sm text-gray-500">
            {allControls?.list_controls?.length} control
            {allControls?.list_controls?.length !== 1 ? "s" : ""}
          </div>
          {checklistId && (
            <div className="flex">
              <Button onClick={handleExport}>Export Checklist CSV</Button>
              <Button
                onClick={() => {
                  console.log("BOOL", showImportResponsesModal);
                  setShowImportResponsesModal(true);
                }}
              >
                Import Responses
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Controls Table - Scrollable */}
      <div className="flex-[0.5] overflow-auto border rounded-lg shadow bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="relative text-left px-1 py-3 border-b font-medium text-sm text-gray-700"
                    style={{
                      width: header.getSize(),
                      minWidth: header.column.columnDef.minSize,
                      maxWidth: header.column.columnDef.maxSize,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      {/* <div
                        className={`flex items-center gap-2 ${
                          header.column.getCanSort()
                            ? "cursor-pointer select-none"
                            : ""
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="text-xs">
                            {{
                              asc: "↑",
                              desc: "↓",
                            }[header.column.getIsSorted()] ?? "↕️"}
                          </span>
                        )}
                      </div> */}
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}

                      {header.column.getCanResize() && (
                        <div
                          {...{
                            onMouseDown: header.getResizeHandler(),
                            onTouchStart: header.getResizeHandler(),
                            className:
                              "absolute right-0 top-0 h-full w-1 cursor-col-resize z-10",
                          }}
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.original.control_id}
                className="border-b hover:bg-gray-50"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-2 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex justify-center mt-4">
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
                    allControls?.total_counts?.total_controls / controlsPageSize
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
                    allControls?.total_counts?.total_controls / controlsPageSize
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
                    <button
                      type="button"
                      onClick={() => {
                        setAdding(false);
                        resetAdd();
                      }}
                      className="px-4 py-2 text-sm rounded-lg bg-gray-300 text-gray-700 hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      Save Control
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" /> Add Control
                </button>
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
            <button
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            </button>
          </span>
          <Tooltip id="submit-tooltip" place="top" />
        </div>
        {showImportResponsesModal && (
          <div>
            <h1 className="text-4xl">HELLO</h1>
            <ImportResponsesDialog
              checklistId={checklistId}
              open={showImportResponsesModal}
              onClose={() => setShowImportResponsesModal(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Controls;
