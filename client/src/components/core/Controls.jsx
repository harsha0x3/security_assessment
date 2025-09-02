import { useParams } from "react-router-dom";
import { useGetAllControlsWithResponsesQuery } from "../../store/apiSlices/controlsApiSlice";
import { useSaveResponseMutation } from "../../store/apiSlices/responsesApiSlice";
import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { selectAuth } from "../../store/appSlices/authSlice";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Save, Edit3, X } from "lucide-react";
import { Tooltip } from "react-tooltip";

const Controls = () => {
  const user = useSelector(selectAuth);
  const { checklistId } = useParams();
  const { data: allControls, isLoading: isFetchingControls } =
    useGetAllControlsWithResponsesQuery(checklistId, { skip: !checklistId });

  const [saveResponse] = useSaveResponseMutation();
  const [editingRowId, setEditingRowId] = useState(null);

  // Store the currently edited row
  const [editedRow, setEditedRow] = useState(null);

  // Start editing a row
  const handleEdit = (controlId, rowData) => {
    setEditingRowId(controlId);
    setEditedRow({
      controlId,
      current_setting: rowData.current_setting || "",
      review_comment: rowData.review_comment || "",
      evidence_path: rowData.evidence_path || "",
    });
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingRowId(null);
    setEditedRow(null);
  };

  // Update input value
  const handleChange = (field, value) => {
    setEditedRow((prev) => ({ ...prev, [field]: value }));
  };

  // Save edited response
  const handleSave = async (controlId) => {
    const payload = {
      current_setting: editedRow.current_setting,
      review_comment: editedRow.review_comment,
      evidence_path: editedRow.evidence_path,
    };
    const controlData = allControls?.find((c) => c.control_id === controlId);
    const responseId = controlData?.response_id;

    try {
      await saveResponse({ controlId, payload, responseId }).unwrap();
      setEditingRowId(null);
      setEditedRow(null);
    } catch (err) {
      console.error("Failed to save response:", err);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "control_area",
        header: "Control Area",
        enableResizing: true,
      },
      { accessorKey: "severity", header: "Severity", enableResizing: true },
      {
        accessorKey: "control_text",
        header: "Control Text",
        enableResizing: true,
      },
      {
        accessorKey: "current_setting",
        header: "Current Setting",
        enableResizing: true,
        cell: ({ row }) => {
          const controlId = row.original.control_id;
          const editing = editingRowId === controlId;
          const value = editing
            ? editedRow.current_setting
            : row.original.current_setting || "";
          return editing ? (
            <input
              className="border rounded px-2 py-1 text-sm w-full"
              value={value}
              onChange={(e) => handleChange("current_setting", e.target.value)}
            />
          ) : (
            row.original.current_setting || "-"
          );
        },
      },
      {
        accessorKey: "review_comment",
        header: "Review Comment",
        enableResizing: true,
        cell: ({ row }) => {
          const controlId = row.original.control_id;
          const editing = editingRowId === controlId;
          const value = editing
            ? editedRow.review_comment
            : row.original.review_comment || "";
          return editing ? (
            <input
              className="border rounded px-2 py-1 text-sm w-full"
              value={value}
              onChange={(e) => handleChange("review_comment", e.target.value)}
            />
          ) : (
            row.original.review_comment || "-"
          );
        },
      },
      {
        accessorKey: "evidence_path",
        header: "Evidence Path",
        enableResizing: true,
        cell: ({ row }) => {
          const controlId = row.original.control_id;
          const editing = editingRowId === controlId;
          const value = editing
            ? editedRow.evidence_path
            : row.original.evidence_path || "";
          return editing ? (
            <input
              className="border rounded px-2 py-1 text-sm w-full"
              value={value}
              onChange={(e) => handleChange("evidence_path", e.target.value)}
            />
          ) : (
            row.original.evidence_path || "-"
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        enableResizing: false,
        cell: ({ row }) => {
          const controlId = row.original.control_id;
          const editing = editingRowId === controlId;
          return editing ? (
            <div className="flex gap-2">
              <Save
                className="w-5 h-5 text-green-600 cursor-pointer"
                data-tooltip-id={`save-tooltip-${controlId}`}
                onClick={() => handleSave(controlId)}
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
    [editedRow]
  );

  const table = useReactTable({
    data: allControls || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
  });

  if (isFetchingControls) return <p>Loading controls...</p>;
  if (!allControls?.length) return <p>No controls found for this checklist.</p>;

  return (
    <div className="p-4 overflow-x-auto border rounded-lg shadow bg-white">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="text-left px-4 py-2 border-b relative"
                >
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
                          "absolute right-0 top-0 h-full w-1 cursor-col-resize bg-gray-300",
                      }}
                    />
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
    </div>
  );
};

export default Controls;
