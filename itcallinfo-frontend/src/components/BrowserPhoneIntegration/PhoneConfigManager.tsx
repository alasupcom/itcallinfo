// import { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Switch } from '@/components/ui/switch';
// import { useToast } from '@/hooks/use-toast';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { PhoneConfig } from '../types/phoneConfig';

// interface PhoneConfigManagerProps {
//   onConfigUpdated?: () => void;
// }

// export default function PhoneConfigManager({ onConfigUpdated }: PhoneConfigManagerProps) {
//   const [configs, setConfigs] = useState<PhoneConfig[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [selectedConfig, setSelectedConfig] = useState<PhoneConfig | null>(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [formData, setFormData] = useState<Partial<PhoneConfig>>({});
//   const { toast } = useToast();

//   // Fetch all configurations
//   const fetchConfigs = async () => {
//     setIsLoading(true);
//     try {
//       const response = await fetch('/api/browser-phone/configs');
//       if (!response.ok) {
//         throw new Error('Failed to fetch configurations');
//       }
//       const data = await response.json();
//       setConfigs(data);
      
//       // Select the default config initially
//       const defaultConfig = data.find((config: PhoneConfig) => config.isDefault);
//       setSelectedConfig(defaultConfig || (data.length > 0 ? data[0] : null));
//     } catch (error) {
//       console.error('Error fetching configurations:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to load phone configurations',
//         variant: 'destructive',
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchConfigs();
//   }, []);

//   // Initialize form data when selecting a config
//   useEffect(() => {
//     if (selectedConfig) {
//       setFormData({ ...selectedConfig });
//     } else {
//       setFormData({});
//     }
//   }, [selectedConfig]);

//   const handleInputChange = (field: keyof PhoneConfig, value: any) => {
//     setFormData({ ...formData, [field]: value });
//   };

//   const handleCreateNew = () => {
//     setSelectedConfig(null);
//     setFormData({
//       serverAddress: '',
//       webSocketPort: '',
//       serverPath: '',
//       sipUsername: '',
//       sipPassword: '',
//       sipDomain: '',
//       regExpires: 300,
//       transport: 'wss',
//       doRegistration: true,
//       isDefault: configs.length === 0 // Make default if it's the first config
//     });
//     setIsEditing(true);
//   };

//   const handleEdit = () => {
//     setIsEditing(true);
//   };

//   const handleCancel = () => {
//     if (selectedConfig) {
//       setFormData({ ...selectedConfig });
//     }
//     setIsEditing(false);
//   };

//   const handleSave = async () => {
//     try {
//       let response;
      
//       if (selectedConfig) {
//         // Update existing config
//         response = await fetch(`/api/browser-phone/configs/${selectedConfig.id}`, {
//           method: 'PATCH',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(formData)
//         });
//       } else {
//         // Create new config
//         response = await fetch('/api/browser-phone/configs', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(formData)
//         });
//       }

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to save configuration');
//       }

//       toast({
//         title: 'Success',
//         description: `Configuration ${selectedConfig ? 'updated' : 'created'} successfully`,
//       });
      
//       setIsEditing(false);
//       fetchConfigs();
      
//       if (onConfigUpdated) {
//         onConfigUpdated();
//       }
//     } catch (error) {
//       console.error('Error saving configuration:', error);
//       toast({
//         title: 'Error',
//         description: error instanceof Error ? error.message : 'Failed to save configuration',
//         variant: 'destructive',
//       });
//     }
//   };

//   const handleDelete = async () => {
//     if (!selectedConfig) return;
    
//     if (!confirm(`Are you sure you want to delete the configuration "${selectedConfig.sipUsername}@${selectedConfig.sipDomain}"?`)) {
//       return;
//     }
    
//     try {
//       const response = await fetch(`/api/browser-phone/configs/${selectedConfig.id}`, {
//         method: 'DELETE'
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to delete configuration');
//       }

//       toast({
//         title: 'Success',
//         description: 'Configuration deleted successfully',
//       });
      
//       setSelectedConfig(null);
//       fetchConfigs();
      
//       if (onConfigUpdated) {
//         onConfigUpdated();
//       }
//     } catch (error) {
//       console.error('Error deleting configuration:', error);
//       toast({
//         title: 'Error',
//         description: error instanceof Error ? error.message : 'Failed to delete configuration',
//         variant: 'destructive',
//       });
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center p-8">
//         <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   return (
//     <Card className="w-full max-w-4xl mx-auto">
//       <CardHeader>
//         <CardTitle>Phone Configurations</CardTitle>
//         <CardDescription>Manage SIP server configurations for Browser-Phone</CardDescription>
        
//         <div className="flex justify-between items-center mt-4">
//           <div className="flex items-center gap-2">
//             <Label htmlFor="configSelect">Active Configuration:</Label>
//             <Select 
//               value={selectedConfig?.id?.toString() || ''}
//               onValueChange={(value) => {
//                 const config = configs.find(c => c.id.toString() === value);
//                 setSelectedConfig(config || null);
//                 setIsEditing(false);
//               }}
//               disabled={isEditing || configs.length === 0}
//             >
//               <SelectTrigger className="w-[240px]">
//                 <SelectValue placeholder="Select a configuration" />
//               </SelectTrigger>
//               <SelectContent>
//                 {configs.map((config) => (
//                   <SelectItem key={config.id} value={config.id.toString()}>
//                     {config.sipUsername}@{config.sipDomain} {config.isDefault ? '(Default)' : ''}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
          
