import { useState } from "react";
import {
  useGetTrashedAppsQuery,
  useRestoreTrashedAppsMutation,
} from "../../applications/store/applicationApiSlice";
import { useGetTrashedChecklistsQuery } from "../../checklists/store/checklistsApiSlice";
import { Clock, CheckCircle, ArchiveRestore } from "lucide-react";
import { toast } from "react-toastify";
const TrashPage = () => {
  const { data: trashedApps, isSuccess } = useGetTrashedAppsQuery();
  const [selectedTrashAppId, setSelectedTrashAppId] = useState(null);
  const { data: trashChecklists, isSuccess: isFetchedTrashChecklists } =
    useGetTrashedChecklistsQuery(selectedTrashAppId, {
      skip: !selectedTrashAppId,
    });

  const [restoreApp, { isLoading }] = useRestoreTrashedAppsMutation();

  console.log("trashedApps", trashedApps);
  const handleSelectApp = (id) => {
    setSelectedTrashAppId(id);
  };

  const handleRestoreApp = async (appId) => {
    try {
      const restoredApp = await restoreApp(appId);
    } catch (error) {
      console.error(error);
      toast.error("Error restoring app");
    }
  };

  return (
    <div className="flex">
      <div>
        {isSuccess && trashedApps && (
          <ul className="space-y-2 overflow-y-auto flex-1 pr-1">
            {trashedApps.map((app) => {
              const isSelected = app.id === selectedTrashAppId;
              return (
                <li
                  key={app.id}
                  onClick={() => handleSelectApp(app.id)}
                  className={`p-3 rounded-md border cursor-pointer shadow-sm transition hover:shadow-md 
          ${
            isSelected
              ? "bg-blue-100 border-blue-500"
              : "border-gray-300 hover:bg-blue-50"
          } ${
                    app.is_completed ? "ring-2 ring-green-500" : ""
                  } flex justify-between`}
                >
                  <div className="flex justify-between">
                    <span>{app.name}</span>
                    <span>
                      {app.is_completed ? (
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
                  <button className="flex" onClick={() => restoreApp(app.id)}>
                    <ArchiveRestore />
                    <span>Restore</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="p-4 h-full flex flex-col">
        <h3 className="text-xl font-bold mb-4 text-center border-b pb-2 border-gray-200">
          Checklists
        </h3>
        {isFetchedTrashChecklists && trashChecklists.length === 0 ? (
          <>
            {!selectedTrashAppId ? (
              <p className="text-gray-500 text-center mt-6">
                Select an Application to see the checklists
              </p>
            ) : (
              <p className="text-gray-500">No checklists available.</p>
            )}
          </>
        ) : (
          <ul className="space-y-2 overflow-y-auto flex-1 pr-1">
            {trashChecklists?.map((chk) => (
              <li
                key={chk.id}
                className={`p-4 rounded-lg border border-gray-200 shadow-sm transition hover:shadow-md ${
                  chk.is_completed ? "bg-green-50" : "bg-white"
                }`}
              >
                <div className="text-lg font-medium cursor-pointer hover:text-blue-600 flex items-center justify-between">
                  <h4 className="text-lg font-medium cursor-pointer">
                    {chk.checklistType}
                  </h4>
                  {chk.is_completed ? (
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
    </div>
  );
};

export default TrashPage;
