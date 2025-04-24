import { useState } from "react";
import Sidebar from "./SideBar";
import MobileNav from "./MobileNave";
import Navbar from "./NavBar";
import { useMobile } from "@/hooks/useMobile";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const isMobile = useMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar className={mobileMenuOpen ? "fixed inset-0 z-50" : ""} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMobileMenuToggle={toggleMobileMenu} />
        <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-800 p-4 md:p-6">
          {children}
        </main>
        {isMobile && <MobileNav />}
      </div>
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}
    </div>
  );
}
export default AppLayout