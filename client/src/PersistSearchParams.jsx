import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const PersistSearchParams = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Convert current search params to a plain object
    const paramsObj = Object.fromEntries([...searchParams]);

    let updated = false;

    // Ensure appPage always exists
    if (!paramsObj.appPage) {
      searchParams.set("appPage", "1");
      updated = true;
    }

    // Optionally, you could add default values for other params dynamically
    // e.g., searchParams.set("appSortBy", "created_at");

    if (updated) {
      // Replace URL without adding history entry
      navigate(
        { pathname: location.pathname, search: searchParams.toString() },
        { replace: true }
      );
    }
  }, [location.pathname, searchParams, navigate]);

  return children;
};

export default PersistSearchParams;
