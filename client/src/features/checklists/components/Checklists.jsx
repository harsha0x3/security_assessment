// Updated Checklists component with better layout integration
import React, { useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { setCurrentApp } from "../../applications/store/applicationSlice";
import { selectAuth } from "../../auth/store/authSlice";
import { AppsCombobox } from "@/features/applications/components/applicationCombobox";
import { ChecklistCombobox } from "@/features/checklists/components/ChecklistCombobox";

import { setCurrentChecklist } from "../store/checklistsSlice";
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
import { CheckSquare, PlusIcon } from "lucide-react";
import { toast } from "react-toastify";

import {
  setChecklistSearchTerm,
  selectChecklistSearchTerm,
} from "@/store/appSlices/filtersSlice";
import { useChecklists } from "@/features/checklists/hooks/useChecklists";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/label";
import ChecklistFilters from "./ChecklistFilters";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import EditChecklist from "./EditChecklist";
import AddChecklist from "./AddChecklist";

const Checklists = () => {
  const { currentApp, data: appsData } = useApplications();
  console.log("APPS DARTA IJN CHK", appsData);
  const apps = useMemo(() => appsData?.apps ?? [], [appsData]);

  const { data: allChecklists } = useChecklists();

  const { appId: paramAppId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { checklistId: paramChecklistId } = useParams();
  const [deleteChecklist, { isLoading: isDeleting, error: deleteError }] =
    useDeleteChecklistMutation();

  const [searchParams, setSearchParams] = useSearchParams();

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editChecklistData, setEditChecklistData] = useState({
    checklistId: null,
    checklistType: "",
  });
  const checklistSearchTerm = useSelector(selectChecklistSearchTerm);

  const user = useSelector(selectAuth);

  // Handle app tab click
  const handleSelectApp = (app) => {
    dispatch(setCurrentApp(app));
    const appPage = searchParams.get("appPage") || 1;
    navigate(`/${app.id}/checklists?appPage=${appPage}`);
  };

  // Handle checklist click
  const handleSelectChecklist = (chk) => {
    dispatch(setCurrentChecklist({ checklistId: chk.id }));
    const appPage = searchParams.get("appPage") || 1;
    navigate(`/${paramAppId}/checklists/${chk.id}?appPage=${appPage}`);
  };

  const handleDeleteChecklist = async (checklistId) => {
    try {
      await deleteChecklist(checklistId).unwrap();
      toast.success("Checklist deleted successfully");
    } catch (err) {
      console.error("Failed to delete checklist:", err);
    }
  };

  const handleEditChecklist = (chk) => {
    setEditChecklistData({
      checklistId: chk.id,
      checklistType: chk.checklist_type,
      priority: chk.priority,
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="grid grid-cols-4 gap-2 items-center justify-between bg-card rounded-sm px-2 py-4 border text-card-foreground">
        <h1 className="flex-shrink-0 text-lg font-bold">
          Checklists{" "}
          {currentApp && (
            <span className="font-bold">for {currentApp.name}</span>
          )}
        </h1>

        <div className="relative flex-col flex items-center">
          <AppsCombobox
            items={apps.map((app) => ({
              value: app.id,
              label: app.name,
            }))}
            selectedValue={paramAppId}
            onSelect={(value) => {
              const app = apps.find((a) => a.id === value);
              if (app) handleSelectApp(app);
            }}
            placeHolder="Select an App"
            searchValue={useSelector(selectAppSearchTerm)}
            onSearchValueChange={(val) => dispatch(setAppSearchTerm(val))}
            className="relative w-full"
          />
          <h3 className="absolute -top-3 right-6 bg-card rounded-md px-1 text-sm">
            Select application
          </h3>
        </div>

        <div className="relative flex-col flex items-center">
          <ChecklistCombobox
            checklists={allChecklists?.checklists}
            selectedChecklistId={paramChecklistId}
            onSelect={handleSelectChecklist}
            onEdit={handleEditChecklist}
            onDelete={handleDeleteChecklist}
            placeHolder="Select a checklist..."
            searchValue={checklistSearchTerm}
            onSearchValueChange={(val) => dispatch(setChecklistSearchTerm(val))}
            isAdmin={user.role === "admin"}
            className="relative w-full"
          />
          <h3 className="absolute -top-3 right-6 bg-card rounded-md px-1 text-sm">
            Select Checklist
          </h3>
        </div>

        <div className="flex gap-2 justify-end items-center">
          <ChecklistFilters />

          {user.role === "admin" && <AddChecklist appId={paramAppId} />}
        </div>
      </div>

      {/* Checklist Management */}
      <div className="bg-background flex-1 overflow-hidden rounded-lg shadow">
        {/* Checklist Content */}

        {!paramChecklistId && (
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

      {/* Add Checklist Modal */}
      {/* <CreateChecklist /> */}
      <EditChecklist
        checklist={editChecklistData}
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
};

export default Checklists;
