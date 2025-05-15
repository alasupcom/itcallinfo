import { create } from 'zustand';
import { UserAgent, UserAgentOptions, Registerer, Inviter, Session, SessionState, Invitation } from 'sip.js';
import { request } from '@/services/axios';

export interface SipConfig {
  id: number;
  userId: number;
  domain: string;
  username: string;
  password: string;
  server: string;
  port: number;
  transport: string;
  iceServers: { urls: string[] };
}

interface CallState {
  activeCall: boolean;
  incomingCall: boolean;
  callType: 'audio' | 'video' | null;
  callerId: string | null;
  callSession: any;
  isMuted: boolean;
  isHolding: boolean;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
}

interface SipState {
  sipConfig: SipConfig | null;
  userAgent: UserAgent | null;
  registerer: Registerer | null;
  connected: boolean;
  registered: boolean;
  connecting: boolean;
  error: string | null;
  latency: number | null;
  callState: CallState;

  fetchConfig: () => Promise<void>;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<boolean>;
  updateConfig: (config: Partial<SipConfig>) => Promise<boolean>;
  checkLatency: () => Promise<number>;
  
  // Call actions
  makeCall: (target: string, withVideo: boolean) => Promise<boolean>;
  endCall: () => Promise<boolean>;
  answerCall: (withVideo: boolean) => Promise<boolean>;
  rejectCall: () => Promise<boolean>;
  toggleMute: () => Promise<boolean>;
  toggleHold: () => Promise<boolean>;
  sendDTMF: (tone: string) => Promise<boolean>;
}

