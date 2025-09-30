import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import Modal from "../../../components/ui/Modal";
import { useGetAllUsersQuery } from "../../auth/store/authApiSlice";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import RegisterForm from "../../auth/components/RegisterForm";
import Profile from "./Profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ScrollAreaViewport } from "@radix-ui/react-scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AddUsers = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
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
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => setSelectedUser(row.original)}
                  disabled={!row.original.mfa_enabled}
                >
                  View MFA
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{`MFA for ${row.original?.username}`}</DialogTitle>
                </DialogHeader>
                {row.original?.mfa_enabled ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        row.original.mfa_uri
                      )}`}
                      alt="MFA QR"
                    />
                    <p className="text-sm text-gray-600 mt-2 break-all">
                      {row.original.mfa_uri}
                    </p>
                  </div>
                ) : (
                  <p>This user does not have MFA enabled.</p>
                )}
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedUser(row.original);
                    setShowEditProfile(true);
                  }}
                >
                  Edit User Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0">
                <DialogHeader>
                  <DialogTitle>
                    {`Edit Profile For user - ${row.original.username}`}
                  </DialogTitle>
                  <Profile userDetails={row.original} />
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: allUsers || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
  });

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex flex-row shrink-0 justify-between items-center p-2 bg-muted rounded-t-lg">
        <CardTitle>Manage Users</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Users</Button>
          </DialogTrigger>
          <DialogContent className="flex flex-col h-full w-full">
            <DialogHeader>
              <DialogTitle>Add New Users Here</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
              <RegisterForm />
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex-1 min-w-full overflow-auto">
        <ScrollArea>
          <Table
            className={`table-fixed w-full`}
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
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AddUsers;
