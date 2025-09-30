import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  loadApps,
  setCurrentApplication,
  selectCurrentApp,
  setCurrentApp,
} from "@/features/applications/store/applicationSlice";
import { selectAppSearchTerm } from "@/store/appSlices/filtersSlice";
import { useGetApplicationsQuery } from "@/features/applications/store/applicationApiSlice";

export const useApplications = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const appPage = parseInt(searchParams.get("appPage") || "1", 10);
  const appPageSize = parseInt(searchParams.get("appPageSize") || "10", 10);
  const appSortBy = searchParams.get("appSortBy") || "created_at";
  const appSortOrder = searchParams.get("appSortOrder") || "desc";
  const appSearchBy = searchParams.get("appSearchBy") || "name";

  const appSearch = useSelector(selectAppSearchTerm);
  const currentApp = useSelector(selectCurrentApp);
  const [debouncedSearch, setDebouncedSearch] = useState(appSearch);
  const [hasSetInitialApp, setHasSetInitialApp] = useState(false);

  const [lastAppPage, setLastAppPage] = useState(appPage);

  console.log("APP PAGE", appPage);

  // API Query
  const { data, isSuccess, isError, error } = useGetApplicationsQuery(
    {
      page: appPage,
      page_size: appPageSize,
      sort_by: appSortBy,
      sort_order: appSortOrder,
      search: debouncedSearch || "",
      search_by: appSearchBy,
    },
    { refetchOnMountOrArgChange: true }
  );

  console.log("APP DATA in useAPP", data);
  const totalApps = useMemo(() => data?.total_count, [data]);

  // Load apps into Redux when fetched
  useEffect(() => {
    if (isSuccess && data) {
      dispatch(loadApps(data));
      if (!hasSetInitialApp && !currentApp && data?.apps?.length > 0) {
        dispatch(setCurrentApp(data.apps[0]));
        setHasSetInitialApp(true);
      }
    }
  }, [data, isSuccess, dispatch, currentApp, hasSetInitialApp]);

  // Sync search term with URL params
  useEffect(() => {
    const handler = setTimeout(() => {
      if (appSearch && appSearch.trim() !== "") {
        if (appPage >= 1) setLastAppPage(appPage);
        updateSearchParams({
          appSearch: appSearch,
          appSearchBy: appSearchBy,
          appPage: -1,
        });
        setDebouncedSearch(appSearch);
      } else {
        updateSearchParams({ appSearch: null, appPage: lastAppPage });
        setDebouncedSearch("");
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [appSearch]);

  const updateSearchParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null) newParams.delete(key);
      else newParams.set(key, value);
    });
    setSearchParams(newParams);
    console.log("NEW PARAMS");
  };

  const goToPage = (appPage) => {
    console.log("APP PAGE RECIEVED TO GOT FUNC", appPage);
    updateSearchParams({ appPage });
  };

  return {
    currentApp,
    appPage,
    appPageSize,
    appSortBy,
    appSortOrder,
    appSearchBy,
    appSearch,
    isError,
    error,
    goToPage,
    updateSearchParams,
    data,
    totalApps,
  };
};
