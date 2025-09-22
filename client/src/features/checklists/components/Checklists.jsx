// Updated Checklists component with better layout integration
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  setCurrentApplication,
  loadAllApps,
} from "../../applications/store/applicationSlice";
import { selectAuth } from "../../auth/store/authSlice";
import { AppsCombobox } from "@/features/applications/components/ui/applicationCombobox";
import { ChecklistCombobox } from "@/features/checklists/components/ChecklistCombobox";

import {
  setCurrentChecklist,
  selectAllChecklists,
} from "../store/checklistsSlice";
import { useApplications } from "@/features/applications/hooks/useApplications";
import {
  selectAppSearchTerm,
  setAppSearchTerm,
} from "@/store/appSlices/filtersSlice";
import {
  useAddChecklistMutation,
  useDeleteChecklistMutation,
  usePatchChecklistMutation,
} from "../store/checklistsApiSlice";
import AssignUsersModal from "../../userManagement/components/AssignUsersModal";
import {
  Plus,
  Users,
  CheckSquare,
  CheckCircle2,
  EllipsisVertical,
  Star,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  setChecklistSearchTerm,
  selectChecklistSearchTerm,
} from "@/store/appSlices/filtersSlice";
import { useChecklists } from "@/features/checklists/hooks/useChecklists";
import { Button } from "@/components/ui/Button";

