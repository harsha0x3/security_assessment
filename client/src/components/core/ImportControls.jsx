import { useSelector, useDispatch } from "react-redux";
import {
  loadChecklists,
  selectAllChecklists,
  selectCurrentChecklist,
} from "../../store/appSlices/checklistsSlice";

import { loadAllApps } from "../../store/appSlices/applicationSlice";
import { useGetAllChecklistsQuery } from "../../store/apiSlices/checklistsApiSlice";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card } from "../ui/Card";
import { Button } from "@/components/ui/button";
import { useImportControlsMutation } from "../../store/apiSlices/controlsApiSlice";

const ImportControls = ({ targetChecklistId }) => {
  const dispatch = useDispatch();
  const [
    importControls,
    { isLoading: isImportingControls, error: isErrorImporting },
  ] = useImportControlsMutation();

  const allChecklists = useSelector(selectAllChecklists);
  const allApps = useSelector(loadAllApps);

  const [selectedAppId, setSelectedAppId] = useState(null);
  const [selectedChecklistId, setSelectedchecklistId] = useState(null);
  const {
    data: appChecklists,
    isSuccess: checklistsSuccess,
    isError: isChecklistFetchError,
    error: checklistFetchError,
  } = useGetAllChecklistsQuery({ appId: selectedAppId });

  const currentChecklist = useSelector(selectCurrentChecklist);

  useEffect(() => {
    if (isChecklistFetchError && allChecklists.length < 1) {
      let errText =
        checklistFetchError?.data?.detail || "Error loading checklists";
      if (selectedAppId === null) {
        errText =
          errText + "\nPlease select an application to view its checklists.";
      }
      toast.error(errText || "Error loading checklists for this app", {
        autoClose: 4000,
      });
    }
  }, [isChecklistFetchError, checklistFetchError, appChecklists]);

  const handleImportSubmit = async () => {
    const payload = {
      target_checklist_id: targetChecklistId,
      source_checklist_id: selectedChecklistId,
    };

    try {
      const result = await importControls({ payload }).unwrap();
      toast.success(result?.msg || "Imported the controls");
    } catch (error) {
      toast.error(error?.data?.detail || "Error importing controls");
    }
  };
  console.log(appChecklists);

  return (
    <div className="p-6">
      <Card className="p-6 space-y-6 shadow-2xl rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-300 rounded-xl shadow-sm bg-gray-50 w-full">
            <h2 className="text-lg font-semibold mb-4">Applications</h2>
            {allApps &&
              allApps.map((app) => (
                <div
                  className={`${
                    app.appId === selectedAppId
                      ? "bg-blue-500 text-white ring-2 ring-blue-600"
                      : "bg-white"
                  } 
               border rounded-lg px-4 py-2 mb-2 cursor-pointer hover:bg-blue-100 transition w-full`}
                  onClick={() => {
                    setSelectedAppId(app.appId);
                  }}
                  key={app.appId}
                >
                  {app.name}
                </div>
              ))}
          </div>
          <div className="p-6 border border-gray-300 rounded-xl shadow-sm bg-gray-50 w-full">
            <h2 className="text-lg font-semibold mb-4">Checklists</h2>
            {appChecklists &&
              appChecklists.map((chk) => (
                <div
                  className={`${
                    chk.id === selectedChecklistId
                      ? "bg-blue-500 text-white ring-2 ring-blue-600"
                      : "bg-white"
                  } 
                border rounded-lg px-4 py-2 mb-2 cursor-pointer hover:bg-blue-100 transition w-full`}
                  onClick={() => setSelectedchecklistId(chk.id)}
                  key={chk.id}
                >
                  {chk.checklist_type}
                </div>
              ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            variant="outline"
            className="px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition"
            onClick={handleImportSubmit}
          >
            Import
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ImportControls;
