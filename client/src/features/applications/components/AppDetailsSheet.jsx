import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { CheckIcon, Edit3, Edit3Icon, XIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  useAddApplicationMutation,
  useUpdateApplicationMutation,
} from "../store/applicationApiSlice";
import { toast } from "sonner";

const AppDetailsSheet = ({ selectedApp = null }) => {
  const user = useSelector(selectAuth);
  const [isEditing, setIsEditing] = useState(false);
  const isAdmin = user.role === "admin";
  const isNew = isAdmin && !selectedApp;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: selectedApp || {},
  });

  const sheetDesc = selectedApp
    ? `Below are the details of the app ${selectedApp.name}`
    : "Create New app here";

  const [addAppMutation, { error: appAddError }] = useAddApplicationMutation();
  const [updateAppMutation, { error: updateAppError }] =
    useUpdateApplicationMutation();

  useEffect(() => {
    reset(selectedApp || {});
  }, [selectedApp, reset]);

  const handleSaveEdit = async (payload) => {
    try {
      toast.promise(
        (async () => {
          await updateAppMutation({ appId: selectedApp.id, payload }).unwrap();
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
    console.log("DATA IN SHEET", data);
    if (isEditing) {
      console.log("Editing the app");
      await handleSaveEdit(data);
    } else {
      console.log("Createing New app");
      await handleNewApp(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} id="app_details">
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
            <p className="text-xl text-gray-700">{selectedApp?.name}</p>
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
      <div className="px-4 flex flex-col gap-3 pt-2">
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
            <p className="text-sm">{selectedApp?.description || "—"}</p>
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
            <p className="text-sm">{selectedApp?.owner_name || "—"}</p>
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
            <p className="text-sm">{selectedApp?.provider_name || "—"}</p>
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
            <p className="text-sm">{selectedApp?.platform || "—"}</p>
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
            <p className="text-sm">{selectedApp?.region || "—"}</p>
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
            <p className="text-sm">{selectedApp?.app_tech || "—"}</p>
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
            <p className="text-sm">{selectedApp?.infra_host || "—"}</p>
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
            <p className="text-sm">{selectedApp?.department || "—"}</p>
          )}
        </div>

        <div className="relative border rounded-md px-3 pt-5 pb-2">
          <Label
            htmlFor="created_at"
            className="absolute -top-2 left-2 bg-background px-1 text-sm font-medium"
          >
            Created On
          </Label>

          <p className="text-sm">{selectedApp?.created_at || "—"}</p>
        </div>
        <div className="relative border rounded-md px-3 pt-5 pb-2">
          <Label
            htmlFor="updated_at"
            className="absolute -top-2 left-2 bg-background px-1 text-sm font-medium"
          >
            Updated On
          </Label>

          <p className="text-sm">{selectedApp?.updated_at || "—"}</p>
        </div>
      </div>

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
            <Button size="sm" form="app_details" type="submit">
              Save
            </Button>
          )}
        </div>
      </SheetFooter>
    </form>
  );
};

export default AppDetailsSheet;
