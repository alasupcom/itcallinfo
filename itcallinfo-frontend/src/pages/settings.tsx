import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/services/queryClient';
import { useUserStore } from '@/store/userStore';
import { useSipStore } from '@/store/sipStore';
import { useToast } from '@/hooks/useToast';
import { useThemeStore } from '@/store/themeStore';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

// Define validation schemas
const profileSchema = z.object({
  fullName: z.string().optional(),
  phoneNumber: z.string().optional(),
  avatarUrl: z.string().optional(),
  status: z.string().optional(),
});

const sipConfigSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  server: z.string().min(1, 'Server is required'),
  port: z.coerce.number().min(1, 'Port is required'),
  transport: z.string(),
  iceServers: z.any(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type SipConfigFormValues = z.infer<typeof sipConfigSchema>;

export default function SettingsPage() {
  const { user } = useUserStore();
  const { sipConfig } = useSipStore();
  const { toast } = useToast();
  const { theme, setTheme } = useThemeStore();
  const [testingConnection, setTestingConnection] = useState(false);

  // User profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      phoneNumber: user?.phoneNumber || '',
      avatarUrl: user?.avatarUrl || '',
      status: user?.status || 'online',
    },
  });

  // SIP config form
  const sipConfigForm = useForm<SipConfigFormValues>({
    resolver: zodResolver(sipConfigSchema),
    defaultValues: sipConfig ? {
      domain: sipConfig.domain,
      username: sipConfig.username,
      password: sipConfig.password,
      server: sipConfig.server,
      port: sipConfig.port,
      transport: sipConfig.transport || 'WSS',
      iceServers: sipConfig.iceServers,
    } : {
      domain: '',
      username: '',
      password: '',
      server: '',
      port: 8443,
      transport: 'WSS',
      iceServers: { urls: ['stun:stun.l.google.com:19302'] },
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      return apiRequest('/api/user', 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update SIP config mutation
  const updateSipConfigMutation = useMutation({
    mutationFn: async (data: SipConfigFormValues) => {
      return apiRequest('/api/sip/config', 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sip/config'] });
      toast({
        title: "SIP Configuration Updated",
        description: "Your SIP settings have been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update SIP configuration. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Submit profile form
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  // Submit SIP config form
  const onSipConfigSubmit = (data: SipConfigFormValues) => {
    // Ensure iceServers is in the correct format
    if (typeof data.iceServers === 'string') {
      try {
        data.iceServers = JSON.parse(data.iceServers);
      } catch (error) {
        toast({
          title: "Invalid ICE Servers",
          description: "The ICE servers configuration is not valid JSON",
          variant: "destructive",
        });
        return;
      }
    }

    updateSipConfigMutation.mutate(data);
  };

  // Test SIP connection
  const testSipConnection = async () => {
    setTestingConnection(true);
    try {
      const config = sipConfigForm.getValues();

      // In a real app, you would test the connection here
      // For demo purposes, we'll just simulate a test
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: "Connection Successful",
        description: "Successfully connected to the SIP server",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to the SIP server. Please check your settings.",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="appearance">
        <TabsList className="mb-4">
          {/* <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="sip">SIP Configuration</TabsTrigger> */}
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Profile Settings Tab */}
        {/* <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your personal information and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="avatarUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar URL</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter avatar URL" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter a URL for your profile picture
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="away">Away</SelectItem>
                            <SelectItem value="busy">Busy</SelectItem>
                            <SelectItem value="offline">Offline</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="w-full"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Save Profile Settings"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* SIP Configuration Tab */}
        {/* <TabsContent value="sip">
          <Card>
            <CardHeader>
              <CardTitle>SIP Configuration</CardTitle>
              <CardDescription>
                Configure your SIP account settings for calls and meetings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...sipConfigForm}>
                <form onSubmit={sipConfigForm.handleSubmit(onSipConfigSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={sipConfigForm.control}
                      name="domain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SIP Domain</FormLabel>
                          <FormControl>
                            <Input placeholder="sip.example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={sipConfigForm.control}
                      name="server"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SIP Server</FormLabel>
                          <FormControl>
                            <Input placeholder="sip.example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={sipConfigForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SIP Username</FormLabel>
                          <FormControl>
                            <Input placeholder="username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={sipConfigForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SIP Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="********" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={sipConfigForm.control}
                      name="port"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SIP Port</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="8443"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={sipConfigForm.control}
                      name="transport"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transport Protocol</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select transport protocol" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="WSS">WSS (WebSocket Secure)</SelectItem>
                              <SelectItem value="WS">WS (WebSocket)</SelectItem>
                              <SelectItem value="UDP">UDP</SelectItem>
                              <SelectItem value="TCP">TCP</SelectItem>
                              <SelectItem value="TLS">TLS</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={sipConfigForm.control}
                    name="iceServers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ICE Servers (STUN/TURN)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='{"urls": ["stun:stun.l.google.com:19302"]}'
                            rows={3}
                            {...field}
                            value={typeof field.value === 'object' ? JSON.stringify(field.value, null, 2) : field.value}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the ICE server configuration in JSON format
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={testSipConnection}
                      disabled={testingConnection || updateSipConfigMutation.isPending}
                      className="flex-1"
                    >
                      {testingConnection ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing Connection...
                        </>
                      ) : (
                        "Test Connection"
                      )}
                    </Button>

                    <Button
                      type="submit"
                      disabled={updateSipConfigMutation.isPending}
                      className="flex-1"
                    >
                      {updateSipConfigMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save SIP Settings"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={theme}
                      onValueChange={(value) => setTheme(value as 'light' | 'dark')}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">Small</Button>
                    <Button variant="outline" size="sm">Medium</Button>
                    <Button variant="outline" size="sm">Large</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Layout Density</Label>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">Compact</Button>
                    <Button variant="outline" size="sm">Comfortable</Button>
                    <Button variant="outline" size="sm">Spacious</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Enable Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Allow the application to send you notifications
                    </p>
                  </div>
                  <Switch id="notifications" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Incoming Call Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get notified when someone calls you
                    </p>
                  </div>
                  <Switch id="call-notifications" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Message Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get notified when you receive new messages
                    </p>
                  </div>
                  <Switch id="message-notifications" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Meeting Reminders</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get reminded before your scheduled meetings
                    </p>
                  </div>
                  <Switch id="meeting-notifications" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Sound Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Play sound when receiving notifications
                    </p>
                  </div>
                  <Switch id="sound-notifications" defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Notification Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}