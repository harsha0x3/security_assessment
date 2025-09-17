import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";

import { selectCurrentChecklist } from "@/store/appSlices/checklistsSlice";
import { useGetAllControlsWithResponsesQuery } from "@/store/apiSlices/controlsApiSlice";

export const useControlsNResponses = (checklistId) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentChecklist = useSelector(selectCurrentChecklist);
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
