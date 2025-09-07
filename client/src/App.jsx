// App.jsx - Main App Component with Router Setup
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useGetApplicationsQuery } from "./store/apiSlices/applicationApiSlice";
import {
  loadApps,
  setCurrentApplication,
} from "./store/appSlices/applicationSlice";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
// Import components
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import Assessments from "./pages/Assessments";
import Profile from "./pages/Profile";
import RootLayout from "./layouts/RootLayout";
import ProtectedLayout from "./layouts/ProtectedLayout";

import Applications from "./pages/Applications";
import Checklists from "./pages/Checklists";
import Controls from "./components/core/Controls";
import ChecklistsLayout from "./layouts/ChecklistsLayout";
import AddUsers from "./pages/AddUsers";

function App() {
  const { data, isSuccess } = useGetApplicationsQuery();
  const dispatch = useDispatch();
  useEffect(() => {
    if (data && isSuccess) {
      dispatch(loadApps(data));
      dispatch(setCurrentApplication({ appId: data[0]?.id }));
    }
  }, [data, isSuccess, dispatch]);

  return (
    <Router>
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
              <Route index element={<Navigate to="/applications" replace />} />
              {/* <Route path="dashboard" element={<Dashboard />} /> */}
              <Route path="applications" element={<Applications />} />
              <Route path=":appId/checklists" element={<ChecklistsLayout />}>
                <Route path=":checklistId" element={<Controls />} />
              </Route>
              <Route path="addUsers" element={<AddUsers />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
