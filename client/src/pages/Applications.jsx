import { useState, useEffect } from "react";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { useSelector, useDispatch } from "react-redux";
import { Save, X, CheckCircle, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useGetAllChecklistsQuery } from "../store/apiSlices/checklistsApiSlice";
import {
  selectCurrentApp,
  setCurrentApplication,
  loadAllApps,
  loadApps,
} from "../store/appSlices/applicationSlice";
import {
  selectAllChecklists,
  loadChecklists,
} from "../store/appSlices/checklistsSlice";
import {
  useAddApplicationMutation,
  useGetApplicationsQuery,
  useUpdateApplicationMutation,
} from "../store/apiSlices/applicationApiSlice";

const Applications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data, isSuccess } = useGetApplicationsQuery();

  const [addAppMutation] = useAddApplicationMutation();
  const [updateAppMutation] = useUpdateApplicationMutation();

  const allChecklists = useSelector(selectAllChecklists);
  const currentApp = useSelector(selectCurrentApp);
  const allApps = useSelector(loadAllApps);

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
  const [selectedAppId, setSelectedAppId] = useState(null);
  const { data: appChecklists, isSuccess: checklistsSuccess } =
    useGetAllChecklistsQuery(selectedAppId);

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
    }
  }, [currentApp, isNewApp]);

  useEffect(() => {
    if (appChecklists && checklistsSuccess) {
      dispatch(loadChecklists(appChecklists));
    }
  }, [appChecklists, dispatch, checklistsSuccess]);

  useEffect(() => {
    if (isSuccess && data) {
      dispatch(loadApps(data));
    }
  }, [data, dispatch, isSuccess]);

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
  };

  const handleSelect = (appId) => {
    setSelectedAppId(appId);
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
      };
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
    };
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

  // Load initial sizes from localStorage
  const savedSizes = JSON.parse(localStorage.getItem("paneSizes")) || [
    "20%",
    "50%",
    "30%",
  ];

  return (
    <div className="h-screen mt-2 font-sans">
      <Allotment
        defaultSizes={savedSizes}
        onChange={(sizes) =>
          localStorage.setItem("paneSizes", JSON.stringify(sizes))
        }
      >
        {/* Left Pane: Applications List */}
        <div className="p-4 border-r border-gray-300 bg-gray-50 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Applications</h3>
          <button
            onClick={handleCreateNewApp}
            className="w-full mb-4 px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            + New App
          </button>
          <ul className="space-y-2">
            {allApps.map((app) => (
              <li
                key={app.appId}
                onClick={() => handleSelect(app.appId)}
                className="p-2 rounded-md border border-gray-300 hover:bg-blue-50 cursor-pointer"
              >
                {app.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Middle Pane: Create/Edit Form */}
        <div className="p-6 overflow-y-auto border-r border-gray-300">
          <h3 className="text-xl font-semibold mb-4">
            {isNewApp ? "Create New Application" : "Edit Application"}
          </h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">App Name</label>
              <input
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="App Name"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                disabled={!isEditing && !isNewApp}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!isEditing && !isNewApp}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Platform
                </label>
                <input
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  disabled={!isEditing && !isNewApp}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Region</label>
                <input
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  disabled={!isEditing && !isNewApp}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Owner Name
                </label>
                <input
                  className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Owner Name"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  disabled={!isEditing && !isNewApp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Provider / Vendor
                </label>
                <input
                  className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Provider Name"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  disabled={!isEditing && !isNewApp}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Infra Host
                </label>
                <input
                  className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Infra Host"
                  value={infraHost}
                  onChange={(e) => setInfraHost(e.target.value)}
                  disabled={!isEditing && !isNewApp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  App Technology
                </label>
                <input
                  className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="App Tech"
                  value={appTech}
                  onChange={(e) => setAppTech(e.target.value)}
                  disabled={!isEditing && !isNewApp}
                />
              </div>
            </div>
          </form>

          <div className="flex gap-3 mt-4">
            {isNewApp && (
              <button
                type="button"
                onClick={handleCreateNewAppSubmit}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition"
              >
                Create
              </button>
            )}
            {!isNewApp && (
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
            )}
            {!isNewApp && isEditing && (
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
              <Link
                to={`/${currentApp?.appId}/checklists`}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition"
              >
                Show Checklist
              </Link>
            )}
          </div>
        </div>

        {/* Right Pane: Checklist Details */}
        <div className="p-6 overflow-y-auto bg-gray-50">
          <h3 className="text-xl font-semibold mb-4">Checklists</h3>
          {allChecklists.length === 0 ? (
            <p className="text-gray-500">No checklists available.</p>
          ) : (
            <ul className="space-y-4">
              {allChecklists.map((chk) => (
                <li
                  key={chk.checklistId}
                  className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2">
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
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Created: {new Date(chk.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Updated: {new Date(chk.updatedAt).toLocaleString()}
                  </p>

                  {chk.assignedUsers && chk.assignedUsers.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold mb-1">
                        Assigned Users:
                      </h5>
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
      </Allotment>
    </div>
  );
};

export default Applications;
