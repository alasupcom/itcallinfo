import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/useToast';
import { 
  ArrowLeft, 
  Settings, 
  Phone, 
  Server, 
  Edit, 
  Save, 
  X, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  PhoneOff
} from 'lucide-react';
import { AdminAxiosClient } from '@/services/api/adminApi';

interface SipConfig {
  id: number;
  userId: number | null;
  domain: string;
  username: string;
  password: string;
  server: string;
  port: number;
  transport: string;
  iceServers: string[];
  createdAt: string;
  updatedAt: string;
  status?: 'assigned' | 'available';
}

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
}

const SipConfigManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sipConfigs, setSipConfigs] = useState<SipConfig[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<number | null>(null);
  const [editData, setEditData] = useState({
    domain: '',
    username: '',
    password: '',
    server: '',
    port: '',
    transport: ''
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalConfigs, setTotalConfigs] = useState(0);
  const [rangeInfo, setRangeInfo] = useState<{
    testRangeEnabled: boolean;
    rangeStart: number;
    rangeEnd: number;
  } | null>(null);
  const [pageSize] = useState(10);

  const adminApi = new AdminAxiosClient();

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all SIP configurations from the main endpoint
      const sipResponse = await adminApi.getSipConfigs({ page: currentPage, limit: pageSize });
      
      if (sipResponse.status === 200) {
        const sipData = sipResponse.data;
        console.log('SIP configs from main endpoint:', sipData);
        
        // Handle both array and paginated response formats
        if (Array.isArray(sipData)) {
          setSipConfigs(sipData);
          setTotalConfigs(sipData.length);
          setTotalPages(Math.ceil(sipData.length / pageSize));
        } else if (sipData.configs) {
          setSipConfigs(sipData.configs);
          setTotalConfigs(sipData.total || 0);
          setTotalPages(sipData.totalPages || 1);
        } else {
          setSipConfigs([]);
          setTotalConfigs(0);
          setTotalPages(1);
        }
      } else {
        console.error('Failed to fetch SIP configs');
        setSipConfigs([]);
        setTotalConfigs(0);
        setTotalPages(1);
      }

      // Fetch users for reference
      const usersResponse = await adminApi.getUsers();
      
      if (usersResponse.status === 200) {
        const usersData = usersResponse.data;
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load SIP configurations",
        variant: "destructive"
      });
      setSipConfigs([]);
      setTotalConfigs(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config: SipConfig) => {
    setEditingConfig(config.id);
    setEditData({
      domain: config.domain,
      username: config.username,
      password: config.password,
      server: config.server,
      port: config.port.toString(),
      transport: config.transport
    });
  };

  const handleSave = async (configId: number) => {
    try {
      const response = await adminApi.updateSipConfig(configId, {
        ...editData,
        port: parseInt(editData.port)
      });

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "SIP configuration updated successfully",
        });
        setEditingConfig(null);
        fetchData();
      } else {
        const errorData = response.data;
        throw new Error(errorData.error || 'Failed to update SIP configuration');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update SIP configuration",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setEditingConfig(null);
  };

  const handleRelease = async (configId: number) => {
    if (!confirm('Are you sure you want to release this SIP configuration? This will unassign it from the current user.')) {
      return;
    }

    try {
      const response = await adminApi.unassignSipConfig(configId);

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "SIP configuration released successfully",
        });
        fetchData();
      } else {
        const errorData = response.data;
        throw new Error(errorData.error || 'Failed to release SIP configuration');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to release SIP configuration",
        variant: "destructive"
      });
    }
  };

  const getUserName = (userId: number | null) => {
    if (!userId) return 'Unassigned';
    const user = users.find(u => u.id === userId);
    return user ? user.username : 'Unknown User';
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    fetchData();
  };

  const fetchSipConfigs = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await adminApi.getSipConfigs({ page, limit: pageSize });

      if (response.status === 200) {
        const data = response.data;
        setSipConfigs(data.configs || []);
        setTotalPages(data.totalPages || 0);
        setTotalConfigs(data.total || 0);
        setRangeInfo(data.rangeInfo || null);
        setCurrentPage(data.page || 1);
      } else {
        throw new Error('Failed to fetch SIP configurations');
      }
    } catch (error) {
      console.error('Error fetching SIP configs:', error);
      toast({
        title: "Error",
        description: "Failed to load SIP configurations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading SIP configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">SIP Configuration Management</h1>
            <p className="text-gray-300 mt-2">
              {rangeInfo?.testRangeEnabled ? (
                <span className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-orange-500 text-white">
                    TEST RANGE ENABLED
                  </Badge>
                  Managing SIP configurations in range {rangeInfo.rangeStart}-{rangeInfo.rangeEnd}
                </span>
              ) : (
                "Manage all SIP configurations and assignments"
              )}
            </p>
          </div>
          <Button 
            onClick={fetchData}
            disabled={loading}
            className="bg-purple-500 hover:bg-purple-600"
          >
            <RefreshCw className={`h-4 w-4 mr-2 text-white ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">Total Configurations</CardTitle>
              {rangeInfo?.testRangeEnabled && (
                <CardDescription className="text-orange-300 text-xs">
                  Range {rangeInfo.rangeStart}-{rangeInfo.rangeEnd}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalConfigs}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">Assigned</CardTitle>
              {rangeInfo?.testRangeEnabled && (
                <CardDescription className="text-orange-300 text-xs">
                  Range {rangeInfo.rangeStart}-{rangeInfo.rangeEnd}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">
                {sipConfigs.filter(c => c.status === 'assigned').length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">Available</CardTitle>
              {rangeInfo?.testRangeEnabled && (
                <CardDescription className="text-orange-300 text-xs">
                  Range {rangeInfo.rangeStart}-{rangeInfo.rangeEnd}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                {sipConfigs.filter(c => c.status === 'available').length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">Utilization</CardTitle>
              {rangeInfo?.testRangeEnabled && (
                <CardDescription className="text-orange-300 text-xs">
                  Range {rangeInfo.rangeStart}-{rangeInfo.rangeEnd}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">
                {totalConfigs > 0 
                  ? Math.round((sipConfigs.filter(c => c.status === 'assigned').length / totalConfigs) * 100)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SIP Configurations List */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">SIP Configurations</CardTitle>
          </CardHeader>
          <CardContent>
            {sipConfigs.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 text-lg">No SIP configurations found</p>
                <p className="text-gray-400">SIP configurations will appear here once they are created or assigned.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sipConfigs.map((config) => (
                  <Card key={config.id} className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white">SipID: {config.username}</CardTitle>
                          <CardDescription className="text-gray-300">
                            {config.server}:{config.port} • {config.transport}
                          </CardDescription>
                          {rangeInfo?.testRangeEnabled && (
                            <div className="text-xs text-orange-300 mt-1">
                              Range: {rangeInfo.rangeStart}-{rangeInfo.rangeEnd}
                            </div>
                          )}
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={`${
                            config.status === 'assigned' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                          }`}
                        >
                          {config.status === 'assigned' ? 'Assigned' : 'Available'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-300">Domain</Label>
                          <p className="text-white font-mono">{config.domain}</p>
                        </div>
                        <div>
                          <Label className="text-gray-300">Transport</Label>
                          <p className="text-white font-mono">{config.transport}</p>
                        </div>
                        {config.status === 'assigned' && config.userId && (
                          <div className="md:col-span-2">
                            <Label className="text-gray-300">Assigned to User ID</Label>
                            <p className="text-white font-mono">{config.userId}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="flex justify-between w-full">
                        <Button
                          size="sm"
                          className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                        >
                          <Eye className="h-4 w-4 mr-2 text-white" />
                          View Details
                        </Button>
                        {config.status === 'assigned' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRelease(config.id)}
                          >
                            <PhoneOff className="h-4 w-4 mr-2" />
                            Unassign
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                <div className="text-sm text-gray-300 text-center sm:text-left">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalConfigs)} of {totalConfigs} configurations
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1 text-white" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>
                    
                    {/* Mobile-friendly page numbers */}
                    <div className="flex items-center space-x-1">
                      {/* Show first page */}
                      {currentPage > 2 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(1)}
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                          >
                            1
                          </Button>
                          {currentPage > 3 && (
                            <span className="text-gray-400 px-2">...</span>
                          )}
                        </>
                      )}
                      
                      {/* Show current page and neighbors */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => 
                          page === 1 || 
                          page === totalPages || 
                          Math.abs(page - currentPage) <= 1
                        )
                        .map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className={currentPage === page 
                              ? "bg-purple-600 hover:bg-purple-700 text-white" 
                              : "border-gray-600 text-white hover:bg-gray-700"
                            }
                          >
                            {page}
                          </Button>
                        ))}
                      
                      {/* Show last page */}
                      {currentPage < totalPages - 1 && (
                        <>
                          {currentPage < totalPages - 2 && (
                            <span className="text-gray-400 px-2">...</span>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(totalPages)}
                            className="border-gray-600 text-white hover:bg-gray-700"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4 ml-1 text-white" />
                    </Button>
                  </div>
                  
                  {/* Page info for mobile */}
                  <div className="text-xs text-gray-400 sm:hidden">
                    Page {currentPage} of {totalPages}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SipConfigManagement; 