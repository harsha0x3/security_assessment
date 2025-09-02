import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  selectCurrentApp,
  setCurrentApplication,
  loadAllApps,
} from "../store/appSlices/applicationSlice";
import {
  setCurrentChecklist,
  loadChecklists,
  selectAllChecklists,
  selectCurrentChecklist,
} from "../store/appSlices/checklistsSlice";
import {
  useGetAllChecklistsQuery,
  useAddChecklistMutation,
} from "../store/apiSlices/checklistsApiSlice";
import AssignUsersModal from "../components/core/AssignUsersModal";

const Checklists = () => {
  const { appId: paramAppId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const apps = useSelector(loadAllApps);
  const currentApp = useSelector(selectCurrentApp);
  const checklists = useSelector(selectAllChecklists);
  const currentChecklist = useSelector(selectCurrentChecklist);
  const [selectedAppId, setSelectedAppId] = useState(
    paramAppId || currentApp?.appId
  );
  const { checklistId: paramChecklistId } = useParams();
  const [selectedChecklistId, setSelectedChecklistId] = useState(
    paramChecklistId || currentChecklist?.checklistId
  );

  // Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [checklistType, setChecklistType] = useState("");
  const [customChecklist, setCustomChecklist] = useState("");

  // API hooks
  const { data, isSuccess } = useGetAllChecklistsQuery(selectedAppId);
  const [addChecklist, { isLoading: isAdding }] = useAddChecklistMutation();

  // Load checklists when app changes
  useEffect(() => {
    if (data && isSuccess) {
      dispatch(loadChecklists(data));
    }
  }, [data, dispatch, isSuccess]);

  // Handle app tab click
  const handleSelectApp = (app) => {
    setSelectedAppId(app.appId);
    dispatch(setCurrentApplication({ appId: app.appId }));
    navigate(`/${app.appId}/checklists`);
  };

  // Handle checklist click
  const handleSelectChecklist = (chk) => {
    dispatch(setCurrentChecklist({ checklistId: chk.checklistId }));
    setSelectedChecklistId(chk.checklistId);
    navigate(`/${selectedAppId}/checklists/${chk.checklistId}`);
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
    <div className="mt-20 px-4">
      {/* App Tabs */}
      <div className="flex border-b border-gray-300 mb-4">
        {apps.map((app) => (
          <button
            key={app.appId}
            onClick={() => handleSelectApp(app)}
            className={`px-4 py-2 font-medium ${
              selectedAppId === app.appId
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            {app.name}
          </button>
        ))}
      </div>

      {/* Checklist Tabs */}
      <div className="flex border-b justify-between border-gray-200 mb-4">
        <div className="flex border-b border-gray-200 mb-4">
          {checklists.map((chk) => (
            <button
              key={chk.checklistId}
              onClick={() => handleSelectChecklist(chk)}
              className={`px-4 py-2 font-medium ${
                selectedChecklistId === chk.checklistId
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              {chk.checklistType}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="border rounded-md bg-blue-400 px-4 py-2 text-white"
          >
            Add Checklist
          </button>
          {selectedChecklistId && (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="px-4 py-2 mt-2 bg-blue-600 text-white rounded-md"
            >
              Assign Users
            </button>
          )}
        </div>

        <AssignUsersModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          checklistId={selectedChecklistId}
        />
      </div>

      {/* Checklist Content */}
      <div className="mt-4">
        {currentChecklist ? (
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {currentChecklist.checklistType} Controls
            </h3>
            <div className="border rounded-md p-4 text-gray-500">
              Controls table will go here
            </div>
          </div>
        ) : (
          <p className="text-gray-500">
            Select a checklist to see its controls.
          </p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-xl font-semibold mb-4">Create Checklist</h2>
            <form onSubmit={handleAddChecklist} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Checklist Type
                </label>
                <select
                  value={checklistType}
                  onChange={(e) => setChecklistType(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  required
                >
                  <option value="">-- Select --</option>
                  <option value="Checklist Infra">Checklist Infra</option>
                  <option value="Checklist AppSec">Checklist AppSec</option>
                  <option value="Checklist for IAM">Checklist for IAM</option>
                  <option value="AI application checklist">
                    AI application checklist
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Extra input only if "Other" is selected */}
              {checklistType === "Other" && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Enter Custom Checklist Name
                  </label>
                  <input
                    type="text"
                    value={customChecklist}
                    onChange={(e) => setCustomChecklist(e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-md border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-4 py-2 rounded-md bg-blue-500 text-white"
                >
                  {isAdding ? "Adding..." : "Add"}
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
