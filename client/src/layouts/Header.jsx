// Enhanced Header with minimal design and sidebar toggle
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useSelector, useDispatch } from "react-redux";
import {
  selectAppSearchTerm,
  selectChecklistSearchTerm,
  setAppSearchTerm,
  setChecklistSearchTerm,
} from "../store/appSlices/filtersSlice";
import { selectCurrentApp } from "../features/applications/store/applicationSlice";
import {
  User,
  Settings,
  LogOut,
  FolderSearch,
  TextSearch,
  PanelLeftOpen,
  PanelLeftClose,
  ChevronDown,
} from "lucide-react";

const Header = ({ onToggleSidebar, isSidebarCollapsed }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const appSearchTearm = useSelector(selectAppSearchTerm);
  const checklistSearchTearm = useSelector(selectChecklistSearchTerm);
  const currentApp = useSelector(selectCurrentApp);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const dropdownRef = useRef(null);
  const { logout, selectUser } = useAuth();

  const user = selectUser();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-12">
      <div className="flex items-center justify-between px-4 py-3 h-full">
        {/* Left Section - Sidebar Toggle + App Name */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-7 h-7 text-gray-600 dark:text-gray-300" />
            ) : (
              <PanelLeftClose className="w-7 h-7 text-gray-600 dark:text-gray-300" />
            )}
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Assessment Portal
            </h1>
          </div>
        </div>
        {/* Mid Section - Search bars */}

        <div className="flex-1 mx-6">
          <div className="flex gap-2 w-5/6 ">
            <div className="flex gap-2 px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white">
              <FolderSearch />
              <input
                type="text"
                value={appSearchTearm}
                onChange={(e) => dispatch(setAppSearchTerm(e.target.value))}
                placeholder="Search Apps"
                className="focus:ring-2 focus:ring-blue-500 w-full rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2 px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white">
              <TextSearch />
              <input
                type="text"
                value={checklistSearchTearm}
                onChange={(e) =>
                  dispatch(setChecklistSearchTerm(e.target.value))
                }
                placeholder={`Checklists for ${currentApp?.name}`}
                className="focus:ring-2 focus:ring-blue-500 w-full rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Right Section - Notifications + Profile */}
        <div className="flex items-center space-x-4">
          {/* <button className="relative p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors">
            <Bell className="w-5 h-5" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button> */}

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.firstName?.[0] || user?.username?.[0] || "U"}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.username || "User"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {/* Dropdown PanelLeftOpen */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setIsProfileOpen(false);
                    }}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                  >
                    <User className="w-4 h-4 mr-3" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                    }}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-600" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
