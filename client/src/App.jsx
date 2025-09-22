// App.jsx - Main App Component with Router Setup
import { Routes, Route, Navigate } from "react-router-dom";
import { useGetApplicationsQuery } from "./features/applications/store/applicationApiSlice";
import { useGetCurrentUserQuery } from "./features/auth/store/authApiSlice";
import {
  loadApps,
  setCurrentApplication,
} from "./features/applications/store/applicationSlice";
import { lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
// Import components
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import Profile from "./features/userManagement/pages/Profile";
import RootLayout from "./layouts/RootLayout";
import ProtectedLayout from "./layouts/ProtectedLayout";

import Applications from "./features/applications/pages/Applications";
import Controls from "./features/checklists/components/Controls";
import ChecklistsPage from "./features/checklists/pages/ChecklistsPage";
import AddUsers from "./features/userManagement/pages/AddUsers";
import { setError, selectAuth } from "./features/auth/store/authSlice";
import TrashPage from "./features/trash/pages/TrashPage";
import UserDash from "./features/dashboard/pages/UserDash";
import AdminDash from "./features/dashboard/pages/AdminDash";

function App() {
  const user = useSelector(selectAuth);

  const PreAssessmentPage = lazy(() =>
    import("./features/preAssessments/pages/PreAssessmentPage")
  );
  const PreAssessmentsDash = lazy(() =>
    import("@/features/preAssessments/pages/PreAssessmentsDash")
  );
  const PreAssessmentUser = lazy(() =>
    import("@/features/preAssessments/pages/preAssessmentUser")
  );
  const PreAssessmentSubmissions = lazy(() =>
    import("@/features/preAssessments/pages/PreAssessmentSubmissions")
  );

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
            <Route index element={<Navigate to={`user_dashboard`} replace />} />
            <Route path="user_dashboard" element={<UserDash />} />
            <Route path="admin_dashboard" element={<AdminDash />} />
            <Route path="applications" element={<Applications />} />
            <Route path=":appId/checklists" element={<ChecklistsPage />}>
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
            >
              <Route index element={<Navigate to="user" replace />} />
              <Route
                path="user"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <PreAssessmentUser />
                  </Suspense>
                }
              />
              <Route
                path="modify"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <PreAssessmentsDash />
                  </Suspense>
                }
              />
              <Route
                path="submissions"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <PreAssessmentSubmissions />
                  </Suspense>
                }
              />
            </Route>
          </Route>
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
