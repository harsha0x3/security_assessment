import { Card, CardContent } from "@/components/ui/Card";

import { selectAuth } from "@/features/auth/store/authSlice";
import { useSelector } from "react-redux";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PreAssessmentPage = () => {
  const user = useSelector(selectAuth);
  const location = useLocation();

  // Extract the current tab from the pathname
  const getCurrentTab = () => {
    const pathSegments = location.pathname.split("/");
    return pathSegments[pathSegments.length - 1] || "user";
  };

  const navItems = [
    { path: "user", label: "Fill Assessment" },
    { path: "submissions", label: "Submissions" },
    ...(user?.role === "admin" ? [{ path: "modify", label: "Modify" }] : []),
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden gap-4">
      {/* Top Card (tabs) */}
      <Tabs value={getCurrentTab()} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {navItems.map((item) => (
            <TabsTrigger key={item.path} value={item.path} asChild>
              <NavLink to={item.path}>{item.label}</NavLink>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Bottom Card (fills remaining height, scrolls internally) */}
      <Card className="flex-1 min-h-0 overflow-hidden">
        <CardContent className="h-full overflow-y-auto p-4">
          <Outlet />
        </CardContent>
      </Card>
    </div>
  );
};

export default PreAssessmentPage;
