// Updated Checklists component with better layout integration
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  selectCurrentApp,
  setCurrentApplication,
  loadAllApps,
} from "../store/appSlices/applicationSlice";
import { selectAuth } from "../store/appSlices/authSlice";
import {
  selectFilterdApps,
  selectFilteredChecklists,
} from "../store/appSlices/filtersSelector";
import {
  setCurrentChecklist,
  loadChecklists,
  selectAllChecklists,
  selectCurrentChecklist,
} from "../store/appSlices/checklistsSlice";
import {
  useGetAllChecklistsQuery,
  useAddChecklistMutation,
  useDeleteChecklistMutation,
} from "../store/apiSlices/checklistsApiSlice";
import AssignUsersModal from "../components/core/AssignUsersModal";
import {
  Plus,
  Users,
  CheckSquare,
  CheckCircle2,
  EllipsisVertical,
} from "lucide-react";
import { toast } from "react-toastify";

const Checklists = () => {
  const { appId: paramAppId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const apps = useSelector(selectFilterdApps);
  const currentApp = useSelector(selectCurrentApp);
  const checklists = useSelector(selectFilteredChecklists);
  const currentChecklist = useSelector(selectCurrentChecklist);
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

  // API hooks
  const { data, isSuccess } = useGetAllChecklistsQuery(selectedAppId);
  const [addChecklist, { isLoading: isAdding }] = useAddChecklistMutation();
  const user = useSelector(selectAuth);

  // Load checklists when app changes
  useEffect(() => {
    if (data && isSuccess) {
      dispatch(loadChecklists(data));
    }
  }, [data, dispatch, isSuccess]);

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
    dispatch(setCurrentChecklist({ checklistId: chk.checklistId }));
    setSelectedChecklistId(chk.checklistId);
    navigate(`/${selectedAppId}/checklists/${chk.checklistId}`);
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

  const handleAddChecklist = async (e) => {
    e.preventDefault();
    const finalType =
      checklistType === "Other" ? customChecklist : checklistType;

    try {
      const payload = { checklist_type: finalType };
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
      </div>

      {/* App Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 overflow-x-auto scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thin scrollbar-thumb-slate-700 dark:scrollbar-thumb-slate-200 dark:scrollbar-track-white scrollbar-track-white">
          {apps.map((app) => (
            <button
              key={app.appId}
              onClick={() => handleSelectApp(app)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedAppId === app.appId
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {app.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Checklist Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Checklist Header */}
        <div className="pl-4 py-1  dark:border-gray-700">
          <div className="flex items-center justify-between gap-3">
            <div className="flex space-x-1 overflow-x-auto flex-1 rounded-md scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thin scrollbar-thumb-slate-700 dark:scrollbar-thumb-slate-500 dark:scrollbar-track-gray-800 scrollbar-track-white">
              {checklists.map((chk) => (
                <div
                  key={chk.checklistId}
                  className={`flex items-center gap-2 whitespace-nowrap pl-4 pr-2 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedChecklistId === chk.checklistId
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <button onClick={() => handleSelectChecklist(chk)}>
                    <span>{chk.checklistType}</span>
                    {chk.isCompleted && (
                      <CheckCircle2 className="inline-block pt-1" />
                    )}
                  </button>
                  <div className="relative">
                    {user.role === "admin" && (
                      <button
                        onClick={() => toggleMenu(chk.checklistId)}
                        className="text-gray-500 hover:text-white"
                      >
                        <EllipsisVertical className="pt-1" />
                      </button>
                    )}
                    {openMenuId === chk.checklistId && (
                      <div className="fixed z-50 mt-2 w-36 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg">
                        <button
                          onClick={() => handleDeleteChecklist(chk.checklistId)}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-600 dark:hover:text-white"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {user.role === "admin" && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Checklist
                </button>

                {selectedChecklistId && (
                  <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Assign Users
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

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
    </div>
  );
};

export default Checklists;
