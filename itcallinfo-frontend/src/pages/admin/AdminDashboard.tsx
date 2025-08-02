import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { 
  Users, 
  Phone, 
  Database, 
  BarChart3, 
  Settings, 
  LogOut, 
  Activity,
  Shield,
  Globe,
  Server,
  UserCheck,
  UserX,
  PhoneCall,
  PhoneOff,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Bell,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Wifi,
  WifiOff,
  X,
  CheckCircle,
  XCircle,
  Mail,
  ShieldOff,
  Save
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/useToast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUserStore } from '@/store/userStore';
import { AdminAxiosClient } from '@/services/api/adminApi';

interface AdminStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    online: number;
    offline: number;
    verified: number;
    unverified: number;
  };
  sip: {
    gateway: any;
    range: any;
  };
  system: {
    uptime: number;
    memory: any;
    nodeVersion: string;
  };
}

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  status: string | null;
  isVerified: boolean;
  createdAt: string | null;
  avatarUrl: string | null;
}

interface SipConfig {
  id: number;
  userId: number;
  domain: string;
  username: string;
  server: string;
  port: number;
  transport: string;
}

interface AvailableSipConfig {
  id: number;
  domain: string;
  username: string;
  server: string;
  port: number;
  transport: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [sipConfigs, setSipConfigs] = useState<{ available: SipConfig[], assigned: SipConfig[] }>({ available: [], assigned: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phoneNumber: ''
  });
  const [showCreateUser, setShowCreateUser] = useState(false);
  
