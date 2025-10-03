import { useApplications } from "../hooks/useApplications";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/Card";

import { Label } from "@/components/ui/label";
import {
  setCurrentApplication,
  setCurrentApp,
} from "../store/applicationSlice";
import { selectAuth } from "@/features/auth/store/authSlice";
import { Button } from "@/components/ui/button";
import { ListPlusIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  selectAppSearchTerm,
  setAppSearchTerm,
} from "@/store/appSlices/filtersSlice";
import AppFilters from "../components/AppFilters";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AppDetailsSheet from "../components/AppDetailsSheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AppPagination from "../components/AppPagination";
import AppStats from "../components/AppStats";

const ApplicationsPage = () => {
  const dispatch = useDispatch();
  const {
    appPageSize,
    appSearchBy,
    data: allAppData,
    totalApps,
  } = useApplications();
  const appSearchTerm = useSelector(selectAppSearchTerm);
  const userInfo = useSelector(selectAuth);
  const totalPages = useMemo(
    () => totalApps / appPageSize,
    [appPageSize, totalApps]
  );

  const [selectedAppId, setSelectedAppId] = useState();
  useEffect(() => {
    console.log("SELECTED APP", selectedAppId);
  }, [selectedAppId]);

  const handleSelectApp = useCallback(
    (app) => {
      setSelectedAppId(app.id);
      // dispatch(setCurrentApplication(app.id));
      dispatch(setCurrentApp(app));
    },
    [dispatch]
  );

  useEffect(() => {
    console.log("TOTAL APPS", totalApps);
    console.log("TOTAL PAGES", totalPages);
  }, [totalApps, totalPages]);

  return (
    <TooltipProvider>
      {/* <div className="w-full h-full flex gap-2"> */}
      <Card className="h-full flex flex-col overflow-hidden rounded-md shadow-none">
        {/* Header */}
        <CardHeader className="bg-muted p-2 text-accent-foreground">
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
              <div className="relative max-w-64 min-w-32">
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
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <ScrollArea>
          <CardContent className="flex-1 overflow-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(allAppData?.apps) && allAppData.apps.length > 0 ? (
              allAppData.apps.map((app) => {
                const isSelected = app.id === selectedAppId;
                return (
                  <Card
                    key={app.appId}
                    className={`p-4 border rounded-lg shadow hover:shadow-lg transition-transform transform hover:-translate-y-1 ${
                      isSelected ? "border-primary border-l-8" : "border-black"
                    }`}
                    onClick={() => setSelectedAppId(app.id)}
                  >
                    <CardHeader className="p-0 mb-2">
                      <CardTitle className="text-lg font-bold ">
                        {app.name}
                      </CardTitle>
                      <CardDescription className="text-accent-muted">
                        {app.description || "No description"}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-0 grid grid-cols-1 gap-2">
                      <Label className="flex justify-between">
                        Owner:{" "}
                        <span className="font-medium">{app.owner_name}</span>
                      </Label>
                      <Label className="flex justify-between">
                        Vendor:{" "}
                        <span className="font-medium">
                          {app.provider_name || "None"}
                        </span>
                      </Label>
                      <Label className="flex justify-between">
                        Created At:{" "}
                        <span className="font-medium">
                          {new Date(app.created_at + "Z").toLocaleString()}
                        </span>
                      </Label>
                      <Label className="flex justify-between">
                        Due Date: <span className="font-medium">None</span>
                      </Label>
                    </CardContent>
                    <CardFooter className="pb-0 pt-2 text-right flex justify-between px-1">
                      <div></div>
                      <Sheet className="">
                        <SheetTrigger asChild>
                          <CardAction>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectApp(app)}
                            >
                              Details
                            </Button>
                          </CardAction>
                        </SheetTrigger>
                        <SheetContent className="h-full">
                          <AppDetailsSheet selectedApp={app} />
                        </SheetContent>
                      </Sheet>
                    </CardFooter>
                  </Card>
                );
              })
            ) : (
              <div className="text-muted col-span-full text-center mt-20">
                No apps available
              </div>
            )}
          </CardContent>
        </ScrollArea>

        {/* Footer */}

        {allAppData?.apps?.length < totalApps && (
          <CardFooter className="bg-accent p-1 shrink-0 bottom-0">
            <AppPagination />
          </CardFooter>
        )}
      </Card>
      {/* <Card className="w-2/5 max-w-2/5 h-full flex flex-col overflow-hidden rounded-md shadow-none">
          <CardHeader className="bg-muted p-2 text-accent-foreground rounded-t-md">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-xl font-semibold">Stats</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <AppStats />
          </CardContent>
        </Card> */}
      {/* </div> */}
    </TooltipProvider>
  );
};

export default ApplicationsPage;
