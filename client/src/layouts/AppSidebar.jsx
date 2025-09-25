// AppSidebar.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentApp } from "../features/applications/store/applicationSlice";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutGrid,
  CheckSquare,
  Users,
  User,
  Trash,
  ClipboardCheck,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function AppSidebar({ isCollapsed, onToggle, isMobile }) {
  const { logout, selectUser } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();
  const currentApp = useSelector(selectCurrentApp);
  const userInfo = selectUser();

  const navigationItems = [
    { name: "Applications", path: "/applications", icon: LayoutGrid },
    {
      name: "Checklists",
      path: `/${currentApp?.appId}/checklists`,
      icon: CheckSquare,
    },
    ...(userInfo && userInfo.role === "admin"
      ? [{ name: "Add Users", path: "/addUsers", icon: Users }]
      : []),
    { name: "Profile", path: "/profile", icon: User },
    { name: "Trash", path: "/trash", icon: Trash },
    { name: "Pre Assessment", path: "/pre-assessment", icon: ClipboardCheck },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const isActiveRoute = (path) => {
    if (path === "/applications") {
      return location.pathname === "/" || location.pathname === "/applications";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <TooltipProvider>
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 z-40
          ${isCollapsed ? "w-16" : "w-56"}
          fixed left-0 h-[calc(100vh-var(--header-height))] bg-sidebar border-r border-sidebar-border
        `}
      >
        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          {/* Dashboard Collapsible */}
          {/* Dashboard Collapsible */}
          {/* <Collapsible
            defaultOpen
            open={!isCollapsed}
            className="group/collapsible"
          >
            <CollapsibleTrigger
              className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                !isCollapsed ? "justify-between" : "justify-center"
              }`}
              onClick={() => {
                if (isCollapsed) onToggle(); // open sidebar if collapsed
              }}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="ml-3 font-medium">Dashboard</span>
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </>
              )}
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-1">
              {/* User Dashboard */}
          {/* <TooltipProvider>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <Link
                      to="/user_dashboard"
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors relative ${
                        isActiveRoute("/user_dashboard")
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                      onClick={isMobile ? onToggle : undefined}
                    >
                      {!isCollapsed && (
                        <span className="ml-3 font-medium truncate">
                          User Dashboard
                        </span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">User Dashboard</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider> */}

          {/* Admin Dashboard (only for admins) */}
          {/* {userInfo?.role === "admin" && (
                <TooltipProvider>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <Link
                        to="/admin_dashboard"
                        className={`flex items-center px-3 py-2 rounded-lg transition-colors relative ${
                          isActiveRoute("/admin_dashboard")
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                        onClick={isMobile ? onToggle : undefined}
                      >
                        {!isCollapsed && (
                          <span className="ml-3 font-medium truncate">
                            Admin Dashboard
                          </span>
                        )}
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">
                        Admin Dashboard
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
            </CollapsibleContent>
          </Collapsible> */}

          {/* Other navigation items */}
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.path);

            return (
              <Tooltip key={item.path} delayDuration={200}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors group relative ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                    onClick={isMobile ? onToggle : undefined}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!isCollapsed && (
                      <span className="ml-3 font-medium truncate">
                        {item.name}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">{item.name}</TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom section (Profile + Current App) */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-4 space-y-4 bg-sidebar">
          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full flex items-center justify-start gap-2"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {userInfo?.firstName?.[0] || userInfo?.username?.[0] || "U"}
                  </span>
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-medium">
                      {userInfo?.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {userInfo?.email}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Current App Info */}
          {!isCollapsed && currentApp && (
            <div>
              <div className="text-xs text-sidebar-foreground/70 mb-1">
                Current App
              </div>
              <div className="text-sm font-medium text-sidebar-foreground truncate">
                {currentApp.name}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile/Tablet Overlay */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-foreground/50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </TooltipProvider>
  );
}
