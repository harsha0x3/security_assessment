import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import {
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUpIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useChecklists } from "@/features/checklists/hooks/useChecklists";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  useAddApplicationMutation,
  useUpdateApplicationMutation,
  useSetAppPriorityMutation,
} from "../store/applicationApiSlice";
import { toast } from "sonner";
import {
  Card,
  CardTitle,
  CardAction,
  CardContent,
  CardDescription,
} from "@/components/ui/Card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import ChecklistItem from "@/features/checklists/components/ChecklistItem";
import { useApplications } from "../hooks/useApplications";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AppDetailsSheet = ({ selectedApp = null }) => {
  console.log("SESELCTED APP IN SHEET", selectedApp);
  const user = useSelector(selectAuth);
  const [isEditing, setIsEditing] = useState(false);
  const isAdmin = user.role === "admin";
  const isNew = isAdmin && !selectedApp;
  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const [newPriorityVal, setNewPriorityVal] = useState(
    selectedApp?.priority ?? 2
  );

  const { appDetails } = useApplications({ appId: selectedApp?.id });
  const { data: appChecklists } = useChecklists({ appIdProp: selectedApp?.id });
  const [
    setApppriority,
    { error: prioritySetError, isLoading: isSettingPriority },
  ] = useSetAppPriorityMutation();
  console.log("APP CHECKLISTS", appChecklists);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: appDetails || {},
  });

  const getPriorityLabel = (priorityVal) => {
    switch (priorityVal) {
      case 1:
        return "Low";
      case 2:
        return "Medium";
      case 3:
        return "High";
      default:
        return "Unset";
    }
  };

  const sheetDesc = selectedApp
    ? `Below are the details of the app ${selectedApp.name}`
    : "Create New app here";

  const [addAppMutation, { error: appAddError, isLoading: isAdding }] =
    useAddApplicationMutation();
  const [updateAppMutation, { error: updateAppError, isLoading: isUpdating }] =
    useUpdateApplicationMutation();

  useEffect(() => {
    reset(appDetails || {});
  }, [appDetails, reset]);
  useEffect(() => {
    if (appAddError) {
      toast.error("Failed to create new app", {
        description: appAddError?.data?.detail || "",
      });
    }
  }, [appAddError]);

  useEffect(() => {
    if (updateAppError) {
      toast.error("Failed to edit the app", {});
    }
  }, [updateAppError]);
  useEffect(() => {
    if (prioritySetError) {
      toast.error("Failed to edit the app", {});
    }
  }, [prioritySetError]);

  const handleSaveEdit = async (payload) => {
    try {
      toast.promise(
        (async () => {
          await updateAppMutation({ appId: appDetails.id, payload }).unwrap();
          setIsEditing(false);
        })(),
        {
          loading: "Saving Changes...",
          success: "Changes saved successfully!",
          error: "Failed to save changes",
        }
      );
    } catch (err) {
      toast.error("Failed to save changes", {
        description: JSON.stringify(err),
      });
      console.error("Failed to save app changes:", err);
    }
  };
  const handlePrioritySave = async () => {
    if (!selectedApp) return;

    try {
      toast.promise(
        setApppriority({
          appId: selectedApp.id,
          priority: newPriorityVal,
        }).unwrap(),
        {
          loading: "Updating priority...",
          success: "Priority updated successfully!",
          error: "Failed to update priority",
        }
      );
      setIsEditingPriority(false);
    } catch (err) {
      console.error("Priority update failed:", err);
    }
  };

  const handleNewApp = async (payload) => {
    try {
      toast.promise(
        (async () => {
          await addAppMutation({ payload });
        })(),
        {
          loading: "Creating new app...",
          success: `App ${payload.name} created successfully!`,
          error: "Failed to create new app",
        }
      );
    } catch (error) {
      toast.error("Failed to save responses", {
        description: JSON.stringify(error),
      });
      console.error("Failed to save responses:", error);
    }
  };

  const onSubmit = async (data) => {
    if (isEditing) {
      await handleSaveEdit(data);
    } else if (isAdmin && (isEditing || isNew)) {
      await handleNewApp(data);
    } else {
      return;
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      id="app_details"
      className="flex flex-col h-full"
    >
      <SheetHeader>
        <SheetTitle className="">
          <Label htmlFor="name">Application Name</Label>
          {isAdmin && (isEditing || isNew) ? (
            <Input
              className="text-xl"
              id="name"
              {...register("name", { required: true })}
            />
          ) : (
            <p className="text-xl text-primary">{appDetails?.name}</p>
          )}
          {errors.name && <p className="text-red-500">Name is required</p>}
        </SheetTitle>
        <SheetDescription className="h-full">
          {isEditing
            ? sheetDesc + `. Start Editing the Application`
            : sheetDesc}
        </SheetDescription>
      </SheetHeader>

      {/* Fields */}
      <ScrollArea>
        <div className="px-4 flex-1 flex flex-col gap-3 pt-2 overflow-auto">
          <div className="relative border rounded-md px-3 pt-5 pb-2">
            <Label
              htmlFor="description"
              className="absolute -top-2 left-2 bg-background px-1 text-sm font-medium"
            >
              Description:
            </Label>
            {isAdmin && (isEditing || isNew) ? (
              <Textarea
                className="shadow-none"
                id="description"
                {...register("description")}
              />
            ) : (
              <p className="text-sm">{appDetails?.description || "—"}</p>
            )}
          </div>

          <div className="relative border rounded-md px-3 pt-5 pb-2">
            <Label
              htmlFor="priority"
              className="absolute -top-2 left-2 bg-background px-1 text-sm font-medium"
            >
              Priority:
            </Label>
            {isEditingPriority ? (
              <div className="flex gap-2 items-center w-full">
                <select
                  value={newPriorityVal}
                  onChange={(e) => setNewPriorityVal(Number(e.target.value))}
                  className="block appearance-none w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value={1}>Low</option>
                  <option value={2}>Medium</option>
                  <option value={3}>High</option>
                </select>
                <Button
                  size="sm"
                  onClick={handlePrioritySave}
                  disabled={isSettingPriority}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingPriority(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <p className="text-sm">
                  {getPriorityLabel(appDetails?.priority)}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingPriority(true)}
                >
                  Edit
                </Button>
              </div>
            )}
          </div>

          <div className="relative border rounded-md px-3 pt-5 pb-2">
            <Label
              htmlFor="owner_name"
              className="absolute -top-2 left-2 bg-background px-1 text-sm font-medium"
            >
              Owner Name
            </Label>
            {isAdmin && (isEditing || isNew) ? (
              <Input
                className="shadow-none"
                id="owner_name"
                {...register("owner_name")}
              />
            ) : (
              <p className="text-sm">{appDetails?.owner_name || "—"}</p>
            )}
          </div>

          <div className="relative border rounded-md px-3 pt-5 pb-2">
            <Label
              htmlFor="provider_name"
              className="absolute -top-2 left-2 bg-background px-1 text-sm font-medium"
            >
              Provider / Vendor
            </Label>
            {isAdmin && (isEditing || isNew) ? (
              <Input
                className="shadow-none"
                id="provider_name"
                {...register("provider_name")}
              />
            ) : (
              <p className="text-sm">{appDetails?.provider_name || "—"}</p>
            )}
          </div>

          <div className="relative border rounded-md px-3 pt-5 pb-2">
            <Label
              htmlFor="platform"
              className="absolute -top-2 left-2 bg-background px-1 text-sm font-medium"
            >
              Platform
            </Label>
            {isAdmin && (isEditing || isNew) ? (
              <Input
                className="shadow-none"
                id="platform"
                {...register("platform")}
              />
            ) : (
              <p className="text-sm">{appDetails?.platform || "—"}</p>
            )}
          </div>

          <div className="relative border rounded-md px-3 pt-5 pb-2">
            <Label
              htmlFor="region"
              className="absolute -top-2 left-2 bg-background px-1 text-sm font-medium"
            >
              Region
            </Label>
            {isAdmin && (isEditing || isNew) ? (
              <Input
                className="shadow-none"
                id="region"
                {...register("region")}
              />
            ) : (
              <p className="text-sm">{appDetails?.region || "—"}</p>
            )}
          </div>

          <div className="relative border rounded-md px-3 pt-5 pb-2">
            <Label
              htmlFor="app_tech"
              className="absolute -top-2 left-2 bg-background px-1 text-sm font-medium"
            >
              App Technology
            </Label>
            {isAdmin && (isEditing || isNew) ? (
              <Input
                className="shadow-none"
                id="app_tech"
                {...register("app_tech")}
              />
            ) : (
              <p className="text-sm">{appDetails?.app_tech || "—"}</p>
            )}
          </div>

          <div className="relative border rounded-md px-3 pt-5 pb-2">
            <Label
              htmlFor="infra_host"
              className="absolute -top-2 left-2 bg-background px-1 text-sm font-medium"
            >
              Infra Host
            </Label>
            {isAdmin && (isEditing || isNew) ? (
              <Input
                className="shadow-none"
                id="infra_host"
                {...register("infra_host")}
              />
            ) : (
              <p className="text-sm">{appDetails?.infra_host || "—"}</p>
            )}
          </div>

          <div className="relative border rounded-md px-3 pt-5 pb-2">
            <Label
              htmlFor="department"
              className="absolute -top-2 left-2 bg-background px-1 text-sm font-medium"
            >
              Department
            </Label>
            {isAdmin && (isEditing || isNew) ? (
              <Input
                className="shadow-none"
                id="department"
                {...register("department")}
              />
            ) : (
              <p className="text-sm">{appDetails?.department || "—"}</p>
            )}
          </div>

          <div className="relative border rounded-md px-3 pt-5 pb-2">
            <Label
              htmlFor="created_at"
              className="absolute -top-2 left-2 bg-background px-1 text-sm font-medium"
            >
              Created On
            </Label>

            <p className="text-sm">{appDetails?.created_at || "—"}</p>
          </div>
          <div className="relative border rounded-md px-3 pt-5 pb-2">
            <Label
              htmlFor="updated_at"
              className="absolute -top-2 left-2 bg-background px-1 text-sm font-medium"
            >
              Updated On
            </Label>

            <p className="text-sm">{appDetails?.updated_at || "—"}</p>
          </div>
          {!isNew && !isEditing && (
            <Card>
              <Collapsible>
                <div className="flex items-center justify-between px-6 py-3">
                  <CardTitle>Show App checklists: </CardTitle>
                  <CardDescription asChild>
                    <p>{`Total Checklists: ${
                      appChecklists?.total_count || 0
                    }`}</p>
                  </CardDescription>
                  <CardAction>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm">
                        <span className="[[data-state=open]>&]:hidden">
                          Show
                        </span>
                        <span className="[[data-state=closed]>&]:hidden">
                          Hide
                        </span>
                        <ChevronUpIcon className="[[data-state=closed]>&]:rotate-180" />
                      </Button>
                    </CollapsibleTrigger>
                  </CardAction>
                </div>
                <CollapsibleContent>
                  <CardContent>
                    {appChecklists &&
                      appChecklists.checklists &&
                      appChecklists.checklists.map((chk) => (
                        <ChecklistItem checklist={chk} />
                      ))}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}
        </div>
      </ScrollArea>
      <DropdownMenuSeparator />
      <SheetFooter>
        <div className="flex gap-2 items-center">
          {!isNew && (
            <div>
              <div
                className="group inline-flex items-center gap-2"
                data-state={isEditing ? "checked" : "unchecked"}
              >
                {isEditing && (
                  <span
                    id={`edit-app-yes`}
                    className="group-data-[state=checked]:text-muted-foreground/70 cursor-pointer text-right text-sm font-medium"
                    aria-controls="edit-app"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </span>
                )}
                <Switch
                  id="edit-app"
                  checked={isEditing}
                  onCheckedChange={setIsEditing}
                  aria-labelledby={`edit-app-yes edit-app-no`}
                  className="focus-visible:border-ring-green-600 dark:focus-visible:border-ring-green-400 focus-visible:ring-green-600/20 data-[state=checked]:bg-green-600 dark:focus-visible:ring-green-400/40 dark:data-[state=checked]:bg-green-400"
                />
                <span
                  id={`edit-app-no`}
                  className="group-data-[state=unchecked]:text-muted-foreground/70 cursor-pointer text-left text-sm font-medium"
                  aria-controls="edit-app"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </span>
              </div>
            </div>
          )}
          {(isEditing || isNew) && (
            <Button
              size="sm"
              form="app_details"
              type="submit"
              disabled={isUpdating || isAdding}
            >
              Save
            </Button>
          )}
        </div>
      </SheetFooter>
    </form>
  );
};

export default AppDetailsSheet;
