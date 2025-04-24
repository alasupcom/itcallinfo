import { Link, useLocation } from '@tanstack/react-router';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Bell, PhoneCall } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMobile } from "@/hooks/useMobile";
import { users } from '@/Mocks/data';

interface NavbarProps {
    onMobileMenuToggle: () => void;
}

const Navbar = ({ onMobileMenuToggle }: NavbarProps) => {
    const user = users[0];
    const isMobile = useMobile();

    const pathname = useLocation({
        select: (location) => location.pathname,
    })


    const getUserInitials = () => {
        if (!user?.fullName) return user?.username?.substring(0, 2).toUpperCase() || "U";

        const nameParts = user.fullName.split(' ');
        if (nameParts.length > 1) {
            return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
        }
        return nameParts[0].substring(0, 2).toUpperCase();
    };

    const navItems = [
        { path: "/call", label: "Call" },
        { path: "/call/history-calls", label: "Calls History" },
        { path: "/call/video-call", label: "Video Call" },
        { path: "/call/messages", label: "Messages" },
        { path: "/call/contacts", label: "Contacts" },
    ];

    return (
        <header className="bg-white dark:bg-gray-900 shadow-sm z-10">
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center">
                            {/* Mobile menu button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden"
                                onClick={onMobileMenuToggle}
                            >
                                <Menu className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </Button>
                            <span className="ml-2 text-xl font-bold text-primary md:hidden">itcallinfo</span>
                        </div>
                        <div className="hidden md:ml-6 md:flex md:space-x-8">
                            {navItems.map((item) => (
                                <Link key={item.path} to={item.path}>
                                    <a className={`${pathname === item.path
                                            ? "border-b-2 border-primary text-gray-900 dark:text-white"
                                            : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:border-gray-300"
                                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                                        {item.label}
                                    </a>
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Button onClick={() => { }} className="flex items-center" variant="default">
                                <PhoneCall className="mr-2 h-4 w-4" />
                                {!isMobile && "New Call"}
                            </Button>
                        </div>
                        <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-500">
                                <Bell className="h-5 w-5" />
                            </Button>
                            <div className="ml-3 relative">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative rounded-full focus:outline-none">
                                            <span className="sr-only">Open user menu</span>
                                            <Avatar>
                                                <AvatarImage src={user?.avatarUrl || ''} alt={user?.username} />
                                                <AvatarFallback>{getUserInitials()}</AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link to="/profile">Profile</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to="/settings">Settings</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => { }}>
                                            Sign out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
export default Navbar