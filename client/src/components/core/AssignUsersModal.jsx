import { useMemo, useState } from "react";
import { useGetAllUsersQuery } from "../../store/apiSlices/authApiSlice";
import { useAssignUsersMutation } from "../../store/apiSlices/userAssignApiSlice";
import { useSelector } from "react-redux";
import { getAssignedUsers } from "../../store/appSlices/checklistsSlice";
import { X } from "lucide-react";

const AssignUsersModal = ({ isOpen, onClose, checklistId }) => {
  const { data: users = [], isLoading: isLoadingUsers } = useGetAllUsersQuery();
  const [assignUsers, { isLoading: isAssigning }] = useAssignUsersMutation();
  const [selectedUsers, setSelectedUsers] = useState([]);

  const alreadyAssignedUsers = useSelector((state) =>
    getAssignedUsers(state, { payload: checklistId })
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

  if (!isOpen) return null;

  const handleUserChange = (e) => {
    const { value, checked } = e.target;
    setSelectedUsers((prev) =>
      checked ? [...prev, value] : prev.filter((u) => u !== value)
    );
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!checklistId) {
      alert("No checklist ID provided.");
      return;
    }

    if (selectedUsers.length === 0) {
      alert("Please select at least one user to assign.");
      return;
    }

    try {
      await assignUsers({
        checklistId,
        payload: { user_ids: selectedUsers },
      }).unwrap();
      alert("Users assigned successfully!");
      setSelectedUsers([]);
      onClose();
    } catch (err) {
      console.error("Failed to assign users:", err);
      alert("Failed to assign users.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-lg p-6 w-[400px] space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-center">
          Assign Users to Checklist
        </h2>

        {/* Already Assigned Users */}
        {existingAssignedUsers.length > 0 && (
          <div className="bg-blue-100 text-blue-800 p-2 rounded-md">
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
          <p className="text-gray-500">All users are already assigned 🎉</p>
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
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAssigning}
                className="px-4 py-2 rounded-md bg-green-600 text-white"
              >
                {isAssigning ? "Assigning..." : "Assign"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AssignUsersModal;
