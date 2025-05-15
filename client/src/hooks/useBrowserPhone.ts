import { config } from '@/utils/config';
import { useCallback, useState } from 'react';

interface UseBrowserPhoneOptions {
  onScriptsLoaded?: () => void;
  onInitialized?: () => void;
  onError?: (error: string) => void;
}

interface PhoneConfig {
  serverAddress: string;
  webSocketPort: string;
  serverPath: string;
  sipUsername: string;
  sipPassword: string;
  sipDomain: string;
  regExpires: number;
  transport: string;
  doRegistration: boolean;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

// List of scripts and stylesheets from the Browser-Phone project
// These should be loaded in this specific order
const PHONE_RESOURCES = {
  css: [
    "/browser-phone/phone.css",
  ],
  scripts: [
    // Phone scripts only (jQuery is loaded in the HTML)
    "/browser-phone/phone.js",
    "/browser-phone/lang/en.js"
  ]
};

export function useBrowserPhone(options: UseBrowserPhoneOptions = {}) {
  const [status, setStatus] = useState<Status>('idle');

  // Function to load a script
  const loadScript = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.appendChild(script);
    });
  }, []);

  // Function to load a CSS file
  const loadCSS = useCallback((href: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
      document.head.appendChild(link);
    });
  }, []);

  // Main function to load Browser-Phone
  const loadBrowserPhone = useCallback(async (container: HTMLDivElement) => {
    if (status === 'loading') return;
    
    setStatus('loading');
    
    try {
      // Load CSS files in parallel
      await Promise.all(PHONE_RESOURCES.css.map(css => loadCSS(css)));
      
      // Load scripts sequentially to maintain dependency order
      for (const script of PHONE_RESOURCES.scripts) {
        await loadScript(script);
      }
      
      if (options.onScriptsLoaded) {
        options.onScriptsLoaded();
      }
      
      // Initialize Browser-Phone
      await initializeBrowserPhone(container);
      
      if (options.onInitialized) {
        options.onInitialized();
      }
      
      setStatus('success');
    } catch (error) {
      console.error('Error loading Browser-Phone:', error);
      setStatus('error');
      if (options.onError) {
        options.onError(error instanceof Error ? error.message : 'Failed to load Browser-Phone');
      }
    }
  }, [loadCSS, loadScript, options, status]);

  // Function to initialize Browser-Phone with dynamic config from API
  const initializeBrowserPhone = useCallback(async (container: HTMLDivElement) => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Create a proxy to intercept events from Browser-Phone
        const originalJquery = window.$;
        if (originalJquery) {
          const originalOn = originalJquery.fn.on;
          originalJquery.fn.on = function(this: any, ...args: any[]) {
            // Call the original method
            const result = originalOn.apply(this, args);
            
            // Intercept SIP phone events to dispatch to React
            if (args[0] === 'registered' || args[0] === 'registrationFailed') {
              const eventName = args[0] === 'registered' ? 'sipRegisterConnected' : 'sipRegisterDisconnected';
              window.dispatchEvent(new CustomEvent('browser-phone-event', { 
                detail: { event: eventName } 
              }));
            }
            
            return result;
          };
        }
        
        // Set required global vars used by Browser-Phone
        window.webkitSpeechRecognition = window.webkitSpeechRecognition || (() => {});
        
        // Browser phone should be initialized once jQuery and other dependencies are loaded
        if (window.$ && window.$.isFunction) {
          // Create phone container DIV - using original markup structure
          container.innerHTML = `
            <div id="Phone">
              <div id="Phone_call_fullscreen"></div>
              <div id="Phone_call_popout"></div>
              <div id="Phone_call_recording"></div>
              <div id="Phone_search">
                <input id="txtFindBuddy" type="text" placeholder="Filter" autocomplete="none"/>
                <button id="btnClearSearch" class="ui-button"><span class="ui-icon-close"></span></button>
              </div>
              <div id="Phone_dialpad">
                <div style="display:none;">
                  <input id="dialText" readonly type="text"/>
                  <div class="dialButtons">
                    <button id="dialDeleteButton"><span class="ui-icon-delete"></span></button>
                    <button id="dialAddButton"><span class="ui-icon-add"></span></button>
                  </div>
                </div>
                <ul id="dialPad"></ul>
              </div>
              <div id="Phone_panels"></div>

              <div class="progressBar">
                <div class="progressBarFill"></div>
                <div class="progressBarText"></div>
              </div>

              <div id="actionArea"></div>
            </div>
          `;
          
          // Fetch configuration from API
          try {
            // const response = await fetch('/api/browser-phone/config');
            // if (!response.ok) {
            //   throw new Error('Failed to fetch phone configuration');
            // }
            
            // const config: PhoneConfig = await response.json();
            
            // Map API config to Browser-Phone options
            const websocketProtocol = config.transport === 'wss' ? 'wss://' : 'ws://';
            const websocketUrl = `${websocketProtocol}${config.serverAddress}:${config.webSocketPort}${config.serverPath}`;
            
            const phoneOptions = {
              loadAlternateLang: "",
              webSocketUrl: websocketUrl,
              defaultUser: config.sipUsername,
              enableAutoAnswer: false,
              hostingPrefex: "",
              noCacheOnLoad: false,
              numberOfSounds: 19,
              welcomeScreen: false,
              loadExtensionVariables: false,
              profileUser: config.sipUsername,
              userLoggedIn: true,
              wssServerParamas: {},
              // Dynamic configuration from API
              serverAddress: config.serverAddress,
              WebSocketPort: config.webSocketPort,
              ServerPath: config.serverPath,
              SipUsername: config.sipUsername,
              SipPassword: config.sipPassword,
              SipDomain: config.sipDomain,
              regExpires: config.regExpires,
              VoicemailDid: "",
              VoicemailSubscribe: false,
              Transport: config.transport,
              DoRegistration: config.doRegistration
            };
            
            // Initialize phone with dynamic config
            window.phone = new window.Phone("Phone", phoneOptions);
            window.phone.Start();
            
            resolve();
          } catch (err) {
            console.error("Error fetching configuration or initializing Browser-Phone:", err);
            reject(err);
          }
        } else {
          reject(new Error("jQuery not loaded"));
        }
      } catch (error) {
        console.error("Error initializing Browser-Phone:", error);
        reject(error);
      }
    });
  }, []);

  return {
    loadBrowserPhone,
    status
  };
}
