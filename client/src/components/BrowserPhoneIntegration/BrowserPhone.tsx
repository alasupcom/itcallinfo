import { useEffect, useRef, useState } from 'react';
import $ from 'jquery';
import { config } from '@/utils/config';
import BrowserPhoneStyles from './BrowserPhoneStyles';

interface BrowserPhoneProps {
  onInitialized?: () => void;
}

export default function BrowserPhone({ onInitialized }: BrowserPhoneProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only run this effect once
    if (initializedRef.current) return;
    initializedRef.current = true;

    const fetchConfig = async () => {
      try {
        // Get the configuration from API
        // const response = await fetch('/api/browser-phone/config');
        // if (!response.ok) {
        //   throw new Error('Failed to fetch phone configuration');
        // }
        
        // const config = await response.json();
        
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
              const websocketProtocol = config.transport === 'wss' ? 'wss://' : 'ws://';
              const websocketUrl = `${websocketProtocol}${config.server}:${config.port}${config.path}`;
    
              localStorage.setItem("wssServer", config.server);
              localStorage.setItem("WebSocketPort", String(config.port));
              localStorage.setItem("ServerPath", config.path);
              localStorage.setItem("profileName", config.username);
              localStorage.setItem("SipDomain", config.domain);
              localStorage.setItem("SipUsername", config.username);
              localStorage.setItem("SipPassword", config.password);
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
                  serverAddress: "${config.server}",
                  WebSocketPort: "${config.port}",
                  ServerPath: "${config.path}",
                  SipUsername: "${config.username}",
                  SipPassword: "${config.password}",
                  SipDomain: "${config.domain}",
                  regExpires: ${config.regExpires},
                  Transport: "${config.transport}",
                  DoRegistration: ${config.doRegistration},
                  
                  // Critical options to skip welcome and configuration screens
                  loadAlternateLang: true,
                  profileUser: "${config.username}",
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
                  options.wsServerProtocol = "${config.transport}";
                  options.ServerPath = "${config.path}";
                  options.WebSocketPort = "${config.port}"; 
                  options.ServerAddress = "${config.server}";
                  options.SipUsername = "${config.username}";
                  options.SipPassword = "${config.password}";
                  options.SipDomain = "${config.domain}";
                  options.DoRegistration = ${config.doRegistration};
                  options.Transport = "${config.transport}";
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
                    statusDisplay.id = 'status-error';
                    statusDisplay.innerHTML = '<div style="position: absolute; top: 10px; right: 10px; background-color: #e00000; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px;">Connection Error</div>';
                    document.body.appendChild(statusDisplay);
                    
                    // Force offline mode instead of showing config
                    window.$("#WebRtcFailed").hide();
                    window.ShowBuddies();
                  }
                };
                
                // Completely disable all settings menus
                web_hook_on_config_menu = function(event) {
                  event.preventDefault();
                  return false;
                };
                
                // Override all settings-related functions
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
                  options.wsServerProtocol = "${config.transport}";
                  options.ServerPath = "${config.path}";
                  options.WebSocketPort = "${config.port}"; 
                  options.ServerAddress = "${config.server}";
                  options.SipUsername = "${config.username}";
                  options.SipPassword = "${config.password}";
                  options.SipDomain = "${config.domain}";
                  options.DoRegistration = ${config.doRegistration};
                  options.Transport = "${config.transport}";
                  
                  // Disable all settings-related menus and functions by overriding them
                  window.ShowSettings = function() { console.log("Settings disabled"); return false; };
                  window.ShowAccountSettings = function() { console.log("Account settings disabled"); return false; };
                  window.ShowAudioVideoSettings = function() { console.log("Audio/Video settings disabled"); return false; };
                  window.ShowAppearanceSettings = function() { console.log("Appearance settings disabled"); return false; };
                  window.ShowNotificationsSettings = function() { console.log("Notification settings disabled"); return false; };
                  window.ConfigureAccount = function() { console.log("Account configuration disabled"); return false; };
                  window.ToggleHeadset = function() { console.log("Headset toggle disabled"); return false; };
                  window.ToggleAudioSources = function() { console.log("Audio sources disabled"); return false; };
                  window.ToggleVideoSources = function() { console.log("Video sources disabled"); return false; };
                  window.ToggleSettings = function() { console.log("Settings toggle disabled"); return false; };
                  window.SettingsMenu = function() { console.log("Settings menu disabled"); return false; };
                  
                  // Critical - override the actual welcome screen functions
                  window.ShowWelcomeScreen = function() { console.log("Welcome screen disabled"); return false; };
                  window.HideWelcomeScreen = function() { /* Do nothing, already hidden */ };
                  
                  // Override the wizard functions and setup
                  window.GUI.ShowWebRtcPermissions = function() { return true; /* Skip permissions */ };
                  window.StartWizard = function() { console.log("Wizard disabled"); return false; };
                  window.ConfigureExtensionSettings = function() { console.log("Extension settings disabled"); return false; };
                  window.ShowMyProfileMenu = function() { console.log("Profile menu disabled"); return false; };
                  
                  // The most important part - override Phone.Start to skip any welcome screen
                  const originalPhoneStart = window.Phone.prototype.Start;
                  window.Phone.prototype.Start = function() {
                    // Force all config values before we start
                    this.config.webSocketUrl = "${websocketUrl}";
                    this.config.serverAddress = "${config.server}";
                    this.config.WebSocketPort = "${config.port}";
                    this.config.ServerPath = "${config.path}";
                    this.config.SipUsername = "${config.username}";
                    this.config.SipPassword = "${config.password}";
                    this.config.SipDomain = "${config.domain}";
                    this.config.Transport = "${config.transport}";
                    this.config.DoRegistration = ${config.doRegistration};
                    
                    // Before the original Start function runs, hide welcome
                    const welcomeDiv = document.getElementById('welcome');
                    if(welcomeDiv) welcomeDiv.style.display = 'none';
                    
                    // Skip the welcome screen check in the original method
                    this.welcomeScreen = false;
                    
                    // Ensure callbacks happen properly
                    this.userAgent = {
                      registering: false,
                      isRegistered: function() { return false; }
                    };
                    
                    // Call the original
                    const result = originalPhoneStart.apply(this, arguments);
                    
                    // After starting, remove the welcome screen entirely from DOM and force register
                    setTimeout(function() {
                      // Remove welcome elements
                      const welcomeScreens = document.querySelectorAll('#welcome, #welcomeScreen, .welcome-screen-container, #register-container');
                      welcomeScreens.forEach(function(el) {
                        if(el && el.parentNode) {
                          el.parentNode.removeChild(el);
                        }
                      });
                      
                      // Force register by removing the entire wizard flow
                      // if(window.setDbItem) {
                      //   window.setDbItem("profileUserID", "${config.username}@${config.domain}");
                      //   window.setDbItem("profileName", "${config.username}");
                      //   window.setDbItem("WebSocketUrl", "${websocketUrl}");
                      //   window.setDbItem("ServerPath", "${config.path}");
                      //   window.setDbItem("SipUsername", "${config.username}");
                      //   window.setDbItem("SipPassword", "${config.password}");  
                      //   window.setDbItem("SipDomain", "${config.domain}");
                      //   window.PlanCheck();
                      // }
                      
                      // Since this is the initial load, we need to ensure the UI shows the phone correctly
                      document.getElementById("Phone").style.display = '';
                      
                      // Make the main phone UI visible immediately
                      const mainView = document.getElementById("MainView");
                      if(mainView) mainView.style.display = '';
                      
                      // Show Buddies View (the main phone interface)
                      if(window.ShowBuddies) window.ShowBuddies();
                      
                      console.log("Setup complete, welcome screen overridden");
                    }, 100);
                    
                    return result;
                  };
                };
                
                console.log("Browser-Phone dynamic configuration injected");
              `;
              
              // Inject the script into the iframe
              iframe.contentDocument?.head.appendChild(script);
              
              // Also inject a style element to hide all configuration UI elements
              const styleEl = document.createElement('style');
              styleEl.textContent = `
                /* Hide all settings and configuration menus */
                // #settings, 
                // #btnSwitchAccounts, 
                // #WebRtcSettings,
                // // #SettingsMenu,
                // .menu-item-settings,
                // #Register, 
                // #offlineCheck,
                // #menu-configuration-container,
                // #menu-settings-container,
                // #AccSettings,
                // #AudioVideoSettings, 
                // #AppearanceSettings,
                // #NotificationsSettings,
                // #btn-configure-account,
                // #AccountSettings,
                // #divCdrReport,
                // #LanguageItems,
                // .configure-account-button,
                // .settings-item {
                //   display: none !important;
                // }
                
                /* Hide menu options related to settings */
                // .menu-item-settings,
                // .menu-item-accounts,
                // .menu-item-appearance,
                // .menu-item-notifications,
                // .menu-item-audio-video,
                // .menu-item-notifications,
                // [onclick*="SettingsMenu"],
                // [onclick*="ShowSettings"],
                // #mainMenu li:has([onclick*="Settings"]) {
                //   display: none !important;
                // }
                
                // /* Hide audio and video config button in call UI */
                // .call-control-button[title*="Settings"],
                // .call-control-button[title*="Audio"],
                // .call-control-button[title*="Video"] {
                //   display: none !important;
                // }
              `;
              iframe.contentDocument?.head.appendChild(styleEl);
              
              // Add a MutationObserver as a final defensive measure to remove any configuration elements
              const observer = new MutationObserver((mutations) => {
                const configElements = iframe.contentDocument?.querySelectorAll(
                  '#settings, #WebRtcSettings, #AccSettings, ' +
                  '#AudioVideoSettings, #AppearanceSettings, #NotificationsSettings, ' +
                  '#AccountSettings, #btn-configure-account, .menu-item-settings, ' +
                  '.settings-item, #menu-settings-container, #menu-configuration-container'
                );
                TODO:
                // Hide any config elements that might have appeared
                if (configElements && configElements.length > 0) {
                  configElements.forEach(el => {
                    (el as HTMLElement).style.display = 'none';
                  });
                }
              });
              
              // Start observing the iframe document with the configured parameters
              observer.observe(iframe.contentDocument?.documentElement as Node, {
                childList: true,
                subtree: true
              });
              
              // Set loading to false once iframe is loaded
              setLoading(false);
              
              // Call initialization callback
              if (onInitialized) {
                onInitialized();
              }
            } catch (error) {
              console.error("Error injecting configuration:", error);
              setError("Error configuring Browser-Phone");
              setLoading(false);
            }
          };
          
          // Wait for iframe to load
          iframeRef.current.onload = setupIframe;
        }
      } catch (err) {
        console.error("Error fetching configuration:", err);
        setError(err instanceof Error ? err.message : 'Failed to fetch phone configuration');
        setLoading(false);
      }
    };
    
    // Start the config fetch process
    fetchConfig();
    
    // Set up listener for events from iframe
    const handlePhoneEvent = (event: CustomEvent) => {
      const detail = event.detail;
      console.log("Browser-Phone Event:", detail);
      
      // Additional event handling can go here
    };
    
    window.addEventListener('browser-phone-event', handlePhoneEvent as EventListener);
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('browser-phone-event', handlePhoneEvent as EventListener);
    };
  }, [onInitialized]);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden min-h-[600px] relative">
      {/* Error State */}
      {error && (
        <div className="p-6 text-center text-red-500 absolute inset-0 flex flex-col items-center justify-center bg-white">
          <span className="material-icons text-4xl mb-2">error_outline</span>
          <p className="font-medium">Failed to load Browser-Phone</p>
          <p className="text-sm text-gray-600 mt-2">{error}</p>
        </div>
      )}
      
      {/* Loading State */}
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-2"></div>
            <p className="text-gray-600">Loading Browser-Phone...</p>
          </div>
        </div>
      )}
      
      {/* Browser-Phone iframe - using our custom HTML with pre-configured options */}
      <iframe
        ref={iframeRef}
        src="/Browser-Phone-master/Phone/index.html"
        className={`w-full h-full border-0 ${loading || error ? 'opacity-0' : 'opacity-100'}`}
        style={{ minHeight: '600px' }}
        title="Browser Phone"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      />
      <BrowserPhoneStyles iframeRef={iframeRef as React.RefObject<HTMLIFrameElement>} />
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