export const useSipStore = create<SipState>((set, get) => ({
  sipConfig: null,
  userAgent: null,
  registerer: null,
  connected: false,
  registered: false,
  connecting: false,
  error: null,
  latency: null,
  callState: {
    activeCall: false,
    incomingCall: false,
    callType: null,
    callerId: null,
    callSession: null,
    isMuted: false,
    isHolding: false,
    remoteStream: null,
    localStream: null
  },

  fetchConfig: async () => {
    try {
      const res = await fetch('/api/sip/config', {
        credentials: 'include',
      });
      
      if (res.ok) {
        const config = await res.json();
        set({ sipConfig: config });
      } else {
        set({ error: 'Failed to fetch SIP configuration' });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch SIP configuration' });
    }
  },

  connect: async () => {
    const { sipConfig, userAgent } = get();
    
    if (!sipConfig) {
      set({ error: 'No SIP configuration found' });
      return false;
    }
    
    if (userAgent) {
      return get().reconnect();
    }
    
    set({ connecting: true, error: null });
    
    try {
      // Create SIP user agent configuration
      const uri = `sip:${sipConfig.username}@${sipConfig.domain}`;
      const wsUri = `${sipConfig.transport.toLowerCase()}://${sipConfig.server}:${sipConfig.port}`;
      
      const userAgentOptions: UserAgentOptions = {
        uri: UserAgent.makeURI(uri)!,
        transportOptions: {
          server: wsUri,
        },
        authorizationUsername: sipConfig.username,
        authorizationPassword: sipConfig.password,
        sessionDescriptionHandlerFactoryOptions: {
          iceGatheringTimeout: 500,
          peerConnectionConfiguration: {
            iceServers: sipConfig.iceServers ? [sipConfig.iceServers] : undefined,
          },
        },
        logBuiltinEnabled: false,
        logLevel: 'warn',
      };
      
      // Create the user agent
      const newUserAgent = new UserAgent(userAgentOptions);
      
      // Create a registerer
      const newRegisterer = new Registerer(newUserAgent);
      
      // Listen for connection events
      newUserAgent.transport.onConnect = () => set({ connected: true });
      newUserAgent.transport.onDisconnect = () => set({ connected: false });
      
      // Listen for registerer events
      newRegisterer.stateChange.addListener((state) => {
        // @ts-ignore - RegistererState is an enum with string values
        set({ registered: state === 'registered' });
      });
      
      // Start the user agent and register
      await newUserAgent.start();
      await newRegisterer.register();
      
      // Check latency
      const latency = await get().checkLatency();
      
      set({ 
        userAgent: newUserAgent, 
        registerer: newRegisterer,
        connecting: false,
        latency
      });
      
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to connect to SIP server', 
        connecting: false 
      });
      return false;
    }
  },

  disconnect: async () => {
    const { userAgent, registerer } = get();
    
    if (registerer) {
      try {
        await registerer.unregister();
      } catch (error) {
        console.error('Error unregistering:', error);
      }
    }
    
    if (userAgent) {
      try {
        await userAgent.stop();
      } catch (error) {
        console.error('Error stopping user agent:', error);
      }
    }
    
    set({ 
      userAgent: null, 
      registerer: null, 
      connected: false, 
      registered: false 
    });
  },

  reconnect: async () => {
    await get().disconnect();
    return get().connect();
  },

  updateConfig: async (configUpdate) => {
    const { sipConfig } = get();
    
    if (!sipConfig) {
      set({ error: 'No SIP configuration found' });
      return false;
    }
    
    try {
      const res = await request<Partial<SipConfig>, any>({
        url: `/api/sip/config`,
        method: 'patch',
      }, configUpdate);
      const updatedConfig = res.data;
      
      set({ sipConfig: updatedConfig });
      
      // Reconnect with new configuration if already connected
      if (get().connected) {
        await get().reconnect();
      }
      
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update SIP configuration' });
      return false;
    }
  },

  checkLatency: async () => {
    const startTime = Date.now();
    const { userAgent } = get();
    
    if (!userAgent || !userAgent.transport.isConnected()) {
      return -1;
    }
    
    try {
      // Send a ping and wait for the response
      // @ts-ignore - Using private API
      await userAgent.transport.ping();
      const latency = Date.now() - startTime;
      set({ latency });
      return latency;
    } catch (error) {
      console.error('Error checking latency:', error);
      return -1;
    }
  },
  
  // Make an audio or video call
  makeCall: async (target: string, withVideo: boolean) => {
    const { sipConfig } = get();
    
    if (!sipConfig) {
      set({ error: 'No SIP configuration found' });
      return false;
    }
    
    try {
      const callFunction = withVideo ? ()=>{ /* @ts-ignore - MakeVideoCall is a function*/} : ()=>{ /* @ts-ignore - MakeAudioCall is a function*/};
      
      const callSession = await callFunction(sipConfig, target, {
        onLocalStream: (stream: any) => {
          set((state) => ({
            callState: {
              ...state.callState,
              localStream: stream
            }
          }));
        },
        onRemoteStream: (stream: any) => {
          set((state) => ({
            callState: {
              ...state.callState,
              remoteStream: stream
            }
          }));
        },
        onCallStarted: () => {
          set((state) => ({
            callState: {
              ...state.callState,
              activeCall: true,
              callType: withVideo ? 'video' : 'audio',
              callerId: target
            }
          }));
        },
        onCallEnded: () => {
          set((state) => ({
            callState: {
              ...state.callState,
              activeCall: false,
              callType: null,
              callerId: null,
              callSession: null,
              localStream: null,
              remoteStream: null,
              isMuted: false,
              isHolding: false
            }
          }));
        },
        onCallFailed: (error: { message: any; }) => {
          console.error('Call failed:', error);
          set({ error: error.message });
        }
      });
      
      set((state) => ({
        callState: {
          ...state.callState,
          callSession
        }
      }));
      
      return true;
    } catch (error) {
      console.error('Error making call:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to make call'
      });
      return false;
    }
  },
  
  // End the current call
  endCall: async () => {
    const { callState } = get();
    
    if (!callState.activeCall || !callState.callSession) {
      return false;
    }
    
    try {
      await callState.callSession.hangup();
      
      set((state) => ({
        callState: {
          ...state.callState,
          activeCall: false,
          callType: null,
          callerId: null,
          callSession: null,
          localStream: null,
          remoteStream: null,
          isMuted: false,
          isHolding: false
        }
      }));
      
      return true;
    } catch (error) {
      console.error('Error ending call:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to end call'
      });
      return false;
    }
  },
  
  // Answer an incoming call
  answerCall: async (withVideo: boolean) => {
    const { callState } = get();
    
    if (!callState.incomingCall || !callState.callSession) {
      return false;
    }
    
    try {
      await callState.callSession.accept({
        withVideo
      });
      
      set((state) => ({
        callState: {
          ...state.callState,
          activeCall: true,
          incomingCall: false,
          callType: withVideo ? 'video' : 'audio'
        }
      }));
      
      return true;
    } catch (error) {
      console.error('Error answering call:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to answer call'
      });
      return false;
    }
  },
  
  // Reject an incoming call
  rejectCall: async () => {
    const { callState } = get();
    
    if (!callState.incomingCall || !callState.callSession) {
      return false;
    }
    
    try {
      await callState.callSession.reject();
      
      set((state) => ({
        callState: {
          ...state.callState,
          incomingCall: false,
          callerId: null,
          callSession: null
        }
      }));
      
      return true;
    } catch (error) {
      console.error('Error rejecting call:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to reject call'
      });
      return false;
    }
  },
  
  // Toggle mute state of the current call
  toggleMute: async () => {
    const { callState } = get();
    
    if (!callState.activeCall || !callState.callSession) {
      return false;
    }
    
    try {
      const newMuteState = !callState.isMuted;
      
      if (newMuteState) {
        await callState.callSession.muteAudio();
      } else {
        await callState.callSession.unmuteAudio();
      }
      
      set((state) => ({
        callState: {
          ...state.callState,
          isMuted: newMuteState
        }
      }));
      
      return true;
    } catch (error) {
      console.error('Error toggling mute:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to toggle mute'
      });
      return false;
    }
  },
  
  // Toggle hold state of the current call
  toggleHold: async () => {
    const { callState } = get();
    
    if (!callState.activeCall || !callState.callSession) {
      return false;
    }
    
    try {
      const newHoldState = !callState.isHolding;
      
      if (newHoldState) {
        await callState.callSession.hold();
      } else {
        await callState.callSession.unhold();
      }
      
      set((state) => ({
        callState: {
          ...state.callState,
          isHolding: newHoldState
        }
      }));
      
      return true;
    } catch (error) {
      console.error('Error toggling hold:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to toggle hold'
      });
      return false;
    }
  },
  
  // Send DTMF tone during a call
  sendDTMF: async (tone: string) => {
    const { callState } = get();
    
    if (!callState.activeCall || !callState.callSession) {
      return false;
    }
    
    try {
      await callState.callSession.sendDTMF(tone);
      return true;
    } catch (error) {
      console.error('Error sending DTMF:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to send DTMF tone'
      });
      return false;
    }
  },
}));
