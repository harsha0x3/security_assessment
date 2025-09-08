import { useParams } from "react-router-dom";
import {
  useGetAllControlsWithResponsesQuery,
  useAddControlMutation,
  useUpdateControlsMutation,
} from "../../store/apiSlices/controlsApiSlice";
import { useSubmitChecklistMutation } from "../../store/apiSlices/checklistsApiSlice";
import { useSaveResponseMutation } from "../../store/apiSlices/responsesApiSlice";
import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { selectAuth } from "../../store/appSlices/authSlice";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
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
  Info,
} from "lucide-react";
import { Tooltip } from "react-tooltip";
import { useForm } from "react-hook-form";

const Controls = () => {
  const user = useSelector(selectAuth);
  const { checklistId } = useParams();
  const { data: allControls, isLoading: isFetchingControls } =
    useGetAllControlsWithResponsesQuery(checklistId, { skip: !checklistId });
  const [submitChecklistMutation] = useSubmitChecklistMutation();

  const [saveResponse] = useSaveResponseMutation();
  const [addControl] = useAddControlMutation();
  const [updateControl] = useUpdateControlsMutation();

  const [editingRowId, setEditingRowId] = useState(null);
  const [editingControlId, setEditingControlId] = useState(null);
  const [adding, setAdding] = useState(false);
  const currentChecklist = useSelector(selectCurrentChecklist);
  console.log("All Controls Len", allControls?.total_counts?.total_controls);
  console.log("All Responses LKen", allControls?.total_counts?.total_responses);

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
    };

    try {
      await updateControl({ payload, controlId }).unwrap();
      setEditingControlId(null);
      resetEditControl();
    } catch (err) {
      console.error("Failed to update control:", err);
    }
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
        minSize: 70, // minimum width
        maxSize: 120,
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
          // return editingRowId === controlId ? (
          //   <input
          //     type="file"
          //     className="border rounded px-2 py-1 text-sm w-full"
          //     {...register("evidence_file")}
          //   />
          // ) : (

          //   row.original.evidence_path || "-"
          // );
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
    [
      editingRowId,
      editingControlId,
      register,
      registerEditControl,
      handleSubmit,
      handleEditControlSubmit,
      user.role,
    ]
  );

  const table = useReactTable({
    data: allControls?.list_controls || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
  });

  if (isFetchingControls)
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading controls...</span>
      </div>
    );

  if (!allControls?.list_controls?.length)
    return (
      <div className="p-6 text-center">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <button
                onClick={() => setAdding(true)}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" /> Add First Control
              </button>
            )}
          </div>
        )}
      </div>
    );

  return (
    <div className="p-2 space-y-4">
      {currentChecklist && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900">
            {currentChecklist.checklistType} Controls
          </h3>
          <div className="text-sm text-gray-500">
            {allControls?.list_controls?.length} control
            {allControls?.list_controls?.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* Controls Table */}
      <div className="overflow-x-auto border rounded-lg shadow bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="relative text-left px-1 py-3 border-b font-medium text-sm text-gray-700"
                    style={{
                      width: header.getSize(), // dynamic width
                      minWidth: header.column.columnDef.minSize,
                      maxWidth: header.column.columnDef.maxSize,
                    }}
                  >
                    <div className="flex items-center justify-between">
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

      <div className="flex justify-between items-center space-x-4 border-t pt-4">
        {/* Add Control Section (admins only) */}
        <div>
          {user.role === "admin" && (
            <div className="">
              {adding ? (
                <form
                  onSubmit={handleAddSubmit(onSubmitAddControl)}
                  className="rounded-lg space-y-4"
                >
                  <h4 className="font-medium text-gray-900 mb-3">
                    Add New Control
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div>
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
      </div>
    </div>
  );
};

export default Controls;
