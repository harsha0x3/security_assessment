import { useMemo, useState } from "react";
import { useGetAllUsersQuery } from "../../auth/store/authApiSlice";
import { useAssignUsersMutation } from "../store/userAssignApiSlice";
import { useSelector } from "react-redux";
import { getAssignedUsers } from "../../checklists/store/checklistsSlice";
import { UsersIcon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const AssignUsersModal = ({ checklist }) => {
  const { data: users = [], isLoading: isLoadingUsers } = useGetAllUsersQuery();
  const [assignUsers, { isLoading: isAssigning }] = useAssignUsersMutation();
  const [selectedUsers, setSelectedUsers] = useState([]);

  const alreadyAssignedUsers = useSelector((state) =>
    getAssignedUsers(state, { payload: checklist?.id })
  );

  const existingAssignedUsers = useMemo(() => {
    if (!alreadyAssignedUsers) return [];
    return users
      .filter((user) => alreadyAssignedUsers.includes(user.id))
      .map((user) => user.username);
  }, [alreadyAssignedUsers, users]);

  const availableUsers = useMemo(() => {
    if (!alreadyAssignedUsers) return users;
    return users.filter((user) => !alreadyAssignedUsers.includes(user.id));
  }, [users, alreadyAssignedUsers]);

  const handleUserChange = (e) => {
    const { value, checked } = e.target;
    setSelectedUsers((prev) =>
      checked ? [...prev, value] : prev.filter((u) => u !== value)
    );
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!checklist) {
      alert("No checklist provided.");
      return;
    }

    if (selectedUsers.length === 0) {
      alert("Please select at least one user to assign.");
      return;
    }

    try {
      await assignUsers({
        checklistId: checklist.id,
        payload: { user_ids: selectedUsers },
      }).unwrap();
      alert("Users assigned successfully!");
      setSelectedUsers([]);
    } catch (err) {
      console.error("Failed to assign users:", err);
      alert("Failed to assign users.");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <UsersIcon className="mr-2 h-4 w-4" />
          Assign Users
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign user to the checklist</DialogTitle>
        </DialogHeader>
        <DialogDescription asChild>
          <div className="flex items-center justify-center z-50">
            <div className="rounded-lg shadow-lg p-6 w-[400px] space-y-4">
              {/* Close Button */}

              <h2 className="text-lg font-semibold text-center">
                {`Assign Users to Checklist ${checklist.checklist_type}`}
              </h2>

              {/* Already Assigned Users */}
              {existingAssignedUsers.length > 0 && (
                <div className="p-2 rounded-md">
                  <strong>Already Assigned:</strong>
                  <ul className="list-disc pl-5 mt-2">
                    {existingAssignedUsers.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Available Users to Assign */}
              {isLoadingUsers ? (
                <p>Loading users...</p>
              ) : availableUsers.length === 0 ? (
                <p className="text-gray-500">
                  All users are already assigned 🎉
                </p>
              ) : (
                <form onSubmit={handleAssign} className="space-y-4">
                  <div className="max-h-48 overflow-y-auto border p-2 rounded-md">
                    {availableUsers.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center gap-2 p-1 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          value={user.id}
                          checked={selectedUsers.includes(user.id)}
                          onChange={handleUserChange}
                        />
                        {user.username}
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button type="button" variant="destructive">
                        Cancel
                      </Button>
                    </DialogClose>

                    <Button type="submit" disabled={isAssigning}>
                      {isAssigning ? "Assigning..." : "Assign"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

export default AssignUsersModal;
