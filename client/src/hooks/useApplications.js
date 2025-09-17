import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  loadApps,
  setCurrentApplication,
  selectCurrentApp,
} from "@/store/appSlices/applicationSlice";
import { selectAppSearchTerm } from "@/store/appSlices/filtersSlice";
import { useGetApplicationsQuery } from "@/store/apiSlices/applicationApiSlice";

export const useApplications = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const appPage = parseInt(searchParams.get("appPage") || "1", 10);
  const appPageSize = parseInt(searchParams.get("appPagSize") || "10", 10);
  const appSortBy = searchParams.get("appSortBy") || "created_at";
  const appSortOrder = searchParams.get("appSortOrder") || "desc";
  const appSearchBy = searchParams.get("appSearchBy") || "name";

  const appSearch = useSelector(selectAppSearchTerm);
  const currentApp = useSelector(selectCurrentApp);

  const [lastAppPage, setLastAppPage] = useState(appPage);

  // API Query
  const { data, isSuccess, isError, error } = useGetApplicationsQuery(
    {
      page: appPage,
      page_size: appPageSize,
      sort_by: appSortBy,
      sort_order: appSortOrder,
      search: appSearch || "",
      search_by: appSearchBy,
    },
    { skip: !appSortBy || !appSortOrder }
  );

  // Load apps into Redux when fetched
  useEffect(() => {
    if (isSuccess && data) {
      dispatch(loadApps(data));
      if (data?.apps?.length > 0) {
        dispatch(setCurrentApplication(data.apps[0].id));
      }
    }
  }, [data, isSuccess, dispatch]);

  // Sync search term with URL params
  useEffect(() => {
    const handler = setTimeout(() => {
      if (appSearch && appSearch.trim() !== "") {
        if (appPage >= 1) setLastAppPage(appPage);
        updateSearchParams({
          appSearch: appSearch,
          appSearchBy: "name",
          appPage: -1,
        });
      } else {
        updateSearchParams({ appSearch: null, appPage: lastAppPage });
      }
    }, 600);

    return () => clearTimeout(handler);
  }, [appSearch]);

  const updateSearchParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null) newParams.delete(key);
      else newParams.set(key, value);
    });
    setSearchParams(newParams);
  };

  const goToPage = (appPage) => {
    updateSearchParams({ appPage });
    console.log("APP PAGE RECIEVED TO GOT FUNC", appPage);
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
  };
};
