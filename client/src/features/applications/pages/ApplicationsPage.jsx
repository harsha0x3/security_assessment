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
} from "@/components/ui/Card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { loadAllApps, setCurrentApplication } from "../store/applicationSlice";
import { selectAuth } from "@/features/auth/store/authSlice";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListPlusIcon,
  Search,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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

const ApplicationsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    currentApp,
    appPage,
    appPageSize,
    appSortBy,
    appSortOrder,
    appSearch,
    appSearchBy,
    goToPage,
    updateSearchParams,
    data: allAppData,
  } = useApplications();
  const allApps = useSelector(loadAllApps);
  const appSearchTerm = useSelector(selectAppSearchTerm);
  const user = useSelector(selectAuth);
  const totalApps = useSelector((state) => state.applications.totalCount);
  const totalPages = useMemo(
    () => totalApps / appPageSize,
    [appPageSize, totalApps]
  );

  const [selectedAppId, setSelectedAppId] = useState();
  useEffect(() => {
    console.log("SELECTED APP", selectedAppId);
  }, [selectedAppId]);

  const handleSelectApp = useCallback(
    (appId) => {
      setSelectedAppId(appId);
      dispatch(setCurrentApplication(appId));
    },
    [dispatch]
  );

  return (
    <TooltipProvider>
      <div className="w-full h-full">
        <Card className="w-3/5 max-w-3/5 h-full flex flex-col overflow-hidden rounded-lg shadow-none">
          {/* Header */}
          <CardHeader className="bg-muted p-2 text-accent-foreground">
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-2 items-center justify-center">
                <CardTitle className="text-xl font-semibold">
                  Applications
                </CardTitle>
                <Sheet>
                  <Tooltip>
                    <SheetTrigger asChild>
                      <TooltipTrigger asChild>
                        <Button variant="secondary" size="sm">
                          <ListPlusIcon className="mr-1" />
                          New
                        </Button>
                      </TooltipTrigger>
                    </SheetTrigger>
                    <TooltipContent className="max-w-64 text-pretty">
                      <p>Create New App</p>
                    </TooltipContent>
                  </Tooltip>

                  <SheetContent className="h-full overflow-auto">
                    <ScrollArea>
                      <AppDetailsSheet />
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Search box */}
              <div className="flex">
                <div className="relative max-w-64 min-w-32">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
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
            <CardContent className="flex-1 overflow-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {Array.isArray(allAppData?.apps) && allAppData.apps.length > 0 ? (
                allAppData.apps.map((app) => {
                  const isSelected = app.id === selectedAppId;
                  return (
                    <Card
                      key={app.appId}
                      className={`p-4 border rounded-lg shadow hover:shadow-lg transition-transform transform hover:-translate-y-1 ${
                        isSelected ? "border-accent-foreground" : "border-muted"
                      }`}
                    >
                      <CardHeader className="p-0 mb-2">
                        <CardTitle className="text-lg font-bold text-gray-800">
                          {app.name}
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                          {app.description || "No description"}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="p-0 grid grid-cols-1 gap-2 text-gray-700">
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectApp(app.id)}
                            >
                              Details
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="h-full overflow-auto">
                            <ScrollArea>
                              <AppDetailsSheet selectedApp={app} />
                            </ScrollArea>
                          </SheetContent>
                        </Sheet>
                      </CardFooter>
                    </Card>
                  );
                })
              ) : (
                <div className="text-gray-500 col-span-full text-center mt-20">
                  No apps available
                </div>
              )}
            </CardContent>
          </ScrollArea>

          {/* Footer */}
          <CardFooter className="bg-accent p-1">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationLink
                    aria-label="Go to first page"
                    size="icon"
                    className="rounded-full"
                    onClick={() => goToPage(1)}
                  >
                    <ChevronFirstIcon className="h-4 w-4" />
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    aria-label="Go to previous page"
                    size="icon"
                    className="rounded-full"
                    onClick={() => {
                      if (appPage <= 1) return;
                      goToPage(appPage - 1);
                    }}
                    disabled={appPage <= 1}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <Select
                    value={String(appPage)}
                    aria-label="Select page"
                    onValueChange={(value) => goToPage(Number(value))}
                  >
                    <SelectTrigger
                      id="select-page"
                      className="w-fit whitespace-nowrap"
                      aria-label="Select page"
                    >
                      <SelectValue placeholder="Select page" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        { length: Math.ceil(totalPages) },
                        (_, i) => i + 1
                      ).map((page) => (
                        <SelectItem key={page} value={String(page)}>
                          Page {page}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    onClick={() => {
                      if (appPage === totalPages) return;
                      goToPage(appPage + 1);
                    }}
                    disabled={appPage === totalPages}
                    aria-label="Go to next page"
                    size="icon"
                    className="rounded-full"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    onClick={() => goToPage(totalPages)}
                    aria-label="Go to last page"
                    size="icon"
                    className="rounded-full"
                  >
                    <ChevronLastIcon className="h-4 w-4" />
                  </PaginationLink>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default ApplicationsPage;
