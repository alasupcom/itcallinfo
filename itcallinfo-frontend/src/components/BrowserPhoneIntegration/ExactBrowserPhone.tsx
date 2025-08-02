import { useRef, useState, useEffect, useCallback } from 'react';
import BrowserPhoneStyles from './BrowserPhoneStyles';
import { Loader2 } from 'lucide-react';
import Unmounted from './shared/Unmounted';
import { useSipStore } from '@/store/sipStore';

interface ExactBrowserPhoneProps {
  onInitialized?: () => void;
  onEvent?: (event: any) => void;
}

export default function ExactBrowserPhone({ onInitialized, onEvent }: ExactBrowserPhoneProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);
  const configRef = useRef<any>(null);
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    connectionStatusText: 'Initializing...'
  });

  const { sipConfig, reconnect, fetchConfig } = useSipStore();

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

  // Handle iframe messages and events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only handle messages from our iframe
      if (iframeRef.current && event.source === iframeRef.current.contentWindow) {

        // If iframe is requesting configuration
        if (event.data === 'requestConfig' && sipConfig) {
          console.log("Sending dynamic configuration to Browser-Phone");

          const websocketProtocol = sipConfig.transport === 'wss' ? 'wss://' : 'ws://';
          const websocketUrl = `${websocketProtocol}${sipConfig.server}:${sipConfig.port}/ws`;

          localStorage.setItem("wssServer", sipConfig.server);
          localStorage.setItem("WebSocketPort", String(sipConfig.port));
          localStorage.setItem("ServerPath", "/ws");
          localStorage.setItem("profileName", sipConfig.username);
          localStorage.setItem("SipDomain", sipConfig.domain);
          localStorage.setItem("SipUsername", sipConfig.username);
          localStorage.setItem("SipPassword", sipConfig.password);

          // Send configuration to iframe
          iframeRef.current.contentWindow?.postMessage({
            type: 'phoneConfig',
            config: {
              webSocketUrl: websocketUrl,
              serverAddress: sipConfig.server,
              webSocketPort: sipConfig.port,
              serverPath: "/ws",
              sipUsername: sipConfig.username,
              sipPassword: sipConfig.password,
              sipDomain: sipConfig.domain,
              regExpires: 0,
              transport: sipConfig.transport,
              doRegistration: false
            }
          }, '*');
        } else if (event.data === 'requestConfig' && !sipConfig) {
          // No SIP configuration available
          setError('No SIP configuration available');
          console.error('No SIP configuration available for user');
        }

        // Forward events from iframe to React
        if (event.data && event.data.event) {
          const customEvent = new CustomEvent('browser-phone-event', {
            detail: event.data
          });
          window.dispatchEvent(customEvent);

          if (onEvent) {
            onEvent(event.data);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    setLoading(false);
    return () => window.removeEventListener('message', handleMessage);
  }, [onEvent, sipConfig]);

  // Subscribe to the window event to update the connection status
  useEffect(() => {
    const handlePhoneEvent = (event: CustomEvent) => {
      const { detail } = event;

      if (detail.event === "sipRegisterConnected") {
        setConnectionStatus({
          isConnected: true,
          connectionStatusText: "Connected"
        });
      } else if (detail.event === "sipRegisterDisconnected") {
        setConnectionStatus({
          isConnected: false,
          connectionStatusText: "Disconnected"
        });
      }
    };

    window.addEventListener("browser-phone-event", handlePhoneEvent as EventListener);
    return () => {
      window.removeEventListener("browser-phone-event", handlePhoneEvent as EventListener);
    };
  }, [sipConfig]);

  // Handle iframe load event
  const handleIframeLoad = useCallback(() => {
    console.log("Browser Phone iframe loaded");
    setLoading(false);

    if (!initialized.current) {
      initialized.current = true;

      // Call initialization callback
      if (onInitialized) {
        onInitialized();
      }
    }

    // Force the phone UI to be visible but for our component, no longer needed for UI display
    setTimeout(() => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage("showPhoneUI", "*");
          console.log("Initialized phone interface");
        } catch (err) {
          console.error("Error initializing phone:", err);
        }
      }
    }, 500);
  }, [onInitialized]);

  const handleRemount = () => {
    console.log("error with phone interface", error);
    reconnect();
  };

  // Show error if no SIP configuration is available
  if (!sipConfig && !loading) {
    return (
      <div className="relative h-full">
        <div className="p-6 text-center bg-white rounded-lg shadow-lg border border-gray-200 h-full flex flex-col items-center justify-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No SIP Configuration Available</h3>
          <p className="text-gray-600 mb-4">Unable to load phone configuration. Please contact support.</p>
          <button
            onClick={handleRemount}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative h-full">
        <Unmounted handleRemount={handleRemount} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="relative h-full">
        <div className="p-6 text-center bg-white rounded-lg shadow-lg border border-gray-200 h-full flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-gray-600">Loading Phone Interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Original Browser-Phone iframe */}
      {!loading && sipConfig && (
        <div className="browser-phone-container"
          style={{ maxWidth: '100%', height: '100%', margin: '0 auto' }}
        >
          <iframe
            ref={iframeRef}
            src="/Browser-Phone-master/Phone/index.html"
            // src="/browser-phone-custom.html"
            style={{ width: '100%', height: '100%', border: '1px solid #e2e8f0', borderRadius: '8px' }}
            title="Browser Phone"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            allow="microphone; camera; autoplay; display-capture"
            loading="lazy"
            onLoad={handleIframeLoad}
          />

          {/* Apply modern styles to the iframe content */}
          <BrowserPhoneStyles iframeRef={iframeRef} setError={setError} setLoading={setLoading} />
        </div>
      )}

      {/* Configuration source indicator */}
      {/* <div className="text-xs text-gray-500 text-center mt-2">
        {error ? 'Using fallback configuration' : 'Using database configuration'}
      </div> */}
    </div>
  );
}