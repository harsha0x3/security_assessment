import { useSelector } from "react-redux";
import { useMemo } from "react";
import { useGetAllUsersQuery } from "../store/apiSlices/authApiSlice";
import { useAuth } from "../hooks/useAuth";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";

const AddUsers = () => {
  const { register } = useAuth();
  const { data: allUsers, isError, error, isLoading } = useGetAllUsersQuery();

  const columns = useMemo(
    () => [
      {
        accessorKey: "username",
        header: "Username",
        cell: ({ row }) => {
          const userName = row.original.username;
          return <input type="text" value={userName} />;
        },
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const role = row.original.role;
          return <input type="text" value={role} />;
        },
      },
    ],
    [allUsers]
  );

  const table = useReactTable({
    data: allUsers || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <div className="overflow-x-auto border rounded-lg shadow bg-white">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="relative text-left px-4 py-3 border-b font-medium text-sm text-gray-700"
                  style={{
                    width: header.getSize(), // dynamic width
                    minWidth: header.column.columnDef.minSize,
                    maxWidth: header.column.columnDef.maxSize,
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
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
            <tr key={row.id} className="border-b hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-sm">
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

export default AddUsers;
