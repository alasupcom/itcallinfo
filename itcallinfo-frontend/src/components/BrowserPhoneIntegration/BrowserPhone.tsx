import { useEffect, useRef, useState } from 'react';
import $ from 'jquery';
import { useSipStore } from '@/store/sipStore';
import BrowserPhoneStyles from './BrowserPhoneStyles';

interface BrowserPhoneProps {
  onInitialized?: () => void;
}

export default function BrowserPhone({ onInitialized }: BrowserPhoneProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const initializedRef = useRef(false);

  const { sipConfig, fetchConfig } = useSipStore();

  // Fetch SIP configuration on component mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        await fetchConfig();
      } catch (error) {
        setError('Failed to load SIP configuration');
        console.error('Error loading SIP config:', error);
      }
    };
    
    loadConfig();
  }, [fetchConfig]);

  useEffect(() => {
    // Only run this effect once
    if (initializedRef.current) return;
    initializedRef.current = true;

    const setupPhone = async () => {
      try {
        // Wait for SIP configuration to be loaded
        if (!sipConfig) {
          setError('No SIP configuration available');
          return;
        }
        
        // Once config is fetched, we'll need to inject it into the iframe
        if (iframeRef.current) {
          // Function to inject phone configuration into iframe
          const setupIframe = () => {
            const iframe = iframeRef.current;
            if (!iframe || !iframe.contentWindow) return;
            
            try {
              // Create a script element to inject configuration
              const script = document.createElement('script');
              script.type = 'text/javascript';
              
              // Create phoneOptions based on our dynamic config
              const websocketProtocol = sipConfig.transport === 'wss' ? 'wss://' : 'ws://';
              const websocketUrl = `${websocketProtocol}${sipConfig.server}:${sipConfig.port}/ws`;
    
              localStorage.setItem("wssServer", sipConfig.server);
              localStorage.setItem("WebSocketPort", String(sipConfig.port));
              localStorage.setItem("ServerPath", "/ws");
              localStorage.setItem("profileName", sipConfig.username);
              localStorage.setItem("SipDomain", sipConfig.domain);
              localStorage.setItem("SipUsername", sipConfig.username);
              localStorage.setItem("SipPassword", sipConfig.password);
              // This will inject our dynamic configuration and customize the behavior
              script.textContent = `
                // First, hide any initial configuration forms that might appear
                // document.addEventListener("DOMContentLoaded", function() {
                //   // Hide welcome screen and settings form immediately
                //   var style = document.createElement('style');
                //   style.innerHTML = \`
                //     #welcome, #welcomeScreen, #setup, #settings, #wizard,
                //     #config, #registration, .ui-settings, #security,
                //     .welcome-screen-container {
                //       display: none !important;
                //       visibility: hidden !important;
                //       opacity: 0 !important;
                //       height: 0 !important;
                //       overflow: hidden !important;
                //       position: absolute !important;
                //       pointer-events: none !important;
                //       z-index: -9999 !important;
                //     }
                //   \`;
                //   document.head.appendChild(style);
                // });
                
                // Override phoneOptions with our configuration
                phoneOptions = {
                  webSocketUrl: "${websocketUrl}",
                  serverAddress: "${sipConfig.server}",
                  WebSocketPort: "${sipConfig.port}",
                  ServerPath: "/ws",
                  SipUsername: "${sipConfig.username}",
                  SipPassword: "${sipConfig.password}",
                  SipDomain: "${sipConfig.domain}",
                  regExpires: 0,
                  Transport: "${sipConfig.transport}",
                  DoRegistration: false,
                  
                  // Critical options to skip welcome and configuration screens
                  loadAlternateLang: true,
                  profileUser: "${sipConfig.username}",
                  userLoggedIn: true,
                  welcomeScreen: false,
                  autoStart: true,
                  autocAnswerEnabled: false,
                  enableAutoAnswer: false,
                  loadExtensionVariables: false,
                  skipWelcomeScreen: true,
                  autoConnect: true,
                  hideSettings: true,
                  hideRegistration: true,
                  
                  // Disable localStorage usage
                  localStoragePreference: false
                };
                
                // Hook into Phone initialization to auto-start with our config
                web_hook_on_before_init = function(options) {
                  console.log("Initializing with dynamic config...");
                  
                  // Clear any stored credentials from localStorage
                  window.localStorage.removeItem("profileUserID");
                  window.localStorage.removeItem("WebSocketUrl");
                  window.localStorage.removeItem("ServerPath");
                  window.localStorage.removeItem("SipUsername");
                  window.localStorage.removeItem("SipPassword"); 
                  window.localStorage.removeItem("SipDomain");
                  window.localStorage.removeItem("TransportConnections");
                  
                  // Force settings to use our configuration
                  options.wsServerProtocol = "${sipConfig.transport}";
                  options.ServerPath = "/ws";
                  options.WebSocketPort = "${sipConfig.port}"; 
                  options.ServerAddress = "${sipConfig.server}";
                  options.SipUsername = "${sipConfig.username}";
                  options.SipPassword = "${sipConfig.password}";
                  options.SipDomain = "${sipConfig.domain}";
                  options.DoRegistration = false;
                  options.Transport = "${sipConfig.transport}";
                };
                
                // Hook right after UserAgent initialization to hide settings
                web_hook_on_userAgent_created = function(ua) {
                  // Hide the settings UI after a short delay to ensure DOM is ready
                  setTimeout(function() {
                    // Hide settings menu item
                    var settingsMenu = document.querySelector("#settings");
                    if (settingsMenu) settingsMenu.style.display = "none";
                    
                    // Ensure connection happens automatically
                    console.log("Auto-connecting with dynamic configuration...");
                  }, 100);
                };
                
                // Add event hooks for React integration with better error handling
                web_hook_on_register = function(ua) {
                  window.parent.dispatchEvent(new CustomEvent('browser-phone-event', { 
                    detail: { event: 'sipRegisterConnected' } 
                  }));
                  console.log("Browser-Phone registered successfully");
                  
                  // Show a successful connection message
                  if(window.$) {
                    window.$("#regStatus").css("color", "#009900");
                    window.$("#WebRtcFailed").hide();
                    
                    // Display in UI that we're connected
                    const statusDisplay = document.createElement('div');
                    statusDisplay.id = 'status-connected';
                    statusDisplay.innerHTML = '<div style="position: absolute; top: 10px; right: 10px; background-color: #009900; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px;">Connected</div>';
                    document.body.appendChild(statusDisplay);
                  }
                };
                
                web_hook_on_registrationFailed = function(e) {
                  window.parent.dispatchEvent(new CustomEvent('browser-phone-event', { 
                    detail: { event: 'sipRegisterDisconnected' } 
                  }));
                  console.log("Browser-Phone registration failed:", e);
                  
                  // Show a connection failed message but don't show settings
                  if(window.$) {
                    window.$("#regStatus").css("color", "#FFB31A");
                    window.$("#regStatus").text("Connection failed - Using offline mode");
                    
                    // Display in UI that connection failed
                    const statusDisplay = document.createElement('div');
                    statusDisplay.id = 'status-failed';
                    statusDisplay.innerHTML = '<div style="position: absolute; top: 10px; right: 10px; background-color: #FFB31A; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px;">Offline Mode</div>';
                    document.body.appendChild(statusDisplay);
                    
                    // Force offline mode instead of showing config
                    window.$("#WebRtcFailed").hide();
                    // Skip the config form by going directly to buddies
                    window.ShowBuddies();
                  }
                };
                
                web_hook_on_transportError = function(t, ua) {
                  window.parent.dispatchEvent(new CustomEvent('browser-phone-event', { 
                    detail: { event: 'sipRegisterDisconnected', error: t } 
                  }));
                  console.log("Browser-Phone transport error:", t);
                  
                  // Show a connection failed message but don't show settings
                  if(window.$) {
                    window.$("#regStatus").css("color", "#e00000");
                    window.$("#regStatus").text("WebSocket connection failed");
                    
                    // Display in UI that connection failed
                    const statusDisplay = document.createElement('div');
                    statusDisplay.id = 'status-failed';
                    statusDisplay.innerHTML = '<div style="position: absolute; top: 10px; right: 10px; background-color: #e00000; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px;">Connection Failed</div>';
                    document.body.appendChild(statusDisplay);
                    
                    // Force offline mode instead of showing config
                    window.$("#WebRtcFailed").hide();
                    // Skip the config form by going directly to buddies
                    window.ShowBuddies();
                  }
                };
                
                // Hook for call events
                web_hook_on_invite = function(session) {
                  window.parent.dispatchEvent(new CustomEvent('browser-phone-event', { 
                    detail: { event: 'incomingCall', session: session } 
                  }));
                  console.log("Incoming call received");
                };
                
                web_hook_on_call_connected = function(session) {
                  window.parent.dispatchEvent(new CustomEvent('browser-phone-event', { 
                    detail: { event: 'callConnected', session: session } 
                  }));
                  console.log("Call connected");
                };
                
                web_hook_on_call_ended = function(session) {
                  window.parent.dispatchEvent(new CustomEvent('browser-phone-event', { 
                    detail: { event: 'callEnded', session: session } 
                  }));
                  console.log("Call ended");
                };
              `;
              
              // Inject the script into the iframe
              iframe.contentDocument?.head.appendChild(script);
              
              console.log("Dynamic configuration injected into Browser-Phone");
            } catch (err) {
              console.error("Error setting up iframe:", err);
              setError("Failed to configure phone interface");
            }
          };
          
          // Wait for iframe to load before injecting configuration
          if (iframeRef.current.contentDocument?.readyState === 'complete') {
            setupIframe();
          } else {
            iframeRef.current.addEventListener('load', setupIframe);
          }
        }
      } catch (error) {
        console.error("Error setting up phone:", error);
        setError("Failed to initialize phone interface");
      }
    };

    setupPhone();
  }, [sipConfig]);

  // Handle iframe load event
  const handleIframeLoad = () => {
    console.log("Browser Phone iframe loaded");
    setLoading(false);

    // Call initialization callback
    if (onInitialized) {
      onInitialized();
    }
  };

  // Handle phone events from iframe
  useEffect(() => {
    const handlePhoneEvent = (event: CustomEvent) => {
      const { detail } = event;
      console.log("Phone event received:", detail.event);
      
      // Handle different phone events here
      switch (detail.event) {
        case 'sipRegisterConnected':
          console.log("SIP registration successful");
          break;
        case 'sipRegisterDisconnected':
          console.log("SIP registration failed or disconnected");
          break;
        case 'incomingCall':
          console.log("Incoming call received");
          break;
        case 'callConnected':
          console.log("Call connected");
          break;
        case 'callEnded':
          console.log("Call ended");
          break;
        default:
          console.log("Unknown phone event:", detail.event);
      }
    };

    window.addEventListener('browser-phone-event', handlePhoneEvent as EventListener);
    return () => {
      window.removeEventListener('browser-phone-event', handlePhoneEvent as EventListener);
    };
  }, []);

  // Show error if no SIP configuration is available
  if (!sipConfig && !loading) {
    return (
      <div className="p-6 text-center bg-white rounded-lg shadow-lg border border-gray-200 h-full flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No SIP Configuration Available</h3>
        <p className="text-gray-600 mb-4">Unable to load phone configuration. Please contact support.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center bg-white rounded-lg shadow-lg border border-gray-200 h-full flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuration Error</h3>
        <p className="text-gray-600 mb-4">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center bg-white rounded-lg shadow-lg border border-gray-200 h-full flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Phone Interface...</p>
      </div>
    );
  }

  return (
    <div className="browser-phone-container" style={{ maxWidth: '100%', height: '100%', margin: '0 auto' }}>
      {sipConfig && (
        <iframe
          ref={iframeRef}
          src="/Browser-Phone-master/Phone/index.html"
          style={{ width: '100%', height: '100%', border: '1px solid #e2e8f0', borderRadius: '8px' }}
          title="Browser Phone"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          allow="microphone; camera; autoplay; display-capture"
          loading="lazy"
          onLoad={handleIframeLoad}
        />
      )}
      
      {/* Apply modern styles to the iframe content */}
      <BrowserPhoneStyles iframeRef={iframeRef} setError={setError} setLoading={setLoading} />
    </div>
  );
}

// Add necessary types for Browser-Phone to window
declare global {
  interface Window {
    phone: any;
    userAgent: any;
    RefreshRegister: () => void;
    OverlayClose: () => void;
    webkitSpeechRecognition: any;
    webkitRTCPeerConnection: any;
    mozRTCPeerConnection: any;
    sipML: any;
    sessionStorage: any;
    Phone: any;
    $: any & {
      isFunction: boolean;
      fn: any;
    };
  }
}
