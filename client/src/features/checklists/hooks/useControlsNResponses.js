import { useSearchParams } from "react-router-dom";

import { useGetAllControlsWithResponsesQuery } from "@/features/checklists/store/controlsApiSlice";

export const useControlsNResponses = (checklistId) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const controlsPage = parseInt(searchParams.get("controlsPage") || "1", 10);
  const controlsPageSize = parseInt(
    searchParams.get("controlsPageSize") || "10",
    10
  );
  const controlsSortBy = searchParams.get("controlsSortBy") || "created_at";
  const controlsSortOrder = searchParams.get("controlsSortOrder") || "desc";

  const { data, isSuccess, isError, error } =
    useGetAllControlsWithResponsesQuery({
      checklistId,
      page: controlsPage,
      page_size: controlsPageSize,
      sort_by: controlsSortBy,
      sort_order: controlsSortOrder,
    });

  const updateSearchParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null) newParams.delete(key);
      else newParams.set(key, value);
    });
    setSearchParams(newParams);
  };

  const goToPage = (controlsPage) => {
    updateSearchParams({ controlsPage });
    console.log("APP PAGE RECIEVED TO GOT FUNC", controlsPage);
  };

  return {
    controlsPage,
    controlsPageSize,
    controlsSortBy,
    controlsSortOrder,
    isError,
    error,
    goToPage,
    updateSearchParams,
    data,
  };
};
