import {  Link, useLocation } from '@tanstack/react-router';
import { LayoutDashboard, Phone, MessageSquare, Users, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MobileNav = () => {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const pathname = useLocation({
    select: (location) => location.pathname,
})

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="flex justify-around">
        <Button
          variant="ghost"
          size="icon"
          className={`p-3 ${pathname === "/" ? "text-primary" : "text-gray-500 dark:text-gray-400"}`}
          asChild
        >
          <Link to="/">
            <LayoutDashboard className="h-5 w-5" />
          </Link>
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className={`p-3 ${pathname === "/calls" ? "text-primary" : "text-gray-500 dark:text-gray-400"}`}
          asChild
        >
          <Link to="/calls">
            <Phone className="h-5 w-5" />
          </Link>
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className={`p-3 ${pathname === "/messages" ? "text-primary" : "text-gray-500 dark:text-gray-400"}`}
          asChild
        >
          <Link to="/messages">
            <MessageSquare className="h-5 w-5" />
          </Link>
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className={`p-3 ${pathname === "/contacts" ? "text-primary" : "text-gray-500 dark:text-gray-400"}`}
          asChild
        >
          <Link to="/contacts">
            <Users className="h-5 w-5" />
          </Link>
        </Button>
        
        <DropdownMenu open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="p-3 text-gray-500 dark:text-gray-400"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="mb-16">
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
export default MobileNav