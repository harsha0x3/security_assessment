// App.jsx - Main App Component with Router Setup
import { Routes, Route, Navigate } from "react-router-dom";
import { useGetApplicationsQuery } from "./store/apiSlices/applicationApiSlice";
import { useGetCurrentUserQuery } from "./store/apiSlices/authApiSlice";
import {
  loadApps,
  setCurrentApplication,
} from "./store/appSlices/applicationSlice";
import { lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
// Import components
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Profile from "./pages/Profile";
import RootLayout from "./layouts/RootLayout";
import ProtectedLayout from "./layouts/ProtectedLayout";

import Applications from "./pages/Applications";
import Controls from "./components/core/Controls";
import ChecklistsLayout from "./layouts/ChecklistsLayout";
import AddUsers from "./pages/AddUsers";
import { setError, selectAuth } from "./store/appSlices/authSlice";
import TrashPage from "./pages/TrashPage";

function App() {
  const user = useSelector(selectAuth);

  const PreAssessmentPage = lazy(() => import("./pages/PreAssessmentPage"));

  const { data, isSuccess } = useGetApplicationsQuery(
    { sort_by: "created_at", sort_order: "desc" },
    {
      skip: !user.isAuthenticated,
    }
  );
  const dispatch = useDispatch();
  useEffect(() => {
    if (data && isSuccess) {
      dispatch(loadApps(data));
      dispatch(setCurrentApplication({ appId: data[0]?.id }));
    }
  }, [data, isSuccess, dispatch]);

  const { data: userData, isSuccess: isUserLoggedIn } =
    useGetCurrentUserQuery();
  const isAuthenticated = user.isAuthenticated;

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(setError(null));
    }
  }, [isAuthenticated, dispatch]);

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable={false}
        theme="light"
        toastClassName={() =>
          "bg-white shadow-lg rounded-xl text-gray-900 text-sm p-3 flex items-center gap-2"
        }
        bodyClassName={() => "flex items-center"}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedLayout />}>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<Navigate to={`applications`} replace />} />
            {/* <Route path="dashboard" element={<Dashboard />} /> */}
            <Route path="applications" element={<Applications />} />
            <Route path=":appId/checklists" element={<ChecklistsLayout />}>
              <Route path=":checklistId" element={<Controls />} />
            </Route>
            <Route path="addUsers" element={<AddUsers />} />
            <Route path="profile" element={<Profile />} />
            <Route path="trash" element={<TrashPage />} />
            <Route
              path="pre-assessment"
              element={
                <Suspense fallback={<div>Loading...</div>}>
                  <PreAssessmentPage />
                </Suspense>
              }
            />
          </Route>
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
