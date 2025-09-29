import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCurrentChecklist,
  loadChecklists,
  setCurrentChecklist,
} from "@/features/checklists/store/checklistsSlice";
import { selectCurrentApp } from "@/features/applications/store/applicationSlice";
import { selectChecklistSearchTerm } from "@/store/appSlices/filtersSlice";
import { useGetAllChecklistsQuery } from "@/features/checklists/store/checklistsApiSlice";

export const useChecklists = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { appId: paramAppId } = useParams();
  const currentApp = useSelector(selectCurrentApp);

  const cListPage = parseInt(searchParams.get("cListPage") || "1", 10);
  const cListPageSize = parseInt(searchParams.get("cListPageSize") || "10", 10);
  const cListSortBy = searchParams.get("cListSortBy") || "created_at";
  const cListSortOrder = searchParams.get("cListSortOrder") || "desc";
  const cListSearchBy = searchParams.get("cListSearchBy") || "checklist_type";

  const cListSearch = useSelector(selectChecklistSearchTerm);
  const currentChecklist = useSelector(selectCurrentChecklist);

  const [lastCListPage, setLastCListPage] = useState(cListPage);

  const { data, isSuccess, isError, error } = useGetAllChecklistsQuery(
    {
      appId: currentApp?.appId ?? paramAppId,
      page: cListPage,
      page_size: cListPageSize,
      sort_by: cListSortBy,
      sort_order: cListSortOrder,
      search: cListSearch || "",
      search_by: cListSearchBy,
    },
    { skip: !currentApp?.appId || !paramAppId, refetchOnMountOrArgChange: true }
  );

  // Load checklists into Redux when fetched
  useEffect(() => {
    if (isSuccess && data) {
      dispatch(loadChecklists(data));
      if (data?.checklists?.length > 0) {
        dispatch(setCurrentChecklist(data.checklists[0].id));
      }
    }
  }, [data, isSuccess, dispatch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (cListSearch && cListSearch.trim() !== "") {
        if (cListPage >= 1) setLastCListPage(cListPage);
        updateSearchParams({
          cListSearch: cListSearch,
          cListSearchBy: "checklist_type",
          cListPage: -1,
        });
      } else {
        updateSearchParams({ cListSearch: null, cListPage: lastCListPage });
      }
    }, 600);

    return () => clearTimeout(handler);
  }, [cListSearch]);

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
    currentChecklist,
    cListPage,
    cListPageSize,
    cListSortBy,
    cListSortOrder,
    cListSearchBy,
    cListSearch,
    isError,
    error,
    goToPage,
    updateSearchParams,
    data,
  };
};
