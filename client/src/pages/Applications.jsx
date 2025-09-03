import { useState, useEffect } from "react";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { useSelector, useDispatch } from "react-redux";
import { Save, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  selectCurrentApp,
  setCurrentApplication,
  loadAllApps,
  loadApps,
} from "../store/appSlices/applicationSlice";
import {
  useAddApplicationMutation,
  useGetApplicationsQuery,
  useUpdateApplicationMutation,
  useLazyGetApplicationsQuery,
} from "../store/apiSlices/applicationApiSlice";

const Applications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data, isSuccess } = useGetApplicationsQuery();

  const [addAppMutation] = useAddApplicationMutation();
  const [updateAppMutation] = useUpdateApplicationMutation();

  const currentApp = useSelector(selectCurrentApp);

  // Form state
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

  // Sync form fields when currentApp changes
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
    if (isSuccess && data) {
      dispatch(loadApps(data));
    }
  }, [data, dispatch, isSuccess]);

  const allApps = useSelector(loadAllApps);

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
    "30%",
    "70%",
  ];

  return (
    <div className="h-screen mt-2 font-sans">
      <Allotment
        defaultSizes={savedSizes}
        onChange={(sizes) =>
          localStorage.setItem("paneSizes", JSON.stringify(sizes))
        }
      >
        {/* Left Pane: App List */}
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

        {/* Right Pane: Create/Edit App Form */}
        <div className="p-6 overflow-y-auto">
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
                  <span>
                    <span>"Save"</span>
                    <Save className="w-4 h-4" />
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
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition"
              >
                Show Checklist
              </Link>
            )}
          </div>
        </div>
      </Allotment>
    </div>
  );
};

export default Applications;