//           <div className="space-x-2">
//             <Button variant="outline" onClick={handleCreateNew} disabled={isEditing}>
//               New Configuration
//             </Button>
//           </div>
//         </div>
//       </CardHeader>
      
//       <CardContent>
//         {(selectedConfig || isEditing) ? (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="serverAddress">Server Address</Label>
//                 <Input
//                   id="serverAddress"
//                   value={formData.serverAddress || ''}
//                   onChange={(e) => handleInputChange('serverAddress', e.target.value)}
//                   disabled={!isEditing}
//                   placeholder="e.g., sip.example.com"
//                 />
//               </div>
              
//               <div className="space-y-2">
//                 <Label htmlFor="webSocketPort">WebSocket Port</Label>
//                 <Input
//                   id="webSocketPort"
//                   value={formData.webSocketPort || ''}
//                   onChange={(e) => handleInputChange('webSocketPort', e.target.value)}
//                   disabled={!isEditing}
//                   placeholder="e.g., 443"
//                 />
//               </div>
              
//               <div className="space-y-2">
//                 <Label htmlFor="serverPath">Server Path</Label>
//                 <Input
//                   id="serverPath"
//                   value={formData.serverPath || ''}
//                   onChange={(e) => handleInputChange('serverPath', e.target.value)}
//                   disabled={!isEditing}
//                   placeholder="e.g., /ws"
//                 />
//               </div>
              
//               <div className="space-y-2">
//                 <Label htmlFor="transport">Transport Protocol</Label>
//                 <Select
//                   value={formData.transport || 'wss'}
//                   onValueChange={(value) => handleInputChange('transport', value)}
//                   disabled={!isEditing}
//                 >
//                   <SelectTrigger id="transport">
//                     <SelectValue placeholder="Select transport" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="wss">WSS (Secure WebSocket)</SelectItem>
//                     <SelectItem value="ws">WS (WebSocket)</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
            
//             <div className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="sipUsername">SIP Username</Label>
//                 <Input
//                   id="sipUsername"
//                   value={formData.sipUsername || ''}
//                   onChange={(e) => handleInputChange('sipUsername', e.target.value)}
//                   disabled={!isEditing}
//                   placeholder="e.g., user123"
//                 />
//               </div>
              
//               <div className="space-y-2">
//                 <Label htmlFor="sipPassword">SIP Password</Label>
//                 <Input
//                   id="sipPassword"
//                   type="password"
//                   value={formData.sipPassword || ''}
//                   onChange={(e) => handleInputChange('sipPassword', e.target.value)}
//                   disabled={!isEditing}
//                   placeholder="Enter password"
//                 />
//               </div>
              
//               <div className="space-y-2">
//                 <Label htmlFor="sipDomain">SIP Domain</Label>
//                 <Input
//                   id="sipDomain"
//                   value={formData.sipDomain || ''}
//                   onChange={(e) => handleInputChange('sipDomain', e.target.value)}
//                   disabled={!isEditing}
//                   placeholder="e.g., sip.example.com"
//                 />
//               </div>
              
//               <div className="space-y-2">
//                 <Label htmlFor="regExpires">Registration Expiry (seconds)</Label>
//                 <Input
//                   id="regExpires"
//                   type="number"
//                   value={formData.regExpires?.toString() || '300'}
//                   onChange={(e) => handleInputChange('regExpires', parseInt(e.target.value))}
//                   disabled={!isEditing}
//                   min="60"
//                   max="3600"
//                 />
//               </div>
              
//               <div className="flex items-center justify-between pt-2">
//                 <Label htmlFor="doRegistration">Register with server</Label>
//                 <Switch
//                   id="doRegistration"
//                   checked={formData.doRegistration || false}
//                   onCheckedChange={(checked) => handleInputChange('doRegistration', checked)}
//                   disabled={!isEditing}
//                 />
//               </div>
              
//               <div className="flex items-center justify-between pt-2">
//                 <Label htmlFor="isDefault">Set as default configuration</Label>
//                 <Switch
//                   id="isDefault"
//                   checked={formData.isDefault || false}
//                   onCheckedChange={(checked) => handleInputChange('isDefault', checked)}
//                   disabled={!isEditing}
//                 />
//               </div>
//             </div>
//           </div>
//         ) : (
//           <div className="p-6 text-center">
//             <p className="text-gray-500">No configuration selected. Select an existing configuration or create a new one.</p>
//           </div>
//         )}
//       </CardContent>
      
//       <CardFooter className="flex justify-between">
//         <div>
//           {selectedConfig && !isEditing && (
//             <Button variant="destructive" onClick={handleDelete}>
//               Delete
//             </Button>
//           )}
//         </div>
        
//         <div className="space-x-2">
//           {isEditing ? (
//             <>
//               <Button variant="outline" onClick={handleCancel}>
//                 Cancel
//               </Button>
//               <Button onClick={handleSave}>
//                 Save
//               </Button>
//             </>
//           ) : (
//             selectedConfig && (
//               <Button onClick={handleEdit}>
//                 Edit
//               </Button>
//             )
//           )}
//         </div>
//       </CardFooter>
//     </Card>
//   );
// }