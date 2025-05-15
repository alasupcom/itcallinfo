import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    LayoutDashboard,
    Phone,
    Settings,
    LogOut,
    Sun,
    Moon,
    PhoneCall,
    MessagesSquare,
    Workflow,
    BookMarked,
    Speech,
    MessageSquareShare,
    FileVolume,
    Languages,
    SmartphoneNfc,
    TruckElectricIcon
} from "lucide-react";
import { useMobile } from "@/hooks/useMobile";
import { contacts } from '@/Mocks/data';
import { useThemeStore } from '@/store/themeStore';
import { useToast } from '@/hooks/useToast';
import { useLogout } from '@/hooks/api/useAuth';
import { useUserStore } from '@/store/userStore';
import { useSipStore } from '@/store/sipStore';

interface SidebarProps {
    className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
    const { user, setUser } = useUserStore();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { theme, toggleTheme } = useThemeStore();
    const isMobile = useMobile();
    const { sipConfig, fetchConfig, connect, connected, latency } = useSipStore();

    const pathname = useLocation({
        select: (location) => location.pathname,
    })

    const { mutateAsync: doLogout, isPending: isLogoutLoading } = useLogout({
        onSuccess: () => {
            toast({
                title: "Logged out",
                description: "You have been successfully logged out",
            });
            setUser(null);
            navigate({ to: '/auth/login' });
        },
        onError: () => {
            toast({
                title: "Logout failed",
                description: "Please try again!",
            });
        }
    });

    // Get user initials for avatar fallback
    const getUserInitials = () => {
        if (!user?.fullName) return user?.username?.substring(0, 2).toUpperCase() || "U";

        const nameParts = user.fullName.split(' ');
        if (nameParts.length > 1) {
            return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
        }
        return nameParts[0].substring(0, 2).toUpperCase();
    };

    // Navigation items
    const navItems = [
        { path: "/", label: "Dashboard", icon: <LayoutDashboard className="mr-3 h-5 w-5" /> },
        { path: "/call", label: "Phone Calls", icon: <Phone className="mr-3 h-5 w-5" /> },
        { path: "/vocal-chat", label: "Vocal AI Assistant", icon: <Speech className="mr-3 h-5 w-5" /> },
        { path: "/chat-ai-assistant", label: "AI Chat Assistant", icon: <MessagesSquare className="mr-3 h-5 w-5" /> },
        { path: "/TTS", label: "Text to Speech", icon: <MessageSquareShare className="mr-3 h-5 w-5" /> },
        { path: "/STT", label: "Speech to Text", icon: <FileVolume className="mr-3 h-5 w-5" /> },
        { path: "/vocal-translator", label: "Vocal AI Translator", icon: <Languages className="mr-3 h-5 w-5" /> },
        { path: "/learn-with-ai", label: "AI Coaching", icon: <BookMarked className="mr-3 h-5 w-5" /> },
        { path: "/IVR", label: "IVR Demo", icon: <Workflow className="mr-3 h-5 w-5" /> },
        { path: "/click-to-call", label: "Click To Call", icon: <SmartphoneNfc className="mr-3 h-5 w-5" /> },
    ];

    if (isMobile) {
        return null;
    }

    return (
        <div className={`hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 ${className}`}>
            {/* Logo area */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                    <PhoneCall className="h-5 w-5" />

                    <span className="ml-2 text-lg font-semibold text-gray-800 dark:text-white">itcallinfo</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={toggleTheme}
                >
                    {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </Button>
            </div>

            {/* User profile */}
            {user && (
                <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <Avatar className="w-10 h-10 mr-3">
                        <AvatarImage src={user.avatarUrl || ''} alt={user.username} />
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold">{user.fullName || user.username}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.status}</p>
                    </div>
                    <div className="flex">
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-primary" asChild>
                            <Link to="/settings">
                                <Settings className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-primary ml-1" disabled={isLogoutLoading} onClick={() => doLogout()}>
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Navigation menu */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
                <ul className="space-y-1">
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <Link to={item.path}>
                                <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${pathname === item.path || pathname.startsWith(item.path + '/')
                                    ? "bg-gray-100 dark:bg-gray-800 text-primary"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    }`}>
                                    {item.icon}
                                    {item.label}
                                </a>
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* Recent contacts section */}
                <div className="mt-16">
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Recent Contacts
                    </h3>
                    <div className="mt-2 space-y-1">
                        {contacts?.slice(0, 3).map((contact) => (
                            <Button
                                key={contact.id}
                                variant="ghost"
                                className="w-full justify-start px-3 py-2 h-auto"
                            >
                                <span className="relative flex-shrink-0">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={contact.avatarUrl || ''} alt={contact.name} />
                                        <AvatarFallback>{contact.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span className={`absolute bottom-0 right-0 block h-2 w-2 rounded-full ${contact.status === 'online' ? 'bg-green-400' : 'bg-gray-400'
                                        } ring-2 ring-white dark:ring-gray-800`}></span>
                                </span>
                                <span className="flex-1 ml-3 text-left">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{contact.name}</span>
                                </span>
                            </Button>
                        ))}
                    </div>
                </div>
            </nav>
            <div className="mt-auto">
                {/* SIP Status */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <span className={`inline-block h-2 w-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                        </div>
                        <div className="ml-3">
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-200">
                                {connected ? 'SIP Connected' : 'SIP Disconnected'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {sipConfig ? `${sipConfig.username}@${sipConfig.domain}` : 'Not configured'}
                                {latency && connected ? ` (${latency}ms)` : ''}
                            </p>
                        </div>
                    </div>
                </div>
                {/* Log out */}
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { }}
                    disabled={false}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                </Button>
            </div>

        </div>
    );
}
export default Sidebar