  // Pagination state for available SIP configs
  const [availableConfigsPage, setAvailableConfigsPage] = useState(1);
  const [availableConfigsPerPage] = useState(5);
  const [totalAvailableConfigs, setTotalAvailableConfigs] = useState(0);
  const [loadingAvailableConfigs, setLoadingAvailableConfigs] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // User detail modal state
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSipConfig, setUserSipConfig] = useState<SipConfig | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [editingUser, setEditingUser] = useState(false);
  const [editUserData, setEditUserData] = useState({
    fullName: '',
    phoneNumber: '',
    email: ''
  });

  // SIP Assignment Modal State
  const [assignSipModalOpen, setAssignSipModalOpen] = useState(false);
  const [availableSipConfigs, setAvailableSipConfigs] = useState<AvailableSipConfig[]>([]);
  const [loadingAvailableSipConfigs, setLoadingAvailableSipConfigs] = useState(false);
  const [selectedSipConfigId, setSelectedSipConfigId] = useState<number | null>(null);
  const [assigningSip, setAssigningSip] = useState(false);
  const [rangeInfo, setRangeInfo] = useState<{
    testRangeEnabled: boolean;
    rangeStart: number;
    rangeEnd: number;
  } | null>(null);
  const [filteredSipConfigs, setFilteredSipConfigs] = useState<AvailableSipConfig[]>([]);

  const adminApi = new AdminAxiosClient();

  useEffect(() => {
    const loadData = async () => {
      await fetchDashboardData();
      // Fetch available configs with pagination after main data is loaded
      await fetchAvailableConfigs(1);
    };
    loadData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data...');
      console.log('Current user from store:', useUserStore.getState().user);
      
      const [statsRes, usersRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers()
      ]);

      console.log('Dashboard API responses:', {
        stats: { ok: statsRes.status === 200, status: statsRes.status },
        users: { ok: usersRes.status === 200, status: usersRes.status }
      });

      if (statsRes.status === 200) {
        const statsData = statsRes.data;
        console.log('Stats data:', statsData);
        setStats(statsData);
      } else {
        console.error('Stats response not ok:', statsRes.status, statsRes.statusText);
      }

      if (usersRes.status === 200) {
        const usersData = usersRes.data;
        console.log('Users data:', usersData);
        setUsers(usersData);
      } else {
        console.error('Users response not ok:', usersRes.status, usersRes.statusText);
      }

      // Fetch assigned SIP configurations only (available configs will be fetched separately with pagination)
      const sipResponse = await adminApi.getSipConfigs({ format: 'dashboard' });

      if (sipResponse.status === 200) {
        const sipData = sipResponse.data;
        console.log('SIP configs data:', sipData);
        setSipConfigs(prev => ({
          ...prev,
          assigned: sipData.assigned || []
        }));
      } else {
        console.error('SIP configs response not ok:', sipResponse.status, sipResponse.statusText);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch available SIP configs with pagination
  const fetchAvailableConfigs = async (page: number = 1) => {
    try {
      setLoadingAvailableConfigs(true);
      const response = await adminApi.getAvailableSipConfigs(page, availableConfigsPerPage);

      if (response.status === 200) {
        const data = response.data;
        setSipConfigs(prev => ({
          ...prev,
          available: data.configs
        }));
        setTotalAvailableConfigs(data.total);
      } else {
        console.error('Failed to fetch available SIP configs with pagination');
      }
    } catch (error) {
      console.error('Error fetching available SIP configs:', error);
    } finally {
      setLoadingAvailableConfigs(false);
    }
  };

  // Handle page change for available configs
  const handleAvailableConfigsPageChange = (newPage: number) => {
    setAvailableConfigsPage(newPage);
    fetchAvailableConfigs(newPage);
  };

  const handleUserAction = async (userId: number, action: 'activate' | 'deactivate') => {
    try {
      const response = action === 'activate' 
        ? await adminApi.activateUser(userId)
        : await adminApi.deactivateUser(userId);

      const data = response.data;

      if (response.status === 200) {
        const actionText = action === 'activate' ? 'activated' : 'deactivated';
        const sipText = action === 'activate' && data.sipConfig 
          ? ` with SIP configuration ${data.sipConfig.username}@${data.sipConfig.domain}`
          : action === 'deactivate' 
          ? ' and SIP configuration removed'
          : '';
        
        toast({
          title: "Success",
          description: `User ${actionText} successfully${sipText}`,
        });
        fetchDashboardData();
      } else {
        throw new Error(data.error || `Failed to ${action} user`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${action} user`,
        variant: "destructive"
      });
    }
  };

  const handleSipUnassign = async (configId: number) => {
    try {
      const response = await adminApi.unassignSipConfig(configId);

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "SIP configuration unassigned successfully",
        });
        fetchDashboardData();
      } else {
        throw new Error('Failed to unassign SIP configuration');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unassign SIP configuration",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    try {
      // Call the logout API
      const response = await adminApi.logout();
      
      if (response.status === 200) {
        // Clear all local storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to login page
        window.location.href = '/auth/login';
      } else {
        console.error('Logout failed:', response.status);
        // Even if API fails, clear local storage and redirect
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/auth/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear local storage and redirect
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/auth/login';
    }
  };

  const resetNewUser = () => {
    setNewUser({
      username: '',
      email: '',
      password: '',
      fullName: '',
      phoneNumber: ''
    });
  };

  const handleCreateUser = async () => {
    try {
      setCreatingUser(true);
      
      const response = await adminApi.createUser(newUser);
      const data = response.data;

      if (response.status === 200) {
        toast({
          title: "Success",
          description: `User ${data.user.username} created successfully with SIP configuration`,
        });
        setCreateUserModalOpen(false);
        resetNewUser();
        fetchDashboardData();
      } else {
        throw new Error(data.error || 'Failed to create user');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create user',
        variant: "destructive"
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const fetchUserDetail = async (userId: number) => {
    try {
      setLoadingUserDetail(true);
      const response = await adminApi.getUserById(userId);

      if (response.status === 200) {
        const data = response.data;
        setSelectedUser(data.user);
        setUserSipConfig(data.sipConfig || null);
        setEditUserData({
          fullName: data.user.fullName || '',
          phoneNumber: data.user.phoneNumber || '',
          email: data.user.email || ''
        });
      } else {
        throw new Error('Failed to fetch user details');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load user details",
        variant: "destructive"
      });
    } finally {
      setLoadingUserDetail(false);
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setUserDetailModalOpen(true);
    fetchUserDetail(user.id);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await adminApi.updateUser(selectedUser.id, editUserData);

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "User updated successfully",
        });
        setEditingUser(false);
        fetchUserDetail(selectedUser.id);
        fetchDashboardData(); // Refresh main list
      } else {
        const errorData = response.data;
        throw new Error(errorData.error || 'Failed to update user');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive"
      });
    }
  };

  const fetchAvailableSipConfigs = async () => {
    try {
      setLoadingAvailableSipConfigs(true);
      const response = await adminApi.getAvailableSipConfigs();

      if (response.status === 200) {
        const data = response.data;
        setAvailableSipConfigs(data.configs || []);
        console.log(`Loaded ${data.configs?.length || 0} available SIP configurations for assignment`);
      } else {
        throw new Error('Failed to fetch available SIP configurations');
      }
    } catch (error) {
      console.error('Error fetching available SIP configs:', error);
      toast({
        title: "Error",
        description: "Failed to load available SIP configurations",
        variant: "destructive"
      });
    } finally {
      setLoadingAvailableSipConfigs(false);
    }
  };

  const handleAssignSip = async () => {
    if (!selectedSipConfigId || !selectedUser) {
      toast({
        title: "Error",
        description: "Please select a SIP configuration",
        variant: "destructive"
      });
      return;
    }

    try {
      setAssigningSip(true);
      const response = await adminApi.assignSipConfig(selectedSipConfigId, selectedUser.id);

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "SIP configuration assigned successfully",
        });
        setAssignSipModalOpen(false);
        setSelectedSipConfigId(null);
        fetchUserDetail(selectedUser.id); // Refresh user details
        fetchDashboardData(); // Refresh main list
      } else {
        const errorData = response.data;
        throw new Error(errorData.error || 'Failed to assign SIP configuration');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign SIP configuration",
        variant: "destructive"
      });
    } finally {
      setAssigningSip(false);
    }
  };

  const handleUserActionFromModal = async (action: 'activate' | 'deactivate') => {
    if (!selectedUser) return;

    try {
      const response = action === 'activate' 
        ? await adminApi.activateUser(selectedUser.id)
        : await adminApi.deactivateUser(selectedUser.id);

      if (response.status === 200) {
        toast({
          title: "Success",
          description: `User ${action}d successfully`,
        });
        fetchUserDetail(selectedUser.id);
        fetchDashboardData(); // Refresh main list
      } else {
        const errorData = response.data;
        throw new Error(errorData.error || `Failed to ${action} user`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${action} user`,
        variant: "destructive"
      });
    }
  };

  const handleSipUnassignFromModal = async () => {
    if (!userSipConfig) return;

    try {
      const response = await adminApi.unassignSipConfig(userSipConfig.id);

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "SIP configuration unassigned successfully",
        });
        fetchUserDetail(selectedUser!.id);
        fetchDashboardData(); // Refresh main list
      } else {
        const errorData = response.data;
        throw new Error(errorData.error || 'Failed to unassign SIP configuration');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unassign SIP configuration",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatMemory = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const isAdmin = (user: User | null) => {
    return user?.email === 'admin@itcallinfo.com' || user?.username === 'admin';
  };

  // Filter SIP configs based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSipConfigs(availableSipConfigs);
    } else {
      const filtered = availableSipConfigs.filter(config => 
        config.id.toString().includes(searchTerm) ||
        config.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.domain.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSipConfigs(filtered);
    }
  }, [searchTerm, availableSipConfigs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-purple-400" />
                <h1 className="text-xl font-bold text-white">itCallInfo Admin</h1>
              </div>
              <Badge variant="secondary" className="bg-purple-500 text-white">
                Admin Panel
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-white">
                <Activity className="h-4 w-4" />
                <span className="text-sm">System Online</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/10">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/10 backdrop-blur-md">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-purple-500">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-purple-500">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="sip" className="text-white data-[state=active]:bg-purple-500">
              <Phone className="h-4 w-4 mr-2" />
              SIP Configs
            </TabsTrigger>
            <TabsTrigger value="database" className="text-white data-[state=active]:bg-purple-500">
              <Database className="h-4 w-4 mr-2" />
              Database
            </TabsTrigger>
            <TabsTrigger value="system" className="text-white data-[state=active]:bg-purple-500">
              <Settings className="h-4 w-4 mr-2" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {stats && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-purple-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{stats.users.total}</div>
                      <p className="text-xs text-gray-300">
                        {stats.users.active} active, {stats.users.inactive} inactive
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-white">Online Users</CardTitle>
                      <Activity className="h-4 w-4 text-green-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{stats.users.online}</div>
                      <p className="text-xs text-gray-300">
                        {stats.users.offline} offline
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-white">SIP Usage</CardTitle>
                      <Phone className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        {stats.sip.range?.usage?.used || 0}
                      </div>
                      <p className="text-xs text-gray-300">
                        of {stats.sip.range?.range?.total || 0} available
                      </p>
                      <Progress 
                        value={stats.sip.range?.usage?.percentage || 0} 
                        className="mt-2"
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-white">SIP Gateway</CardTitle>
                      <Server className="h-4 w-4 text-purple-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        {stats.sip.gateway?.assigned || 0}
                      </div>
                      <p className="text-xs text-gray-300">
                        {stats.sip.gateway?.available || 0} available, {stats.sip.gateway?.total || 0} total
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-white">System Uptime</CardTitle>
                      <Clock className="h-4 w-4 text-yellow-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        {formatUptime(stats.system.uptime)}
                      </div>
                      <p className="text-xs text-gray-300">
                        Node {stats.system.nodeVersion}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* SIP Range Stats */}
                {stats.sip.range && (
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">SIP Configuration Range (2400-2500)</CardTitle>
                      <CardDescription className="text-gray-300">
                        Current usage statistics for the test range (filtered by SIP ID)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{stats.sip.range.usage.available}</div>
                          <div className="text-sm text-gray-300">Available</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{stats.sip.range.usage.used}</div>
                          <div className="text-sm text-gray-300">Used</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{stats.sip.range.usage.percentage}%</div>
                          <div className="text-sm text-gray-300">Usage</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">User Management</CardTitle>
                    <CardDescription className="text-gray-300">
                      Manage all registered users and their status
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
                      />
                    </div>
                    <Dialog open={createUserModalOpen} onOpenChange={setCreateUserModalOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-green-500 hover:bg-green-600">
                          <Plus className="h-4 w-4 mr-2" />
                          Create User
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-gray-700 text-white">
                        <DialogHeader>
                          <DialogTitle>Create New User</DialogTitle>
                          <DialogDescription className="text-gray-300">
                            Create a new user with automatic SIP configuration assignment
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="username" className="text-white">Username *</Label>
                            <Input
                              id="username"
                              value={newUser.username}
                              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                              className="bg-gray-800 border-gray-600 text-white"
                              placeholder="Enter username"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email" className="text-white">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={newUser.email}
                              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                              className="bg-gray-800 border-gray-600 text-white"
                              placeholder="Enter email"
                            />
                          </div>
                          <div>
                            <Label htmlFor="password" className="text-white">Password *</Label>
                            <Input
                              id="password"
                              type="password"
                              value={newUser.password}
                              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                              className="bg-gray-800 border-gray-600 text-white"
                              placeholder="Enter password"
                            />
                          </div>
                          <div>
                            <Label htmlFor="fullName" className="text-white">Full Name</Label>
                            <Input
                              id="fullName"
                              value={newUser.fullName}
                              onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                              className="bg-gray-800 border-gray-600 text-white"
                              placeholder="Enter full name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="phoneNumber" className="text-white">Phone Number</Label>
                            <Input
                              id="phoneNumber"
                              value={newUser.phoneNumber}
                              onChange={(e) => setNewUser({...newUser, phoneNumber: e.target.value})}
                              className="bg-gray-800 border-gray-600 text-white"
                              placeholder="Enter phone number"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setCreateUserModalOpen(false);
                              resetNewUser();
                            }}
                            className="border-gray-600 text-white"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreateUser}
                            disabled={creatingUser || !newUser.username || !newUser.email || !newUser.password}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            {creatingUser ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                Create User
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button onClick={fetchDashboardData} className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
                      <RefreshCw className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Admin Users Section */}
                  {(() => {
                    const adminUsers = filteredUsers.filter(user => 
                      user.email === 'admin@itcallinfo.com' || user.username === 'admin'
                    );
                    
                    if (adminUsers.length > 0) {
                      return (
                        <div>
                          <div className="flex items-center space-x-2 mb-4">
                            <Shield className="h-5 w-5 text-red-400" />
                            <h3 className="text-lg font-semibold text-white">Administrators</h3>
                            <Badge variant="secondary" className="bg-red-500 text-white">
                              {adminUsers.length}
                            </Badge>
                          </div>
                          <div className="space-y-4">
                            {adminUsers.map((user) => {
                              const userSipConfig = sipConfigs.assigned.find(config => config.userId === user.id);
                              const isAdmin = true;
                              return (
                                <div key={user.id} className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                                  <div className="flex items-center space-x-4">
                                    <Avatar>
                                      <AvatarImage src={user.avatarUrl || undefined} />
                                      <AvatarFallback className="bg-red-500 text-white">
                                        {user.username.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <h3 className="font-medium text-white">{user.fullName || user.username}</h3>
                                        <Badge 
                                          variant="secondary" 
                                          className={`text-xs ${
                                            user.status === 'online' ? 'bg-green-500 text-white' :
                                            'bg-gray-500 text-white'
                                          }`}
                                        >
                                          <Wifi className={`h-3 w-3 mr-1 ${user.status === 'online' ? 'text-white' : 'text-gray-300'}`} />
                                          {user.status === 'online' ? 'Online' : 'Offline'}
                                        </Badge>
                                        
                                        {/* Account Status Badge */}
                                        <Badge 
                                          variant="secondary" 
                                          className="text-xs bg-blue-500 text-white"
                                        >
                                          Active
                                        </Badge>
                                        
                                        {/* Verified Status Badge */}
                                        {user.isVerified ? (
                                          <Badge variant="secondary" className="bg-green-500 text-white text-xs">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Verified
                                          </Badge>
                                        ) : (
                                          <Badge variant="secondary" className="bg-yellow-500 text-white text-xs">
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Unverified
                                          </Badge>
                                        )}
                                        
                                        {/* SIP Linked Status Badge */}
                                        {userSipConfig ? (
                                          <Badge variant="secondary" className="bg-purple-500 text-white text-xs">
                                            <Phone className="h-3 w-3 mr-1" />
                                            SIP Linked
                                          </Badge>
                                        ) : (
                                          <Badge variant="secondary" className="bg-gray-500 text-white text-xs">
                                            <PhoneOff className="h-3 w-3 mr-1" />
                                            No SIP
                                          </Badge>
                                        )}
                                        
                                        {/* Admin Badge */}
                                        <Badge variant="secondary" className="bg-red-500 text-white text-xs">
                                          Admin
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-gray-300">{user.email}</p>
                                      <p className="text-xs text-gray-400">
                                        Created: {new Date(user.createdAt || '').toLocaleDateString()}
                                        {userSipConfig && (
                                          <span className="ml-2">
                                            • SIP: {userSipConfig.username}@{userSipConfig.domain}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                                      onClick={() => handleViewUser(user)}
                                      title="View user details"
                                    >
                                      <Eye className="h-4 w-4 text-white" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Regular Users Section */}
                  {(() => {
                    const regularUsers = filteredUsers.filter(user => 
                      user.email !== 'admin@itcallinfo.com' && user.username !== 'admin'
                    );
                    
                    if (regularUsers.length > 0) {
                      return (
                        <div>
                          <div className="flex items-center space-x-2 mb-4">
                            <Users className="h-5 w-5 text-blue-400" />
                            <h3 className="text-lg font-semibold text-white">Regular Users</h3>
                            <Badge variant="secondary" className="bg-blue-500 text-white">
                              {regularUsers.length}
                            </Badge>
                          </div>
                          <div className="space-y-4">
                            {regularUsers.map((user) => {
                              const userSipConfig = sipConfigs.assigned.find(config => config.userId === user.id);
                              const isAdmin = false;
                              return (
                                <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                                  <div className="flex items-center space-x-4">
                                    <Avatar>
                                      <AvatarImage src={user.avatarUrl || undefined} />
                                      <AvatarFallback className="bg-purple-500 text-white">
                                        {user.username.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <h3 className="font-medium text-white">{user.fullName || user.username}</h3>
                                        <Badge 
                                          variant="secondary" 
                                          className={`text-xs ${
                                            user.status === 'online' ? 'bg-green-500 text-white' :
                                            'bg-gray-500 text-white'
                                          }`}
                                        >
                                          <Wifi className={`h-3 w-3 mr-1 ${user.status === 'online' ? 'text-white' : 'text-gray-300'}`} />
                                          {user.status === 'online' ? 'Online' : 'Offline'}
                                        </Badge>
                                        
                                        {/* Account Status Badge */}
                                        <Badge 
                                          variant="secondary" 
                                          className={`text-xs ${
                                            user.status === 'active' ? 'bg-blue-500 text-white' :
                                            'bg-red-500 text-white'
                                          }`}
                                        >
                                          {user.status === 'active' ? 'Active' : 'Inactive'}
                                        </Badge>
                                        
                                        {/* Verified Status Badge */}
                                        {user.isVerified ? (
                                          <Badge variant="secondary" className="bg-green-500 text-white text-xs">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Verified
                                          </Badge>
                                        ) : (
                                          <Badge variant="secondary" className="bg-yellow-500 text-white text-xs">
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Unverified
                                          </Badge>
                                        )}
                                        
                                        {/* SIP Linked Status Badge */}
                                        {userSipConfig ? (
                                          <Badge variant="secondary" className="bg-purple-500 text-white text-xs">
                                            <Phone className="h-3 w-3 mr-1" />
                                            SIP Linked
                                          </Badge>
                                        ) : (
                                          <Badge variant="secondary" className="bg-gray-500 text-white text-xs">
                                            <PhoneOff className="h-3 w-3 mr-1" />
                                            No SIP
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-300">{user.email}</p>
                                      <p className="text-xs text-gray-400">
                                        Created: {new Date(user.createdAt || '').toLocaleDateString()}
                                        {userSipConfig && (
                                          <span className="ml-2">
                                            • SIP: {userSipConfig.username}@{userSipConfig.domain}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                                      onClick={() => handleViewUser(user)}
                                      title="View user details"
                                    >
                                      <Eye className="h-4 w-4 text-white" />
                                    </Button>
                                    {user.status === 'active' ? (
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleUserAction(user.id, 'deactivate')}
                                        title="Deactivate user and remove SIP configuration"
                                      >
                                        <UserX className="h-4 w-4" />
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => handleUserAction(user.id, 'activate')}
                                        title="Activate user and assign SIP configuration"
                                      >
                                        <UserCheck className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* No Users Found */}
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300">No users found matching your search criteria.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SIP Configs Tab */}
          <TabsContent value="sip" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">SIP Configuration Management</h2>
                <p className="text-gray-300">Manage SIP configurations and assignments</p>
              </div>
              <Button 
                onClick={() => navigate({ to: '/admin/sip-config-management' })}
                className="bg-purple-500 hover:bg-purple-600"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Configurations
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Available Configs */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">Available SIP Configurations</CardTitle>
                      <CardDescription className="text-gray-300">
                        {rangeInfo?.testRangeEnabled ? (
                          <span className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-orange-500 text-white text-xs">
                              TEST RANGE
                            </Badge>
                            Filtered to SipID range {rangeInfo.rangeStart}-{rangeInfo.rangeEnd}
                          </span>
                        ) : (
                          "Unassigned configurations (all ranges)"
                        )}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => fetchAvailableConfigs(availableConfigsPage)}
                      disabled={loadingAvailableConfigs}
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 text-white ${loadingAvailableConfigs ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingAvailableConfigs ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                      <p className="text-gray-300">Loading available configurations...</p>
                    </div>
                  ) : sipConfigs.available.length > 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        {sipConfigs.available.map((config) => (
                          <div key={config.id} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                            <div>
                              <div className="font-medium text-white">SipID: {config.username}</div>
                              <div className="text-sm text-gray-300">{config.server}:{config.port}</div>
                              {rangeInfo?.testRangeEnabled && (
                                <div className="text-xs text-orange-300">
                                  Range: {rangeInfo.rangeStart}-{rangeInfo.rangeEnd}
                                </div>
                              )}
                            </div>
                            <Badge variant="secondary" className="bg-green-500 text-white">
                              Available
                            </Badge>
                          </div>
                        ))}
                      </div>
                      
                      {/* Pagination Controls */}
                      {totalAvailableConfigs > availableConfigsPerPage && (
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div className="text-sm text-gray-300">
                            Showing {((availableConfigsPage - 1) * availableConfigsPerPage) + 1} to {Math.min(availableConfigsPage * availableConfigsPerPage, totalAvailableConfigs)} of {totalAvailableConfigs} configurations
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleAvailableConfigsPageChange(availableConfigsPage - 1)}
                              disabled={availableConfigsPage === 1}
                              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm disabled:opacity-50"
                            >
                              Previous
                            </Button>
                            <span className="text-sm text-white px-2">
                              Page {availableConfigsPage} of {Math.ceil(totalAvailableConfigs / availableConfigsPerPage)}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => handleAvailableConfigsPageChange(availableConfigsPage + 1)}
                              disabled={availableConfigsPage >= Math.ceil(totalAvailableConfigs / availableConfigsPerPage)}
                              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm disabled:opacity-50"
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300 mb-2">
                        {rangeInfo?.testRangeEnabled ? (
                          `No available configurations in range ${rangeInfo.rangeStart}-${rangeInfo.rangeEnd}`
                        ) : (
                          (stats?.sip?.gateway?.available || 0) > 0 
                            ? `${stats?.sip?.gateway?.available || 0} configurations available in gateway`
                            : 'No available configurations'
                        )}
                      </p>
                      <p className="text-sm text-gray-400">
                        {rangeInfo?.testRangeEnabled 
                          ? 'All configurations in the test range are currently assigned'
                          : (stats?.sip?.gateway?.available || 0) > 0 
                            ? 'Individual config details not available due to gateway API limitation'
                            : 'All configurations are currently assigned'
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assigned Configs */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Assigned SIP Configurations</CardTitle>
                  <CardDescription className="text-gray-300">
                    {rangeInfo?.testRangeEnabled ? (
                      <span className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-orange-500 text-white text-xs">
                          TEST RANGE
                        </Badge>
                        Currently assigned to users (filtered to range {rangeInfo.rangeStart}-{rangeInfo.rangeEnd})
                      </span>
                    ) : (
                      "Currently assigned to users (all ranges)"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sipConfigs.assigned.filter(config => config.userId).map((config) => (
                      <div key={config.id} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                        <div>
                          <div className="font-medium text-white">SipID: {config.username}</div>
                          <div className="text-sm text-gray-300">User ID: {config.userId}</div>
                          <div className="text-sm text-gray-300">{config.server}:{config.port}</div>
                          {rangeInfo?.testRangeEnabled && (
                            <div className="text-xs text-orange-300">
                              Range: {rangeInfo.rangeStart}-{rangeInfo.rangeEnd}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleSipUnassign(config.id)}
                        >
                          <PhoneOff className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {sipConfigs.assigned.filter(config => config.userId).length === 0 && (
                      <div className="text-center py-8">
                        <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-300">
                          {rangeInfo?.testRangeEnabled 
                            ? `No assigned SIP configurations in range ${rangeInfo.rangeStart}-${rangeInfo.rangeEnd}`
                            : 'No assigned SIP configurations'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Database Tables</CardTitle>
                <CardDescription className="text-gray-300">
                  View and manage database tables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{users.length}</div>
                      <p className="text-sm text-gray-300">Total records</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">SIP Configs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        {stats?.sip?.gateway?.assigned || sipConfigs.assigned.length}
                      </div>
                      <p className="text-sm text-gray-300">Assigned configs</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Available</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        {stats?.sip?.gateway?.available || sipConfigs.available.length}
                      </div>
                      <p className="text-sm text-gray-300">Free configs</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            {stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">System Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Node Version:</span>
                      <span className="text-white">{stats.system.nodeVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Uptime:</span>
                      <span className="text-white">{formatUptime(stats.system.uptime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Memory Usage:</span>
                      <span className="text-white">{formatMemory(stats.system.memory.heapUsed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Total Memory:</span>
                      <span className="text-white">{formatMemory(stats.system.memory.heapTotal)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={fetchDashboardData} 
                      className="w-full bg-purple-500 hover:bg-purple-600"
                    >
                      <RefreshCw className="h-4 w-4 mr-2 text-white" />
                      Refresh Data
                    </Button>
                    <Button 
                      className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                    >
                      <Download className="h-4 w-4 mr-2 text-white" />
                      Export Data
                    </Button>
                    <Button 
                      className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                    >
                      <Upload className="h-4 w-4 mr-2 text-white" />
                      Import Data
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* User Detail Modal */}
      <Dialog open={userDetailModalOpen} onOpenChange={setUserDetailModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">User Details</DialogTitle>
            <DialogDescription className="text-gray-300">
              {loadingUserDetail ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-gray-300">Loading user details...</p>
                </div>
              ) : selectedUser ? (
                <div className="space-y-6">
                  {/* User Info Section */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedUser.avatarUrl || undefined} />
                      <AvatarFallback className="bg-purple-500 text-white text-xl">
                        {selectedUser.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{selectedUser.fullName || selectedUser.username}</h3>
                      <p className="text-gray-300">{selectedUser.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {/* Connection Status Badge */}
                        <Badge 
                          variant="secondary" 
                          className={`${
                            selectedUser.status === 'online' ? 'bg-green-500 text-white' :
                            'bg-gray-500 text-white'
                          }`}
                        >
                          <Wifi className={`h-3 w-3 mr-1 ${selectedUser.status === 'online' ? 'text-white' : 'text-gray-300'}`} />
                          {selectedUser.status === 'online' ? 'Online' : 'Offline'}
                        </Badge>
                        
                        {/* Account Status Badge */}
                        <Badge 
                          variant="secondary" 
                          className={`${
                            selectedUser.status === 'active' || isAdmin(selectedUser) ? 'bg-blue-500 text-white' :
                            'bg-red-500 text-white'
                          }`}
                        >
                          {selectedUser.status === 'active' || isAdmin(selectedUser) ? 'Active' : 'Inactive'}
                        </Badge>
                        
                        {/* Verified Status Badge */}
                        {selectedUser.isVerified ? (
                          <Badge variant="secondary" className="bg-green-500 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-500 text-white">
                            <XCircle className="h-3 w-3 mr-1" />
                            Unverified
                          </Badge>
                        )}
                        
                        {/* SIP Linked Status Badge */}
                        {userSipConfig ? (
                          <Badge variant="secondary" className="bg-purple-500 text-white">
                            <Phone className="h-3 w-3 mr-1" />
                            SIP Linked
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-500 text-white">
                            <PhoneOff className="h-3 w-3 mr-1" />
                            No SIP
                          </Badge>
                        )}
                        
                        {/* Admin Badge */}
                        {isAdmin(selectedUser) && (
                          <Badge variant="secondary" className="bg-red-500 text-white">
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Editable User Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editFullName" className="text-gray-300">Full Name</Label>
                      {editingUser ? (
                        <Input
                          id="editFullName"
                          value={editUserData.fullName}
                          onChange={(e) => setEditUserData({...editUserData, fullName: e.target.value})}
                          className="bg-gray-800 border-gray-600 text-white mt-1"
                        />
                      ) : (
                        <p className="text-white mt-1">{selectedUser.fullName || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="editPhoneNumber" className="text-gray-300">Phone Number</Label>
                      {editingUser ? (
                        <Input
                          id="editPhoneNumber"
                          value={editUserData.phoneNumber}
                          onChange={(e) => setEditUserData({...editUserData, phoneNumber: e.target.value})}
                          className="bg-gray-800 border-gray-600 text-white mt-1"
                        />
                      ) : (
                        <p className="text-white mt-1">{selectedUser.phoneNumber || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="editEmail" className="text-gray-300">Email</Label>
                      {editingUser ? (
                        <Input
                          id="editEmail"
                          value={editUserData.email}
                          onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                          className="bg-gray-800 border-gray-600 text-white mt-1"
                        />
                      ) : (
                        <p className="text-white mt-1">{selectedUser.email}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-gray-300">Username</Label>
                      <p className="text-white mt-1">{selectedUser.username}</p>
                    </div>
                    <div>
                      <Label className="text-gray-300">Created At</Label>
                      <p className="text-white mt-1">
                        {new Date(selectedUser.createdAt || '').toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-300">Account Age</Label>
                      <p className="text-white mt-1">
                        {Math.floor((Date.now() - new Date(selectedUser.createdAt || '').getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </div>

                  {/* SIP Configuration Section */}
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-lg font-semibold text-white mb-3">SIP Configuration</h4>
                    {userSipConfig ? (
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-gray-300">SIP Username</Label>
                            <p className="text-white font-mono">{userSipConfig.username}</p>
                          </div>
                          <div>
                            <Label className="text-gray-300">Domain</Label>
                            <p className="text-white font-mono">{userSipConfig.domain}</p>
                          </div>
                          <div>
                            <Label className="text-gray-300">Server</Label>
                            <p className="text-white font-mono">{userSipConfig.server}:{userSipConfig.port}</p>
                          </div>
                          <div>
                            <Label className="text-gray-300">Transport</Label>
                            <p className="text-white font-mono">{userSipConfig.transport}</p>
                          </div>
                        </div>
                        {!isAdmin(selectedUser) && (
                          <Button
                            variant="destructive"
                            onClick={handleSipUnassignFromModal}
                            className="mt-4 w-full"
                          >
                            <PhoneOff className="h-4 w-4 mr-2" />
                            Unassign SIP
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-800 p-4 rounded-lg text-center">
                        <p className="text-gray-300 mb-3">No SIP configuration assigned</p>
                        {!isAdmin(selectedUser) && (
                          <Button
                            onClick={() => {
                              setAssignSipModalOpen(true);
                              fetchAvailableSipConfigs();
                            }}
                            className="bg-purple-500 hover:bg-purple-600"
                          >
                            <PhoneCall className="h-4 w-4 mr-2" />
                            Assign SIP Configuration
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                    <div className="flex space-x-2">
                      {!isAdmin(selectedUser) && (
                        <>
                          {selectedUser.status === 'active' ? (
                            <Button
                              variant="destructive"
                              onClick={() => handleUserActionFromModal('deactivate')}
                            >
                              <ShieldOff className="h-4 w-4 mr-2" />
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleUserActionFromModal('activate')}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Activate
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {editingUser ? (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => setEditingUser(false)}
                            className="border-gray-600 text-white"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                          <Button
                            onClick={handleUpdateUser}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => setEditingUser(true)}
                          disabled={isAdmin(selectedUser)}
                          className="bg-purple-500 hover:bg-purple-600"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {isAdmin(selectedUser) ? 'Cannot Edit Admin' : 'Edit User'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-300">User not found</p>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* SIP Assignment Modal */}
      <Dialog open={assignSipModalOpen} onOpenChange={setAssignSipModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign SIP Configuration</DialogTitle>
            <DialogDescription className="text-gray-300">
              Select an available SIP configuration to assign to {selectedUser?.fullName || selectedUser?.username}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-300">Available Configurations</span>
              <Button
                size="sm"
                onClick={fetchAvailableSipConfigs}
                disabled={loadingAvailableSipConfigs}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 text-white ${loadingAvailableSipConfigs ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by SIP ID, username, or domain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-purple-500"
              />
              {searchTerm && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {loadingAvailableSipConfigs ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-gray-300">Loading available configurations...</p>
              </div>
            ) : filteredSipConfigs.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <div className="text-sm text-gray-400 mb-2">
                  Showing {filteredSipConfigs.length} of {availableSipConfigs.length} configurations
                  {searchTerm && ` (filtered by "${searchTerm}")`}
                </div>
                {filteredSipConfigs.map((config) => (
                  <div
                    key={config.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSipConfigId === config.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedSipConfigId(config.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-white">
                          <span className="text-purple-400">#{config.id}</span> - {config.username}@{config.domain}
                        </div>
                        <div className="text-sm text-gray-300">
                          {config.server}:{config.port} ({config.transport})
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-500 text-white">
                        Available
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                {searchTerm ? (
                  <>
                    <p className="text-gray-300">No configurations found matching "{searchTerm}".</p>
                    <Button
                      size="sm"
                      onClick={() => setSearchTerm('')}
                      className="mt-2 bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                    >
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-300">No available SIP configurations found.</p>
                    <p className="text-sm text-gray-400 mt-2">
                      All configurations may be assigned or the SIP Gateway may be unavailable.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setAssignSipModalOpen(false);
                setSelectedSipConfigId(null);
              }}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignSip}
              disabled={assigningSip || !selectedSipConfigId || filteredSipConfigs.length === 0}
              className="bg-purple-500 hover:bg-purple-600"
            >
              {assigningSip ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Assign SIP
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard; 