const Checklists = () => {
  const { currentApp } = useApplications();

  const {
    currentChecklist,
    updateSearchParams: updateCListSearchParams,
    cListPage,
    cListPageSize,
    cListSortBy,
    cListSortOrder,
    cListSearchBy,
    cListSearch,
    isError,
    error,
    goToPage,
    data: allChecklists,
  } = useChecklists();

  const { appId: paramAppId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const apps = useSelector(loadAllApps);
  const filteredChecklists = useSelector(selectAllChecklists);
  const [selectedAppId, setSelectedAppId] = useState(
    paramAppId || currentApp?.appId
  );
  const { checklistId: paramChecklistId } = useParams();
  const [selectedChecklistId, setSelectedChecklistId] =
    useState(paramChecklistId);
  const [deleteChecklist, { isLoading: isDeleting, error: deleteError }] =
    useDeleteChecklistMutation();

  // Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [checklistType, setChecklistType] = useState("");
  const [customChecklist, setCustomChecklist] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showChecklistsFilters, setShowChecklistsFilter] = useState(false);
  const [newPriority, setNewPriority] = useState("Medium");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editChecklistData, setEditChecklistData] = useState({
    checklistId: null,
    checklistType: "",
    priority: "",
  });
  const checklistSearchTerm = useSelector(selectChecklistSearchTerm);

  const priorityMap = { High: 3, Medium: 2, Low: 1 };

  const [addChecklist, { isLoading: isAdding }] = useAddChecklistMutation();
  const user = useSelector(selectAuth);
  const [updateChecklist] = usePatchChecklistMutation();

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Handle app tab click
  const handleSelectApp = (app) => {
    setSelectedAppId(app.appId);
    dispatch(setCurrentApplication({ appId: app.appId }));
    setSelectedChecklistId(null);
    navigate(`/${app.appId}/checklists`);
  };

  // Handle checklist click
  const handleSelectChecklist = (chk) => {
    dispatch(setCurrentChecklist({ checklistId: chk.id }));
    setSelectedChecklistId(chk.id);
    navigate(`/${selectedAppId}/checklists/${chk.id}`);
  };

  const handleDeleteChecklist = async (checklistId) => {
    setOpenMenuId(null);
    try {
      await deleteChecklist(checklistId).unwrap();
      toast.success("Checklist deleted successfully");
    } catch (err) {
      console.error("Failed to delete checklist:", err);
    }
  };

  const handleAssignUsersFromCombobox = (checklistId) => {
    setSelectedChecklistId(checklistId);
    setIsAssignModalOpen(true);
  };

  const handleEditChecklist = (chk) => {
    setOpenMenuId(null);
    setEditChecklistData({
      checklistId: chk.id,
      checklistType: chk.checklist_type,
      priority: chk.priority || "", // default if not set
    });
    setIsEditModalOpen(true);
  };

  const handleAddChecklist = async (e) => {
    e.preventDefault();
    const finalType =
      checklistType === "Other" ? customChecklist : checklistType;

    try {
      const payload = {
        checklist_type: finalType,
        priority: newPriority ? priorityMap[newPriority] : null,
      };
      await addChecklist({
        appId: selectedAppId,
        payload,
      }).unwrap();

      // reset
      setChecklistType("");
      setCustomChecklist("");
      setShowModal(false);
    } catch (err) {
      console.error("Failed to add checklist:", err);
    }
  };

  return (
    <div className="space-y-2">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-900">
          Checklists{" "}
          {currentApp && (
            <span className="text-gray-900 dark:text-gray-900 font-bold">
              for {currentApp.name}
            </span>
          )}
        </h1>
        {/* <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 text-sm text-gray-800 dark:text-gray-700">
            <p className="font-semibold">Priorities: </p>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-green-600" fill="currentColor" />
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-blue-600" fill="currentColor" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-red-600" fill="currentColor" />
              <span>High</span>
            </div>
          </div>
        </div> */}

        <div className="relative gap-3 text-left flex">
          <Button
            variant={"outline"}
            className="px-3 py-2 border rounded-md bg-white shadow-sm"
            onClick={() => setShowChecklistsFilter((prev) => !prev)}
          >
            Filters
          </Button>
          {showChecklistsFilters && (
            <div className="absolute mt-2 w-56 rounded-md shadow-lg bg-white border z-[9999]">
              <div className="p-2">
                <label className="block text-sm font-medium">Sort By</label>
                <select
                  value={cListSortBy}
                  onChange={(e) =>
                    updateCListSearchParams({ cListSortBy: e.target.value })
                  }
                  className="w-full mt-1 px-2 py-1 border rounded-md text-sm"
                >
                  <option value="created_at">Created At</option>
                  <option value="checklist_type">Name</option>
                  <option value="updated_at">Last Updated</option>
                  <option value="priority">Priority</option>
                </select>
              </div>
              <div className="p-2">
                <label className="block text-sm font-medium">Sort Order</label>
                <select
                  value={cListSortOrder}
                  onChange={(e) =>
                    updateCListSearchParams({ cListSortOrder: e.target.value })
                  }
                  className="w-full mt-1 px-2 py-1 border rounded-md text-sm"
                >
                  <option value="asc">Low - High</option>
                  <option value="desc">High - Low</option>
                </select>
              </div>
              {/* <div className="p-2">
                    <label className="block text-sm font-medium">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full mt-1 px-2 py-1 border rounded-md text-sm"
                    >
                      <option value="all">All</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div> */}
            </div>
          )}
          {user.role === "admin" && (
            <div className="">
              <Button
                variant={"outline"}
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Checklist
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 w-full items-center py-2 border-y-2">
        <div className="flex-col w-1/5 flex items-center">
          <h3>Select application</h3>
          <AppsCombobox
            items={apps.map((app) => ({ value: app.appId, label: app.name }))}
            selectedValue={selectedAppId}
            onSelect={(value) => {
              const app = apps.find((a) => a.appId === value);
              if (app) handleSelectApp(app);
            }}
            placeHolder="Select an App"
            searchValue={useSelector(selectAppSearchTerm)}
            onSearchValueChange={(val) => dispatch(setAppSearchTerm(val))}
          />
        </div>
        <div className="flex-col w-1/5 flex items-center">
          <h3>Select Checklist</h3>
          <ChecklistCombobox
            checklists={allChecklists?.checklists}
            selectedChecklistId={selectedChecklistId}
            onSelect={handleSelectChecklist}
            onEdit={handleEditChecklist}
            onDelete={handleDeleteChecklist}
            onAssignUsers={handleAssignUsersFromCombobox}
            placeHolder="Select a checklist..."
            searchValue={checklistSearchTerm}
            onSearchValueChange={(val) => dispatch(setChecklistSearchTerm(val))}
            isAdmin={user.role === "admin"}
          />
        </div>
      </div>

      {/* Checklist Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Checklist Content */}

        {!selectedChecklistId && (
          <div className="p-1">
            <div className="text-center py-12">
              <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Select a checklist to see its controls
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Choose from the tabs above or create a new checklist
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Assign Users Modal */}
      <AssignUsersModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        checklistId={selectedChecklistId}
      />

      {/* Add Checklist Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Create Checklist
            </h2>
            <form onSubmit={handleAddChecklist} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Checklist Type
                </label>
                <select
                  value={checklistType}
                  onChange={(e) => setChecklistType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Select Type --</option>
                  <option value="Checklist Infra">Checklist Infra</option>
                  <option value="Checklist AppSec">Checklist AppSec</option>
                  <option value="Checklist for IAM">Checklist for IAM</option>
                  <option value="AI application checklist">
                    AI application checklist
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {Object.entries(priorityMap).map(([label, value]) => (
                    <option key={value} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
                {/* <input
                  type="text"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter custom checklist name"
                  required
                /> */}
              </div>

              {checklistType === "Other" && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Custom Checklist Name
                  </label>
                  <input
                    type="text"
                    value={customChecklist}
                    onChange={(e) => setCustomChecklist(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter custom checklist name"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setChecklistType("");
                    setCustomChecklist("");
                  }}
                  className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAdding ? "Adding..." : "Add Checklist"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Edit Checklist
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await updateChecklist({
                    checklistId: editChecklistData.checklistId,
                    payload: {
                      checklist_type: editChecklistData.checklistType,
                      priority: editChecklistData.priority
                        ? priorityMap[editChecklistData.priority]
                        : null, // send null if not selected
                    },
                  }).unwrap();
                  toast.success("Checklist updated successfully");
                  setIsEditModalOpen(false);
                } catch (err) {
                  console.error("Failed to update checklist:", err);
                  toast.error("Failed to update checklist");
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Checklist Name
                </label>
                <input
                  type="text"
                  value={editChecklistData.checklistType}
                  onChange={(e) =>
                    setEditChecklistData({
                      ...editChecklistData,
                      checklistType: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Priority
                </label>
                <select
                  value={editChecklistData.priority}
                  onChange={(e) =>
                    setEditChecklistData({
                      ...editChecklistData,
                      priority: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select Priority --</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checklists;
