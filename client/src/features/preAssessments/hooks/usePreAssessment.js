import { useGetSubmittedAssessmentsQuery } from "@/features/preAssessments/store/preAssessmentApiSlice";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

export const usePreAssessment = (searchTerm = "") => {
  const [searchParams, setSearchParams] = useSearchParams();
  const preAssessPage = parseInt(searchParams.get("preAssessPage") || "1", 10);
  const preAssessPageSize = parseInt(
    searchParams.get("preAssessPageSize") || "15",
    10
  );
  // const preAssessSortBy = searchParams.get("preAssessSortBy") || "created_at";
  // const preAssessSortOrder = searchParams.get("preAssessSortOrder") || "desc";
  // const preAssessSearchBy = searchParams.get("preAssessSearchBy") || "id";

  const preAssessSearch = searchTerm;
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  const { data, isSuccess, isError, error } = useGetSubmittedAssessmentsQuery(
    {
      page: preAssessPage,
      search: debouncedSearch || "",
    },
    { refetchOnMountOrArgChange: true }
  );

  const totalPreAssessments = useMemo(() => data?.total_count, [data]);

  const [lastPreAssessPage, setLastPreAssessPage] = useState(preAssessPage);

  const updateSearchParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null) newParams.delete(key);
      else newParams.set(key, value);
    });
    setSearchParams(newParams);
    console.log("NEW PARAMS");
  };

  const goToPage = (preAssessPage) => {
    console.log("PRE ASSESS PAGE RECIEVED TO GOT FUNC", preAssessPage);
    updateSearchParams({ preAssessPage });
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (preAssessSearch && preAssessSearch.trim() !== "") {
        if (preAssessPage >= 1) setLastPreAssessPage(preAssessPage);
        updateSearchParams({
          preAssessSearch: preAssessSearch,
          preAssessPage: -1,
        });
        setDebouncedSearch(preAssessSearch);
      } else {
        updateSearchParams({
          preAssessSearch: null,
          preAssessPage: lastPreAssessPage,
        });
        setDebouncedSearch("");
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [preAssessSearch]);

  return {
    data,
    isSuccess,
    isError,
    error,
    totalPreAssessments,
    goToPage,
    preAssessPage,
    preAssessPageSize,
  };
};
