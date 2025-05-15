// // Type definitions for Browser-Phone
// // This helps TypeScript understand the global Browser-Phone functions

// interface BrowserPhoneConfig {
//   WebSocketUrl: string;
//   SipUsername: string;
//   SipPassword: string;
//   SipDomain?: string;
//   WssServer?: string;
//   ServerPort?: string;
//   RegisterExpires?: string;
//   TransportConfig?: { wsServers: string };
//   audioElement?: HTMLElement | null;
//   ringbackElement?: HTMLElement | null;
//   ringElement?: HTMLElement | null;
//   allowAutoAnswerSuggestion?: boolean;
//   allowDuplicateSessions?: boolean;
//   userAgentStr?: string | null;
//   hostingPrefex?: string;
//   RegisterTokenAuth?: string;
//   WssInTransport?: boolean;
//   AutoAnswerEnabled?: boolean;
//   StartVideoFullScreen?: boolean;
//   ShowCallAnswerWindow?: boolean;
//   EnableTextMessaging?: boolean;
//   EnableVideoCalling?: boolean;
//   AutoGainControl?: boolean;
//   EchoCancellation?: boolean;
//   NoiseSuppression?: boolean;
//   EnableSimulcast?: boolean;
//   enableSvcNotifications?: boolean;
//   [key: string]: any;
// }

// interface BrowserPhoneCallOptions {
//   calledDestination: string;
//   audioOnly?: boolean;
//   [key: string]: any;
// }

// // Custom jQuery plugin interfaces
// interface JQuery {
//   TransitionEndSounds(): JQuery;
//   WebRtcPhone(options?: BrowserPhoneConfig): JQuery;
// }

// // Extend Window interface to include Browser-Phone globals
// interface Window {
//   // Main configuration and initialization
//   ConfigurePhone: (config: BrowserPhoneConfig) => void;
//   UnloadPhone: () => void;
  
//   // Call controls
//   MakeCall: (number: string, options?: BrowserPhoneCallOptions) => void;
//   AnswerCall: (lineNum: string) => void;
//   RejectCall: (lineNum: string) => void;
//   EndCall: (lineNum: string) => void;
//   TerminateAllCalls: () => void;
  
//   // Audio controls
//   Mute: (lineNum: string) => void;
//   Unmute: (lineNum: string) => void;
  
//   // Hold controls
//   Hold: (lineNum: string) => void;
//   Unhold: (lineNum: string) => void;
  
//   // Transfer controls
//   BlindTransfer: (lineNum: string, destination: string) => void;
//   AttendedTransfer: (lineNum: string, destination: string) => void;
  
//   // Video controls
//   ShowVideo: (lineNum: string) => void;
//   HideVideo: (lineNum: string) => void;
  
//   // DTMF controls
//   SendDTMF: (lineNum: string, digit: string) => void;
  
//   // Buddy and presence functions
//   AddBuddy: (obj: any) => void;
//   SubscribeBuddyAccept: (buddyId: string) => void;
  
//   // Chat functions
//   SendChatMessage: (buddyId: string, message: string) => void;
  
//   // Other utility functions
//   getAudioSrcID: () => string;
//   getVideoSrcID: () => string;
//   StartRecording: (lineNum: string) => void;
//   StopRecording: (lineNum: string) => void;
  
//   // Status and event handling
//   getLineState: (lineNum: string) => string;
//   isRegistered: () => boolean;
  
//   // jQuery and third-party libraries
//   $: JQueryStatic;
//   moment: any;
//   Chart: any;
// }