import { useState, useMemo } from "react";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { useGetAllUsersQuery } from "../store/apiSlices/authApiSlice";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import RegisterForm from "../components/auth/RegisterForm";

const AddUsers = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const {
    data: allUsers,
    isError,
    error,
    isLoading,
    refetch,
  } = useGetAllUsersQuery();

  const columns = useMemo(
    () => [
      {
        accessorKey: "username",
        header: "Username",
        cell: ({ row }) => row.original.username,
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => row.original.role,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            variant="outline"
            onClick={() => setSelectedUser(row.original)}
            disabled={!row.original.mfa_enabled}
          >
            View MFA
          </Button>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: allUsers || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto border rounded-lg shadow bg-white p-4">
      {/* Button to open register modal */}
      <Button variant="primary" onClick={() => setIsRegisterModalOpen(true)}>
        Add Users
      </Button>

      {/* Users table */}
      <table className="w-full border-collapse mt-4">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="relative text-left px-4 py-3 border-b font-medium text-sm text-gray-700"
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

      {/* Modal for registration form */}
      <Modal
        open={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register User"
      >
        <RegisterForm
          onClose={() => {
            refetch();
            setIsRegisterModalOpen(false);
          }}
        />
      </Modal>

      {/* Modal to show MFA QR */}
      <Modal
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={`MFA for ${selectedUser?.username}`}
      >
        {selectedUser?.mfa_enabled ? (
          <div className="flex flex-col items-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                selectedUser.mfa_uri
              )}`}
              alt="MFA QR"
            />
            <p className="text-sm text-gray-600 mt-2 break-all">
              {selectedUser.mfa_uri}
            </p>
          </div>
        ) : (
          <p>This user does not have MFA enabled.</p>
        )}
      </Modal>
    </div>
  );
};

export default AddUsers;
