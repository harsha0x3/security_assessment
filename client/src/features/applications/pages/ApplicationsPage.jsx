import React, { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
  CardAction,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, ListPlusIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useApplications } from "../hooks/useApplications";
import AppDetailsSheet from "../components/AppDetailsSheet";
import { useSelector, useDispatch } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import { ChecklistMiniCard } from "@/features/checklists/components/ChecklistItem";

import {
  selectAppSearchTerm,
  setAppSearchTerm,
} from "@/store/appSlices/filtersSlice";
import AppFilters from "../components/AppFilters";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { setCurrentApp } from "../store/applicationSlice";
import { Label } from "@/components/ui/label";
import AppPagination from "../components/AppPagination";
import { useNavigate } from "react-router-dom";
const groupChecklistsByStatus = (checklists) => {
  return {
    pending: checklists.filter(
      (c) => c.status === "pending" || c.status === ""
    ),
    inProgress: checklists.filter(
      (c) => c.status === "in-progress" || c.status === "inprogress"
    ),
    approved: checklists.filter((c) => c.status === "approved"),
    rejected: checklists.filter((c) => c.status === "rejected"),
    completed: checklists.filter((c) => c.status === "completed"),
  };
};

const getAppStatus = (app) => {
  if (!app) return "pending";

  if (app.status === "pending" || app.status === "") return "pending";
  if (app.status === "in-progress" || app.status === "inprogress")
    return "in-progress";
  if (app.status === "completed" || app.is_completed) return "completed";

  return "pending";
};
const AppCard = ({ app, onDetailsClick, accentColor }) => {
  const dispatch = useDispatch();
  const { appPage } = useApplications();
  const groupedChecklists = app.checklists
    ? groupChecklistsByStatus(app.checklists)
    : {
        pending: [],
        inProgress: [],
        approved: [],
        rejected: [],
        completed: [],
      };
  const totalChecklists = app.checklists ? app.checklists.length : 0;
  console.log("groupedChecklists", groupedChecklists);

  // Calculate completion percentage
  const completedChecklists = groupedChecklists.approved.length;
  const progressPercent = totalChecklists
    ? Math.round((completedChecklists / totalChecklists) * 100)
    : 0;

  const isNewApp =
    new Date(app.created_at + "Z").toLocaleDateString() ===
    new Date().toLocaleDateString();
  const navigate = useNavigate();

  return (
    <Card className="flex flex-col p-0 border rounded-lg shadow hover:shadow-lg transition-transform transform hover:-translate-y-1 max-h-[28rem] ">
      {/* Header */}
      <CardHeader className="p-0 mb-2 bg-muted rounded-t-lg w-full ">
        <div className="flex flex-row items-center justify-between px-4 pt-2">
          <CardTitle className="text-lg font-bold line-clamp-2">
            {app.name}
          </CardTitle>
          {isNewApp && (
            <Badge className="ml-2 bg-green-500 text-white text-xs shrink-0">
              New
            </Badge>
          )}
        </div>
        <CardDescription className="text-accent-muted line-clamp-2 px-4 pb-1">
          {app.description || "No description"}
        </CardDescription>
        {/* Minimal progress bar */}
        {totalChecklists > 0 && (
          <div className="h-1 bg-gray-200 rounded-full mx-4 mb-2">
            <div
              className="h-1 bg-emerald-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </CardHeader>

      {/* Checklists */}
      <CardContent
        className={`flex-1 flex flex-col min-h-0 overflow-hidden pb-2 px-4`}
      >
        {totalChecklists > 0 ? (
          <div className="flex-1 flex flex-col min-h-0 space-y-2 overflow-hidden">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground px-4">
              <span>Checklists</span>
              <Badge variant="outline" className="text-xs">
                {totalChecklists}
              </Badge>
            </div>

            {/* Scrollable area */}
            <ScrollArea className="flex-1 min-h-0 overflow-auto">
              <div className="pr-2 space-y-1">
                {groupedChecklists.pending.map((checklist) => (
                  <ChecklistMiniCard key={checklist.id} checklist={checklist} />
                ))}
                {groupedChecklists.inProgress.map((checklist) => (
                  <ChecklistMiniCard key={checklist.id} checklist={checklist} />
                ))}
                {groupedChecklists.approved.map((checklist) => (
                  <ChecklistMiniCard key={checklist.id} checklist={checklist} />
                ))}
                {groupedChecklists.rejected.map((checklist) => (
                  <ChecklistMiniCard key={checklist.id} checklist={checklist} />
                ))}
                {groupedChecklists.completed.map((checklist) => (
                  <ChecklistMiniCard key={checklist.id} checklist={checklist} />
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic text-center px-4">
            No checklists created yet
          </div>
        )}
      </CardContent>

      {/* Footer */}
      <CardFooter className="flex justify-between items-center px-4 pb-2 pt-0">
        <div className="flex items-center gap-3">
          <Label className="text-md">Ticket Id:</Label>
          <p className="text-primary">
            {app?.ticket_id ? app?.ticket_id : "Not available"}
          </p>
        </div>
        <div className="flex flex-row">
          <Sheet>
            <SheetTrigger asChild>
              <CardAction>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDetailsClick(app)}
                >
                  Details
                </Button>
              </CardAction>
            </SheetTrigger>
            <SheetContent className="h-full">
              <AppDetailsSheet selectedApp={app} />
            </SheetContent>
          </Sheet>
          <Button
            variant="link"
            onClick={() => {
              navigate(`/${app.id}/checklists?appPage=${appPage}`);
              dispatch(setCurrentApp(app));
            }}
          >
            Checklists
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

const KanbanColumn = ({
  title,
  apps,
  count,
  color,
  onDetailsClick,
  bgColor,
}) => {
  return (
    <div
      className={`flex flex-col rounded-lg flex-1 h-full border shadow-sm ${bgColor}`}
    >
      <div
        className={`flex items-center justify-between py-3 rounded-t-md px-4 border-b ${color} w-full`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-4 h-4 rounded-full shadow-sm bg-background flex items-center justify-center`}
          >
            <div className={`w-2 h-2 rounded-full ${color} shadow-sm p-0`} />
          </div>

          <h3 className="font-semibold text-sm uppercase tracking-wide">
            {title}
          </h3>
        </div>
        <Badge variant="default" className="text-xs font-bold">
          {count}
        </Badge>
      </div>

      <ScrollArea className="flex-1 pr-4 pb-2 pt-1 px-4">
        <div className="space-y-3">
          {apps.length > 0 ? (
            apps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onDetailsClick={onDetailsClick}
                accentColor={"bg-gradient-to-r from-purple-600 to-blue-600"}
              />
            ))
          ) : (
            <div className="text-center text-sm text-muted-foreground py-8">
              No applications in this status
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const ApplicationsPage = () => {
  const dispatch = useDispatch();
  const userInfo = useSelector(selectAuth);
  const appSearchTerm = useSelector(selectAppSearchTerm);
  const [selectedApp, setSelectedApp] = useState(null);
  const { data: appsData, isLoadingApps, appSearchBy } = useApplications();
  const isAdmin = userInfo?.role === "admin";

  const groupedApps = useMemo(() => {
    if (!appsData?.apps) {
      return {
        pending: [],
        inProgress: [],
        completed: [],
      };
    }

    return {
      pending: appsData.apps.filter((app) => getAppStatus(app) === "pending"),
      inProgress: appsData.apps.filter(
        (app) => getAppStatus(app) === "in-progress"
      ),
      completed: appsData.apps.filter(
        (app) => getAppStatus(app) === "completed"
      ),
    };
  }, [appsData, appSearchTerm]);

  if (isLoadingApps) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  const handleDetailsClick = (app) => {
    setSelectedApp(app);
    dispatch(setCurrentApp(app));
  };

  return (
    <TooltipProvider>
      <div className="h-full w-full flex flex-col gap-2 overflow-hidden">
        {/* Header */}
        <div className="bg-muted p-2 text-accent-foreground">
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2 items-center justify-center">
              <CardTitle className="text-xl font-semibold">
                Applications
              </CardTitle>

              {userInfo?.role === "admin" && (
                <Sheet>
                  <Tooltip>
                    <SheetTrigger asChild>
                      <TooltipTrigger asChild>
                        <Button variant="accent" size="sm">
                          <ListPlusIcon className="mr-1" />
                          New
                        </Button>
                      </TooltipTrigger>
                    </SheetTrigger>
                    <TooltipContent className="max-w-64 text-pretty">
                      <p>Create New App</p>
                    </TooltipContent>
                  </Tooltip>

                  <SheetContent className="h-full">
                    <AppDetailsSheet />
                  </SheetContent>
                </Sheet>
              )}
            </div>

            {/* Search box */}
            <div className="flex gap-2">
              <div className="relative max-w-100 min-w-70">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary h-4 w-4" />
                <Input
                  type="text"
                  name="email_or_username"
                  value={appSearchTerm}
                  onChange={(e) => dispatch(setAppSearchTerm(e.target.value))}
                  placeholder={`Search app by ${appSearchBy}`}
                  className="w-full pl-10 pr-3 py-2 border"
                />
              </div>
              <AppFilters />
              <AppPagination />
            </div>
          </div>
        </div>
        {/* Kanban Board */}
        {/* Kanban Section - 75% */}
        <div className="flex-1 flex flex-row gap-3 overflow-x-auto">
          <KanbanColumn
            title="Pending"
            color="bg-amber-700/50"
            apps={groupedApps.pending}
            count={groupedApps.pending.length}
            onDetailsClick={handleDetailsClick}
            bgColor={
              "bg-gradient-to-br from-amber-500/20 dark:from-amber-700/20 to-muted"
            }
            className="min-w-[250px]"
          />
          <KanbanColumn
            title="In Progress"
            color="bg-blue-500/50"
            apps={groupedApps.inProgress}
            count={groupedApps.inProgress.length}
            bgColor={
              "bg-gradient-to-br from-blue-500/20 dark:from-blue-600/10 to-muted"
            }
            onDetailsClick={handleDetailsClick}
            className="min-w-[250px]"
          />
          <KanbanColumn
            title="Completed"
            color="bg-green-500/50"
            apps={groupedApps.completed}
            count={groupedApps.completed.length}
            onDetailsClick={handleDetailsClick}
            bgColor={
              "bg-gradient-to-br from-green-500/20 dark:from-green-700/20 to-muted"
            }
            className="min-w-[250px]"
          />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ApplicationsPage;
