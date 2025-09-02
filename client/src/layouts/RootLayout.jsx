import { Outlet } from "react-router-dom";
import Header from "./Header";

const RootLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <main className="flex-1 ml-10 pt-16 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RootLayout;
