import { useState, useEffect } from "react";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { useSelector, useDispatch } from "react-redux";
import {
  Save,
  X,
  CheckCircle,
  Clock,
  PackagePlus,
  SquareX,
  Trash2,
  Star,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useGetAllChecklistsQuery } from "../../checklists/store/checklistsApiSlice";
import { toast } from "react-toastify";
import { selectChecklistSearchTerm } from "../../../store/appSlices/filtersSlice";
import { selectAuth } from "../../auth/store/authSlice";
import { setCurrentApplication, loadAllApps } from "../store/applicationSlice";
import { useApplications } from "@/features/applications/hooks/useApplications";
import {
  loadChecklists,
  selectAllChecklists,
  selectCurrentChecklist,
} from "../../checklists/store/checklistsSlice";
import { selectFilteredChecklists } from "../../../store/appSlices/filtersSelector";
import {
  useAddApplicationMutation,
  useUpdateApplicationMutation,
  useDeleteAppMutation,
} from "../store/applicationApiSlice";
import Modal from "../../../components/ui/Modal";
import { Card } from "../../../components/ui/Card";
import { Button } from "@/components/ui/button";
import { useChecklists } from "@/features/checklists/hooks/useChecklists";

const Applications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    currentApp,
    appPage,
    appPageSize,
    appSortBy,
    appSortOrder,
    appSearch,
    goToPage,
    updateSearchParams,
    data,
  } = useApplications();

  const [showAppFilters, setShowAppFilters] = useState(false);

  const [addAppMutation, { error: appAddError }] = useAddApplicationMutation();
  const [updateAppMutation, { error: updateAppError }] =
    useUpdateApplicationMutation();

  const allChecklists = useSelector(selectAllChecklists);
  const allApps = useSelector(loadAllApps);
  const user = useSelector(selectAuth);
  const totalApps = useSelector((state) => state.applications.totalCount);

  // ---------------- Form State ----------------
  const [appName, setAppName] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("");
  const [region, setRegion] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [providerName, setProviderName] = useState("");
  const [infraHost, setInfraHost] = useState("");
  const [appTech, setAppTech] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isNewApp, setIsNewApp] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(currentApp?.appId || null);
  const [appPriority, setAppPriority] = useState(2);
  const [department, setDepartment] = useState("");
  const [isVertical, setIsVertical] = useState(window.innerWidth < 750);
  const [showDeleteModal, setSetShowDeleteModal] = useState(false);
  const [appName4Del, setAppName4Del] = useState("");
  const { data: appChecklists } = useChecklists();

  const currentChecklist = useSelector(selectCurrentChecklist);
  const [deleteApp, { isLoading: deletingApp }] = useDeleteAppMutation();

  useEffect(() => {
    if (appAddError) {
      toast.error(
        appAddError?.data?.detail || "Error creating new application"
      );
    }
  }, [appAddError]);

  useEffect(() => {
    if (updateAppError) {
      toast.error(updateAppError?.data?.detail || "Error updating application");
    }
  }, [updateAppError]);

  useEffect(() => {
    const handleResize = () => {
      setIsVertical(window.innerWidth < 750);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // Sync form with selected app
  useEffect(() => {
    if (currentApp && !isNewApp) {
      setAppName(currentApp.name || "");
      setDescription(currentApp.description || "");
      setPlatform(currentApp.platform || "");
      setRegion(currentApp.region || "");
      setOwnerName(currentApp.ownerName || "");
      setProviderName(currentApp.providerName || "");
      setInfraHost(currentApp.infraHost || "");
      setAppTech(currentApp.appTech || "");
      setAppPriority(currentApp.priority || 2);
      setDepartment(currentApp.department || "");
    }
  }, [currentApp, isNewApp]);

  useEffect(() => {
    if (currentApp?.appId) {
      setSelectedAppId(currentApp.appId);
    }
  }, [currentApp]);

  // ---------------- Handlers ----------------
  const resetForm = () => {
    setAppName("");
    setDescription("");
    setPlatform("");
    setRegion("");
    setOwnerName("");
    setProviderName("");
    setInfraHost("");
    setAppTech("");
    setDepartment("");
    setAppPriority(2);
  };

  const handleSelect = (appId) => {
    setSelectedAppId(appId);
    console.log("CURR APPID", appId);
    dispatch(setCurrentApplication({ appId }));
    setIsNewApp(false);
  };

  const handleCancel = () => {
    setAppName(currentApp.name || "");
    setDescription(currentApp.description || "");
    setPlatform(currentApp.platform || "");
    setRegion(currentApp.region || "");
    setOwnerName(currentApp.ownerName || "");
    setProviderName(currentApp.providerName || "");
    setInfraHost(currentApp.infraHost || "");
    setAppTech(currentApp.appTech || "");
    setIsEditing(false);
  };

  const handleCreateNewApp = () => {
    resetForm();
    setIsNewApp(true);
    setIsEditing(false);
  };

  const handleEdit = async () => {
    if (!isEditing) {
      setIsEditing(true);
    } else {
      const payload = {
        name: appName,
        description,
        platform,
        region,
        owner_name: ownerName,
        provider_name: providerName,
        infra_host: infraHost,
        app_tech: appTech,
        priority: appPriority,
        department,
      };
      console.log("PAYLOAD", payload);
      setIsEditing(false);

      try {
        const result = await updateAppMutation({
          appId: currentApp.appId,
          payload,
        }).unwrap();
        console.debug("App updated:", result);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleCreateCancel = () => {
    resetForm();
    setIsNewApp(false);
  };

  const handleCreateNewAppSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: appName,
      description,
      platform,
      region,
      owner_name: ownerName,
      provider_name: providerName,
      infra_host: infraHost,
      app_tech: appTech,
      priority: appPriority,
      department,
    };
    const firstEmptyField = Object.entries(payload).find(
      ([key, value]) => !value || value === ""
    );

    if (firstEmptyField) {
      const [key] = firstEmptyField;
      toast.error(`Please fill the ${key.replace("_", " ")}`); // show toast for first empty
      return; // stop further execution
    }
    try {
      if (isNewApp) {
        const result = await addAppMutation({ payload }).unwrap();
        console.debug("App created:", result);
        setIsNewApp(false);
      }
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  const priorityMap = { High: 3, Medium: 2, Low: 1 };

  const handleShowAssesmentClick = (appId) => {
    if (currentChecklist && currentChecklist?.checklistId) {
      navigate(`/${appId}/checklists/${currentChecklist?.checklistId}`);
    } else {
      navigate(`/${appId}/checklists`);
    }
  };

  // Load initial sizes from localStorage
  const savedSizes = JSON.parse(localStorage.getItem("paneSizes")) || [
    "250",
    "500",
    "450",
  ];

  const handleDeleteApp = async () => {
    // if (currentApp?.name !== appName4Del) {
    //   console.log(`${currentApp?.name} || ${appName4Del}`);
    //   toast.error("Opps! app name doesn't match.");
    //   setAppName4Del("");
    //   return;
    // }
    try {
      const result = await deleteApp({ appId: selectedAppId }).unwrap();
      toast.success(result?.msg || "Deleted");
      setAppName4Del("");
      setSetShowDeleteModal(false);
    } catch (error) {
      toast.error(error?.data?.detail || "Error deleting app.");
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] overflow-visible">
      <Allotment
        vertical={isVertical}
        // defaultSizes={savedSizes}
        // onChange={(sizes) =>
        //   localStorage.setItem("paneSizes", JSON.stringify(sizes))
        // }
      >
        {/* Left Pane: Applications List */}
        <Allotment.Pane
          minSize={isVertical ? 150 : 250}
          preferredSize={isVertical ? 200 : 370}
          className="bg-white border rounded-xl shadow-sm"
        >
          <div className="p-4 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-center border-b pb-2 border-gray-200">
              Applications
            </h3>
            <div className="flex gap-2">
              {user.role === "admin" && (
                <button
                  onClick={handleCreateNewApp}
                  className="w-1/2 mb-4 px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <PackagePlus />
                  New App
                </button>
              )}
              <div className="relative inline-block text-left">
                <button
                  className="px-3 py-2 border rounded-md bg-white shadow-sm"
                  onClick={() => setShowAppFilters((prev) => !prev)}
                >
                  Filters ⚙️
                </button>
                {showAppFilters && (
                  <div className="absolute mt-2 w-56 rounded-md shadow-lg bg-white border z-[9999]">
                    <div className="p-2">
                      <label className="block text-sm font-medium">
                        Sort By
                      </label>
                      <select
                        value={appSortBy}
                        onChange={(e) =>
                          updateSearchParams({ appSortBy: e.target.value })
                        }
                        className="w-full mt-1 px-2 py-1 border rounded-md text-sm"
                      >
                        <option value="created_at">Created At</option>
                        <option value="name">Name</option>
                        <option value="updated_at">Last Updated</option>
                        <option value="priority">Priority</option>
                      </select>
                    </div>
                    <div className="p-2">
                      <label className="block text-sm font-medium">
                        Sort Order
                      </label>
                      <select
                        value={appSortOrder}
                        onChange={(e) =>
                          updateSearchParams({ appSortOrder: e.target.value })
                        }
                        className="w-full mt-1 px-2 py-1 border rounded-md text-sm"
                      >
                        <option value="asc">Low - High</option>
                        <option value="desc">High - Low</option>
                      </select>
                    </div>
                    {/* <div className="p-2">
                    <label className="block text-sm font-medium">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full mt-1 px-2 py-1 border rounded-md text-sm"
                    >
                      <option value="all">All</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div> */}
                  </div>
                )}
              </div>
            </div>

            <ul className="space-y-2 overflow-y-auto flex-1 pr-1">
              {allApps.map((app) => {
                const isSelected = app.appId === selectedAppId;
                return (
                  <li
                    key={app.appId}
                    onClick={() => handleSelect(app.appId)}
                    className={`p-3 rounded-md border cursor-pointer shadow-sm transition hover:shadow-md 
          ${
            isSelected
              ? "bg-blue-100 border-blue-500"
              : "border-gray-300 hover:bg-blue-50"
          } ${app.isCompleted ? "ring-2 ring-green-500" : ""} flex flex-col`}
                  >
                    <div className="flex justify-between">
                      <span>{app.name}</span>
                      <span>
                        {app.isCompleted ? (
                          <span className="flex">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-sm">Completed</span>
                          </span>
                        ) : (
                          <span className="flex">
                            <Clock className="w-5 h-5 text-yellow-500" />
                            <span className="text-sm">Pending</span>
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      {Array.from({ length: app.priority }, (_, i) => (
                        <span key={i}>
                          <Star className="w-4 h-4" />
                        </span>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="flex gap-3">
              <button
                className="border border-black bg-green-50"
                onClick={() => goToPage(appPage - 1)}
                disabled={appPage <= 1}
              >
                prev
              </button>
              <button
                className="border border-black bg-green-50"
                // disabled={totalApps - appPage * appPageSize <= 0}
                onClick={() => {
                  goToPage(appPage + 1);
                  console.log("TOAL _ SOL", {
                    totalApps,
                    appPage,
                    appPageSize,
                  });
                }}
              >
                next
              </button>
            </div>
          </div>
        </Allotment.Pane>

        {/* Middle Pane: Create/Edit Form */}
        <Allotment.Pane
          minSize={isVertical ? 400 : 450}
          preferredSize={isVertical ? 500 : 620}
        >
          <div
            className={` rounded-xl shadow-sm px-6 py-3 h-full overflow-y-auto`}
          >
            <h3
              className={`text-xl font-bold mb-4 text-center border-b pb-3 ${
                isNewApp ? "border-amber-500" : "border-gray-200"
              }`}
            >
              {isNewApp ? (
                <span className="text-blue-500">
                  Create <span> New</span>
                  Application
                </span>
              ) : isEditing ? (
                "Edit Application"
              ) : (
                "Application Details"
              )}
            </h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  App Name
                </label>
                <input
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  placeholder="App Name"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  readOnly={!isEditing && !isNewApp}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Description
                </label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  readOnly={!isEditing && !isNewApp}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Platform
                  </label>
                  <input
                    className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Platform"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    readOnly={!isEditing && !isNewApp}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Region
                  </label>
                  <input
                    className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    readOnly={!isEditing && !isNewApp}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Owner Name
                  </label>
                  <input
                    className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Owner Name"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    readOnly={!isEditing && !isNewApp}
                  />
                </div>
                <div>
                  <label className="bblock text-sm font-medium mb-1 text-gray-700">
                    Provider / Vendor
                  </label>
                  <input
                    className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Provider Name"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    readOnly={!isEditing && !isNewApp}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Infra Host
                  </label>
                  <input
                    className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Infra Host"
                    value={infraHost}
                    onChange={(e) => setInfraHost(e.target.value)}
                    readOnly={!isEditing && !isNewApp}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    App Technology
                  </label>
                  <input
                    className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="App Tech"
                    value={appTech}
                    onChange={(e) => setAppTech(e.target.value)}
                    readOnly={!isEditing && !isNewApp}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Department
                  </label>
                  <input
                    className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    readOnly={!isEditing && !isNewApp}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Priority
                  </label>

                  {isEditing || isNewApp ? (
                    <select
                      value={appPriority}
                      onChange={(e) => setAppPriority(Number(e.target.value))}
                      className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {Object.entries(priorityMap).map(([label, value]) => (
                        <option key={label} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="px-3 py-2 border rounded-md bg-gray-50 text-gray-700">
                      {Object.keys(priorityMap).find(
                        (key) => priorityMap[key] === appPriority
                      ) || "Unknown"}
                    </p>
                  )}
                </div>
              </div>
            </form>

            <div className="flex gap-3 mt-4">
              {isNewApp && user.role === "admin" && (
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleCreateNewAppSubmit}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCancel}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-700 transition"
                  >
                    <span className="flex">
                      <SquareX /> <span>Cancel</span>
                    </span>
                  </button>
                </div>
              )}
              {!isNewApp && user.role === "admin" && (
                <div className="flex">
                  <button
                    type="button"
                    onClick={handleEdit}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                      isEditing ? "bg-blue-600" : "bg-orange-600"
                    } text-white hover:bg-green-700 transition`}
                  >
                    {isEditing ? (
                      <span className="flex gap-2 items-center">
                        Save <Save className="w-4 h-4" />
                      </span>
                    ) : (
                      "Edit"
                    )}
                  </button>
                  <Button
                    variant="destructive"
                    onClick={() => setSetShowDeleteModal(true)}
                  >
                    <span className="flex">
                      <Trash2 className="w-5 h-5" />
                      <span>Delete</span>
                    </span>
                  </Button>
                  <div>
                    {showDeleteModal && (
                      <Modal
                        open={showDeleteModal}
                        onClose={() => {
                          setSetShowDeleteModal(false);
                          setAppName4Del("");
                        }}
                        title={"Delete Application"}
                      >
                        <Card>
                          <div className="flex flex-col gap-7">
                            <h2>Enter the app name you want to delete</h2>
                            <div className="flex gap-2">
                              <label>App Name:</label>
                              <input
                                placeholder={`App name: ${currentApp?.name}`}
                                value={appName4Del}
                                onChange={(e) => setAppName4Del(e.target.value)}
                                className="focus:ring-2 ring-red-500"
                              />
                            </div>
                            <Button variant="delete" onClick={handleDeleteApp}>
                              <span className="flex">
                                <Trash2 className="w-5 h-5" />
                                <span>Confirm Delete</span>
                              </span>
                            </Button>
                          </div>
                        </Card>
                      </Modal>
                    )}
                  </div>
                </div>
              )}
              {!isNewApp && isEditing && user.role === "admin" && (
                <button
                  type="button"
                  onClick={() => handleCancel()}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              )}
              {!isNewApp && !isEditing && (
                <button
                  onClick={() =>
                    handleShowAssesmentClick(currentApp?.appId || selectedAppId)
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition"
                >
                  Show Assessmnents
                </button>
              )}
            </div>
          </div>
        </Allotment.Pane>
        <Allotment.Pane
          minSize={isVertical ? 400 : 300}
          preferredSize={isVertical ? 400 : 400}
          className="px-6 py-4 bg-white border rounded-xl shadow-sm overflow-y-auto"
        >
          {/* Right Pane: Checklist Details */}
          <div className="p-4 h-full flex flex-col">
            <h3 className="text-xl font-bold mb-4 text-center border-b pb-2 border-gray-200">
              Checklists
            </h3>
            {allChecklists.length === 0 ? (
              <>
                {!selectedAppId ? (
                  <p className="text-gray-500 text-center mt-6">
                    Select an Application to see the checklists
                  </p>
                ) : (
                  <p className="text-gray-500">No checklists available.</p>
                )}
              </>
            ) : (
              <ul className="space-y-2 overflow-y-auto flex-1 pr-1">
                {allChecklists.map((chk) => (
                  <li
                    key={chk.checklistId}
                    className={`p-4 rounded-lg border border-gray-200 shadow-sm transition hover:shadow-md ${
                      chk.isCompleted ? "bg-green-50" : "bg-white"
                    }`}
                  >
                    <div className="text-lg font-medium cursor-pointer hover:text-blue-600 flex items-center justify-between">
                      <h4
                        className="text-lg font-medium cursor-pointer"
                        onClick={() =>
                          navigate(
                            `/${currentApp?.appId}/checklists/${chk.checklistId}`
                          )
                        }
                      >
                        {chk.checklistType}
                      </h4>
                      {chk.isCompleted ? (
                        <span className="flex">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm">Completed</span>
                        </span>
                      ) : (
                        <span className="flex">
                          <Clock className="w-5 h-5 text-yellow-500" />
                          <span className="text-sm">Pending</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(chk.createdAt + "Z").toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Updated: {new Date(chk.updatedAt + "Z").toLocaleString()}
                    </p>
                    <h5 className="text-sm font-semibold mb-1 border-b">
                      Assigned Users:
                    </h5>
                    {chk.assignedUsers && chk.assignedUsers.length > 0 && (
                      <div>
                        <ul className="space-y-1">
                          {chk.assignedUsers.map((user) => (
                            <li
                              key={user.id}
                              className="text-sm text-gray-700 border-b last:border-0 py-1"
                            >
                              {user.username} — {user.email}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
};

export default Applications;
