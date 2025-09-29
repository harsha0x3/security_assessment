import { useSelector, useDispatch } from "react-redux";
import {
  loadChecklists,
  selectAllChecklists,
  selectCurrentChecklist,
} from "../store/checklistsSlice";

import { loadAllApps } from "../../applications/store/applicationSlice";
import { useGetAllChecklistsQuery } from "../store/checklistsApiSlice";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card } from "../../../components/ui/Card";
import { Button } from "@/components/ui/button";
import { useImportControlsMutation } from "../store/controlsApiSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImportIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import AppPagination from "@/features/applications/components/AppPagination";

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
  console.log("APP CHECK", appChecklists);

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
    <Dialog className="">
      <DialogTrigger asChild>
        <Button variant="outline">
          <ImportIcon className="w-5 h-5" /> Import Controls
        </Button>
      </DialogTrigger>
      <DialogContent className="mb-8 flex h-4/5 min-w-3/5 flex-col justify-between gap-3 p-6">
        <DialogHeader className="contents space-y-0 text-left p-0">
          <DialogTitle>Import Controls from Another Checklist</DialogTitle>
        </DialogHeader>
        <DialogDescription asChild>
          <div className="flex gap-6 h-full p-1 pb-3">
            <div className="border rounded-lg flex-1 h-full flex flex-col items-center">
              <h2 className="text-lg font-semibold p-2 bg-muted w-full rounded-t-lg">
                Applications
              </h2>
              <ScrollArea className="flex-1 overflow-auto py-3">
                <div className="flex flex-col gap-2">
                  {allApps &&
                    allApps.map((app) => (
                      <Button
                        key={app.appId}
                        variant={`${
                          app.appId === selectedAppId ? "default" : "outline"
                        }`}
                        onClick={() => setSelectedAppId(app.appId)}
                      >
                        {app.name}
                      </Button>
                    ))}
                </div>
              </ScrollArea>
              <AppPagination />
            </div>

            <div className="border rounded-lg flex-1 h-full flex flex-col items-center">
              <h2 className="text-lg font-semibold p-2 bg-muted w-full rounded-t-lg">
                Checklists
              </h2>
              <ScrollArea className="flex-1 overflow-auto">
                <div className="flex flex-col">
                  {appChecklists &&
                    appChecklists.checklists.map((chk) => (
                      <Button
                        key={chk.id}
                        variant={`${
                          chk.id === selectedChecklistId ? "default" : "outline"
                        }`}
                        onClick={() => setSelectedchecklistId(chk.id)}
                      >
                        {chk.checklist_type}
                      </Button>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

export default ImportControls;
