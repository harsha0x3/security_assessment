import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Checklists from "../pages/Checklists";

const ChecklistsLayout = () => {
  return (
    <div>
      <Checklists />
      <Outlet />
      {/* This is where nested routes will render */}
    </div>
  );
};
export default ChecklistsLayout;
