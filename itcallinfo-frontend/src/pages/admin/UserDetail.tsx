import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  ShieldOff,
  PhoneCall,
  PhoneOff,
  Edit,
  Save,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Plus,
  RefreshCw,
  Wifi
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { AdminAxiosClient } from '@/services/api/adminApi';

interface UserDetail {
  user: {
    id: number;
    username: string;
    email: string;
    fullName: string | null;
    phoneNumber: string | null;
    status: string | null;
    isVerified: boolean;
    createdAt: string | null;
    avatarUrl: string | null;
  };
  sipConfig?: {
    id: number;
    domain: string;
    username: string;
    server: string;
    port: number;
    transport: string;
  };
}

interface AvailableSipConfig {
  id: number;
  domain: string;
  username: string;
  server: string;
  port: number;
  transport: string;
}

const UserDetail: React.FC = () => {
  const { userId } = useParams({ from: '/admin/users/$userId' });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullName: '',
    phoneNumber: '',
    email: ''
  });
  
  // SIP Assignment Modal State
  const [assignSipModalOpen, setAssignSipModalOpen] = useState(false);
  const [availableSipConfigs, setAvailableSipConfigs] = useState<AvailableSipConfig[]>([]);
  const [loadingAvailableConfigs, setLoadingAvailableConfigs] = useState(false);
  const [selectedSipConfigId, setSelectedSipConfigId] = useState<number | null>(null);
  const [assigningSip, setAssigningSip] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSipConfigs, setFilteredSipConfigs] = useState<AvailableSipConfig[]>([]);

  const adminApi = new AdminAxiosClient();

  console.log('UserDetail component rendered with userId:', userId);

  useEffect(() => {
    if (userId) {
      console.log('Fetching user details for userId:', userId);
      fetchUserDetail();
    } else {
      console.error('No userId provided to UserDetail component');
    }
  }, [userId]);

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

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      console.log('Making API request to:', `/api/admin/users/${userId}`);
      
      const response = await adminApi.getUserById(userId);

      console.log('API response status:', response.status);

      if (response.status === 200) {
        const data = response.data;
        console.log('User detail data received:', data);
        setUserDetail(data);
        setEditData({
          fullName: data.user.fullName || '',
          phoneNumber: data.user.phoneNumber || '',
          email: data.user.email || ''
        });
      } else {
        console.error('API error response:', response.statusText);
        throw new Error(`Failed to fetch user details: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error in fetchUserDetail:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load user details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSipConfigs = async () => {
    try {
      setLoadingAvailableConfigs(true);
      const response = await adminApi.getAvailableSipConfigs();

      if (response.status === 200) {
        const data = response.data;
        setAvailableSipConfigs(data.configs || []);
        console.log(`Loaded ${data.configs?.length || 0} available SIP configurations`);
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
      setLoadingAvailableConfigs(false);
    }
  };

  const handleAssignSip = async () => {
    if (!selectedSipConfigId) {
      toast({
        title: "Error",
        description: "Please select a SIP configuration",
        variant: "destructive"
      });
      return;
    }

    try {
      setAssigningSip(true);
      const response = await adminApi.assignSipConfig(selectedSipConfigId, userId);

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "SIP configuration assigned successfully",
        });
        setAssignSipModalOpen(false);
        setSelectedSipConfigId(null);
        fetchUserDetail(); // Refresh user details to show new SIP config
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

  const handleUserAction = async (action: 'activate' | 'deactivate') => {
    try {
      // Prevent actions on admin accounts
      if (userDetail?.user.email === 'admin@itcallinfo.com' || userDetail?.user.username === 'admin') {
        toast({
          title: "Error",
          description: "Cannot modify admin accounts",
          variant: "destructive"
        });
        return;
      }

      const response = await adminApi.updateUserStatus(userId, action);

      if (response.status === 200) {
        toast({
          title: "Success",
          description: `User ${action}d successfully`,
        });
        fetchUserDetail();
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

  const handleSipUnassign = async () => {
    if (!userDetail?.sipConfig) return;

    // Prevent unassigning admin SIP configs
    if (userDetail.user.email === 'admin@itcallinfo.com' || userDetail.user.username === 'admin') {
      toast({
        title: "Error",
        description: "Cannot unassign admin SIP configuration",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await adminApi.unassignSipConfig(userDetail.sipConfig.id);

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "SIP configuration unassigned successfully",
        });
        fetchUserDetail();
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

  const handleSaveEdit = async () => {
    try {
      // Prevent editing admin accounts
      if (userDetail?.user.email === 'admin@itcallinfo.com' || userDetail?.user.username === 'admin') {
        toast({
          title: "Error",
          description: "Cannot modify admin accounts",
          variant: "destructive"
        });
        return;
      }

      const response = await adminApi.updateUser(userId, editData);

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "User updated successfully",
        });
        setEditing(false);
        fetchUserDetail();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!userDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg">User not found</p>
          <Button onClick={() => navigate({ to: '/admin/dashboard' })} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const { user, sipConfig } = userDetail;

  const isAdmin = user.email === 'admin@itcallinfo.com' || user.username === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/admin/dashboard' })}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-white">User Details</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {editing ? (
              <>
                <Button onClick={handleSaveEdit} className="bg-green-500 hover:bg-green-600">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditing(false)}
                  className="border-white/20 text-white"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => setEditing(true)}
                className="bg-purple-500 hover:bg-purple-600"
                disabled={isAdmin}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isAdmin ? 'Cannot Edit Admin' : 'Edit'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback className="bg-purple-500 text-white text-xl">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-white text-xl">{user.fullName || user.username}</CardTitle>
                    <CardDescription className="text-gray-300">
                      User ID: {user.id}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Username</label>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-purple-400" />
                      <span className="text-white">{user.username}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Email</label>
                    {editing ? (
                      <Input
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-purple-400" />
                        <span className="text-white">{user.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Full Name</label>
                    {editing ? (
                      <Input
                        value={editData.fullName}
                        onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-purple-400" />
                        <span className="text-white">{user.fullName || 'Not provided'}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Phone Number</label>
                    {editing ? (
                      <Input
                        value={editData.phoneNumber}
                        onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-purple-400" />
                        <span className="text-white">{user.phoneNumber || 'Not provided'}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Status</label>
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-purple-400" />
                      <Badge 
                        variant="secondary" 
                        className={`${
                          user.status === 'online' ? 'bg-green-500 text-white' :
                          user.status === 'active' ? 'bg-blue-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}
                      >
                        {user.status || 'offline'}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Verification</label>
                    <div className="flex items-center space-x-2">
                      {user.isVerified ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                      <Badge 
                        variant="secondary" 
                        className={user.isVerified ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
                      >
                        {user.isVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Created At</label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-purple-400" />
                    <span className="text-white">
                      {new Date(user.createdAt || '').toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SIP Configuration */}
            {sipConfig && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">SIP Configuration</CardTitle>
                  <CardDescription className="text-gray-300">
                    Current SIP settings for this user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">SIP Username</label>
                      <div className="text-white font-mono bg-white/5 p-2 rounded">
                        {sipConfig.username}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Domain</label>
                      <div className="text-white font-mono bg-white/5 p-2 rounded">
                        {sipConfig.domain}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Server</label>
                      <div className="text-white font-mono bg-white/5 p-2 rounded">
                        {sipConfig.server}:{sipConfig.port}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Transport</label>
                      <div className="text-white font-mono bg-white/5 p-2 rounded">
                        {sipConfig.transport}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button
                      variant="destructive"
                      onClick={handleSipUnassign}
                      className="w-full"
                      disabled={isAdmin}
                    >
                      <PhoneOff className="h-4 w-4 mr-2" />
                      {isAdmin ? 'Cannot Unassign Admin SIP' : 'Unassign SIP'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.status === 'active' ? (
                  <Button
                    variant="destructive"
                    onClick={() => handleUserAction('deactivate')}
                    className="w-full"
                    disabled={isAdmin}
                  >
                    <ShieldOff className="h-4 w-4 mr-2" />
                    {isAdmin ? 'Cannot Deactivate Admin' : 'Deactivate User'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleUserAction('activate')}
                    className="w-full bg-green-500 hover:bg-green-600"
                    disabled={isAdmin}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {isAdmin ? 'Cannot Activate Admin' : 'Activate User'}
                  </Button>
                )}

                {sipConfig ? (
                  <Button
                    variant="outline"
                    className="w-full border-white/20 text-white"
                    onClick={handleSipUnassign}
                    disabled={isAdmin}
                  >
                    <PhoneOff className="h-4 w-4 mr-2" />
                    {isAdmin ? 'Cannot Unassign Admin SIP' : 'Unassign SIP'}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-white/20 text-white"
                    onClick={() => {
                      setAssignSipModalOpen(true);
                      fetchAvailableSipConfigs();
                    }}
                    disabled={isAdmin}
                  >
                    <PhoneCall className="h-4 w-4 mr-2" />
                    {isAdmin ? 'Cannot Assign Admin SIP' : 'Assign SIP'}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">User Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-300">Account Age:</span>
                  <span className="text-white">
                    {Math.floor((Date.now() - new Date(user.createdAt || '').getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Connection:</span>
                  <Badge 
                    variant="secondary" 
                    className={`${
                      user.status === 'online' ? 'bg-green-500 text-white' :
                      'bg-gray-500 text-white'
                    }`}
                  >
                    <Wifi className={`h-3 w-3 mr-1 ${user.status === 'online' ? 'text-white' : 'text-gray-300'}`} />
                    {user.status === 'online' ? 'Online' : 'Offline'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Account:</span>
                  <Badge 
                    variant="secondary" 
                    className={`${
                      user.status === 'active' || isAdmin ? 'bg-blue-500 text-white' :
                      'bg-red-500 text-white'
                    }`}
                  >
                    {user.status === 'active' || isAdmin ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Verified:</span>
                  {user.isVerified ? (
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
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">SIP Config:</span>
                  {sipConfig ? (
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* SIP Assignment Modal */}
      <Dialog open={assignSipModalOpen} onOpenChange={setAssignSipModalOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>Assign SIP Configuration</DialogTitle>
            <DialogDescription className="text-gray-300">
              Select an available SIP configuration to assign to this user.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-300">Available Configurations</span>
              <Button
                size="sm"
                onClick={fetchAvailableSipConfigs}
                disabled={loadingAvailableConfigs}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 text-white ${loadingAvailableConfigs ? 'animate-spin' : ''}`} />
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

            {loadingAvailableConfigs ? (
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
                        : 'border-white/20 hover:border-white/40'
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
              disabled={assigningSip || !selectedSipConfigId || availableSipConfigs.length === 0}
              className="bg-purple-500 hover:bg-purple-600"
            >
              {assigningSip ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
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

export default UserDetail; 