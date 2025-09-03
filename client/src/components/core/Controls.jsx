import { useParams } from "react-router-dom";
import {
  useGetAllControlsWithResponsesQuery,
  useAddControlMutation,
} from "../../store/apiSlices/controlsApiSlice";
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
import { Save, Edit3, X, Plus } from "lucide-react";
import { Tooltip } from "react-tooltip";
import { useForm } from "react-hook-form";

const Controls = () => {
  const user = useSelector(selectAuth);
  console.log("user", user.role);
  const { checklistId } = useParams();
  const { data: allControls, isLoading: isFetchingControls } =
    useGetAllControlsWithResponsesQuery(checklistId, { skip: !checklistId });

  const [saveResponse] = useSaveResponseMutation();
  const [addControl] = useAddControlMutation();

  const [editingRowId, setEditingRowId] = useState(null);
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

  const handleCancel = () => {
    setEditingRowId(null);
    reset();
  };

  const onSubmitResponse = async (formData, controlId) => {
    const payload = {
      current_setting: formData.current_setting,
      review_comment: formData.review_comment,
      evidence_path: formData.evidence_path,
    };
    const controlData = allControls?.find((c) => c.control_id === controlId);
    const responseId = controlData?.response_id;

    try {
      await saveResponse({ controlId, payload, responseId }).unwrap();
      setEditingRowId(null);
      reset();
    } catch (err) {
      console.error("Failed to save response:", err);
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
      { accessorKey: "control_area", header: "Control Area" },
      { accessorKey: "severity", header: "Severity" },
      { accessorKey: "control_text", header: "Control Text" },
      {
        accessorKey: "current_setting",
        header: "Current Setting",
        cell: ({ row }) => {
          const controlId = row.original.control_id;
          return editingRowId === controlId ? (
            <input
              className="border rounded px-2 py-1 text-sm w-full"
              {...register("current_setting")}
            />
          ) : (
            row.original.current_setting || "-"
          );
        },
      },
      {
        accessorKey: "review_comment",
        header: "Review Comment",
        cell: ({ row }) => {
          const controlId = row.original.control_id;
          return editingRowId === controlId ? (
            <input
              className="border rounded px-2 py-1 text-sm w-full"
              {...register("review_comment")}
            />
          ) : (
            row.original.review_comment || "-"
          );
        },
      },
      {
        accessorKey: "evidence_path",
        header: "Evidence Path",
        cell: ({ row }) => {
          const controlId = row.original.control_id;
          return editingRowId === controlId ? (
            <input
              className="border rounded px-2 py-1 text-sm w-full"
              {...register("evidence_path")}
            />
          ) : (
            row.original.evidence_path || "-"
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const controlId = row.original.control_id;
          const editing = editingRowId === controlId;

          return editing ? (
            <div className="flex gap-2">
              <Save
                className="w-5 h-5 text-green-600 cursor-pointer"
                data-tooltip-id={`save-tooltip-${controlId}`}
                onClick={handleSubmit((data) =>
                  onSubmitResponse(data, controlId)
                )}
              />
              <X
                className="w-5 h-5 text-red-600 cursor-pointer"
                data-tooltip-id={`cancel-tooltip-${controlId}`}
                onClick={handleCancel}
              />
              <Tooltip
                id={`save-tooltip-${controlId}`}
                place="top"
                content="Save"
              />
              <Tooltip
                id={`cancel-tooltip-${controlId}`}
                place="top"
                content="Cancel"
              />
            </div>
          ) : (
            <div>
              <Edit3
                className="w-5 h-5 text-blue-600 cursor-pointer"
                data-tooltip-id={`edit-tooltip-${controlId}`}
                onClick={() => handleEdit(controlId, row.original)}
              />
              <Tooltip
                id={`edit-tooltip-${controlId}`}
                place="top"
                content="Edit"
              />
            </div>
          );
        },
      },
    ],
    [editingRowId, register, handleSubmit]
  );

  const table = useReactTable({
    data: allControls || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isFetchingControls) return <p>Loading controls...</p>;
  if (!allControls?.length)
    return (
      <div>
        <p>No controls found for this checklist.</p>
        {/* Add Control Section (admins only) */}
        {user.role === "admin" && (
          <div className="mt-4">
            {adding ? (
              <form
                onSubmit={handleAddSubmit(onSubmitAddControl)}
                className="flex gap-2 items-center"
              >
                <input
                  type="text"
                  placeholder="Control Area"
                  className="border rounded px-2 py-1 text-sm"
                  {...registerAdd("control_area", { required: true })}
                />
                <select
                  className="border rounded px-2 py-1 text-sm"
                  {...registerAdd("severity", { required: true })}
                >
                  <option value="">Select Severity</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
                <input
                  type="text"
                  placeholder="Control Text"
                  className="border rounded px-2 py-1 text-sm"
                  {...registerAdd("control_text", { required: true })}
                />
                <button
                  type="submit"
                  className="px-3 py-1 text-sm rounded bg-green-600 text-white"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdding(false);
                    resetAdd();
                  }}
                  className="px-3 py-1 text-sm rounded bg-gray-300"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-1 px-3 py-1 text-sm rounded bg-blue-600 text-white"
              >
                <Plus className="w-4 h-4" /> Add Control
              </button>
            )}
          </div>
        )}
      </div>
    );

  return (
    <div className="p-2 overflow-x-auto border rounded-lg shadow bg-white">
      {currentChecklist && (
        <div>
          <h3 className="text-md font-semibold mb-2 px-5 text-gray-900 dark:text-gray-900">
            {currentChecklist.checklistType} Controls
          </h3>
        </div>
      )}
      {/* Responses table (all users) */}
      <form>
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left px-4 py-2 border-b font-medium text-sm"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.original.control_id} className="border-b">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </form>
      {/* Add Control Section (admins only) */}
      {user.role === "admin" && (
        <div className="mt-4">
          {adding ? (
            <form
              onSubmit={handleAddSubmit(onSubmitAddControl)}
              className="flex gap-2 items-center"
            >
              <input
                type="text"
                placeholder="Control Area"
                className="border rounded px-2 py-1 text-sm"
                {...registerAdd("control_area", { required: true })}
              />
              <select
                className="border rounded px-2 py-1 text-sm"
                {...registerAdd("severity", { required: true })}
              >
                <option value="">Select Severity</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              <input
                type="text"
                placeholder="Control Text"
                className="border rounded px-2 py-1 text-sm"
                {...registerAdd("control_text", { required: true })}
              />
              <button
                type="submit"
                className="px-3 py-1 text-sm rounded bg-green-600 text-white"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  resetAdd();
                }}
                className="px-3 py-1 text-sm rounded bg-gray-300"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1 px-3 py-1 text-sm rounded bg-blue-600 text-white"
            >
              <Plus className="w-4 h-4" /> Add Control
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Controls;
