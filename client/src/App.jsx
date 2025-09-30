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
import { Toaster } from "sonner";
// Import components
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import RootLayout from "./layouts/RootLayout";
import ProtectedLayout from "./layouts/ProtectedLayout";
import { setError, selectAuth } from "./features/auth/store/authSlice";
import TrashPage from "./features/trash/pages/TrashPage";
import ApplicationsPage from "./features/applications/pages/ApplicationsPage";
import {
  ChecklistSkeleton,
  ControlsSkeleton,
} from "./features/skeletons/ChecklistSkeleton";

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
  const ChecklistsPage = lazy(() =>
    import("@/features/checklists/pages/ChecklistsPage")
  );

  const AddUsers = lazy(() =>
    import("@/features/userManagement/pages/AddUsers")
  );
  const Profile = lazy(() => import("@/features/userManagement/pages/Profile"));
  const Controls = lazy(() =>
    import("@/features/checklists/components/Controls")
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
      dispatch(setCurrentApplication({ appId: data?.apps[0]?.id }));
      console.log("first", data?.apps[0]?.id);
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
      <Toaster
        position="bottom-right"
        richColors
        toastOptions={{
          success: {
            style: {
              "--normal-bg":
                "color-mix(in oklab, light-dark(var(--color-green-600), var(--color-green-400)) 10%, var(--background))",
              "--normal-text":
                "light-dark(var(--color-green-600), var(--color-green-400))",
              "--normal-border":
                "light-dark(var(--color-green-600), var(--color-green-400))",
            },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedLayout />}>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<Navigate to={`applications`} replace />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route
              path=":appId/checklists"
              element={
                <Suspense fallback={<ChecklistSkeleton />}>
                  <ChecklistsPage />
                </Suspense>
              }
            >
              <Route
                path=":checklistId"
                element={
                  <Suspense fallback={<ControlsSkeleton />}>
                    <Controls />
                  </Suspense>
                }
              />
            </Route>
            <Route
              path="addUsers"
              element={
                <Suspense fallback={<div>Loading...</div>}>
                  <AddUsers />
                </Suspense>
              }
            />
            <Route
              path="profile"
              element={
                <Suspense fallback={<div>Loading...</div>}>
                  <Profile />
                </Suspense>
              }
            />
            <Route path="trash" element={<TrashPage />} />
            <Route
              path="pre-assessment"
              element={
                <Suspense fallback={<ChecklistSkeleton />}>
                  <PreAssessmentPage />
                </Suspense>
              }
            >
              <Route index element={<Navigate to="user" replace />} />
              <Route
                path="user"
                element={
                  <Suspense fallback={<ChecklistSkeleton />}>
                    <PreAssessmentUser />
                  </Suspense>
                }
              />
              <Route
                path="modify"
                element={
                  <Suspense fallback={<ChecklistSkeleton />}>
                    <PreAssessmentsDash />
                  </Suspense>
                }
              />
              <Route
                path="submissions"
                element={
                  <Suspense fallback={<ChecklistSkeleton />}>
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
